from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from fastapi import APIRouter
from sqlalchemy import desc, select

from app.api.deps import CurrentUser, DbDep
from app.models.enums import OpportunityStatus
from app.models.opportunity import Opportunity
from app.models.saved_opportunity import SavedOpportunity
from app.models.source import ScrapingLog

router = APIRouter()


@router.get("", response_model=dict[str, Any])
def get_user_notifications(db: DbDep, current_user: CurrentUser) -> dict[str, Any]:
    """Retrieve actionable in-app notifications for the user:
    1. Urgent deadline warnings for saved opportunities (closing within 7 days)
    2. Personalized opportunity recommendations matching user skills and domain
    3. Recent campus email and scraper sync alerts
    """
    today = date.today()
    notifications: list[dict[str, Any]] = []

    # 1. Deadline Approaching Warnings for Saved Opportunities (FR-8.2)
    saved_records = db.scalars(
        select(SavedOpportunity)
        .where(SavedOpportunity.user_id == current_user.id)
    ).all()

    for item in saved_records:
        opp = item.opportunity
        if not opp or opp.status != OpportunityStatus.active or not opp.deadline:
            continue

        days_left = (opp.deadline - today).days
        if 0 <= days_left <= 3:
            notifications.append({
                "id": f"urgent-deadline-{opp.id}",
                "type": "deadline",
                "severity": "danger",
                "title": f"Urgent: Deadline in {days_left} day{'s' if days_left != 1 else ''}!",
                "message": f"'{opp.title}' by {opp.organization} is closing on {opp.deadline.strftime('%b %d, %Y')}.",
                "opportunity_id": str(opp.id),
                "action_url": opp.application_url,
                "timestamp": item.saved_at.isoformat() if item.saved_at else None,
                "read": False,
            })
        elif 3 < days_left <= 7:
            notifications.append({
                "id": f"deadline-{opp.id}",
                "type": "deadline",
                "severity": "warning",
                "title": f"Deadline Approaching ({days_left} days left)",
                "message": f"'{opp.title}' by {opp.organization} closes soon.",
                "opportunity_id": str(opp.id),
                "action_url": opp.application_url,
                "timestamp": item.saved_at.isoformat() if item.saved_at else None,
                "read": False,
            })

    # 2. Personalized Skill & Domain Recommendations (FR-8.1)
    user_skills = set(s.lower().strip() for s in (current_user.skills or []))
    recent_opps = db.scalars(
        select(Opportunity)
        .where(Opportunity.status == OpportunityStatus.active)
        .order_by(desc(Opportunity.posted_at))
        .limit(30)
    ).all()

    saved_opp_ids = {str(item.opportunity_id) for item in saved_records}

    rec_count = 0
    for opp in recent_opps:
        if str(opp.id) in saved_opp_ids:
            continue
        opp_skills = set(s.lower().strip() for s in (opp.skills or []))
        matched_skills = user_skills.intersection(opp_skills)
        domain_match = current_user.domain and opp.domain and current_user.domain.lower() in opp.domain.lower()

        if matched_skills or domain_match:
            match_reason = f"Matches your skills: {', '.join(list(matched_skills)[:3])}" if matched_skills else f"Matches domain: {opp.domain}"
            notifications.append({
                "id": f"recommendation-{opp.id}",
                "type": "recommendation",
                "severity": "info",
                "title": f"New Match: {opp.title}",
                "message": f"{opp.organization} · {match_reason}",
                "opportunity_id": str(opp.id),
                "action_url": opp.application_url,
                "timestamp": opp.posted_at.isoformat() if opp.posted_at else None,
                "read": False,
            })
            rec_count += 1
            if rec_count >= 5:
                break

    # 3. System Ingestion Notice
    latest_log = db.scalar(
        select(ScrapingLog)
        .order_by(desc(ScrapingLog.completed_at))
        .limit(1)
    )
    if latest_log and latest_log.records_added > 0:
        source_name = latest_log.source.name if latest_log.source else "Scraper"
        notifications.append({
            "id": f"system-sync-{latest_log.id}",
            "type": "system",
            "severity": "success",
            "title": f"New Opportunities Added ({source_name})",
            "message": f"{latest_log.records_added} new verified listings recently synced to the portal.",
            "opportunity_id": None,
            "action_url": None,
            "timestamp": latest_log.completed_at.isoformat() if latest_log.completed_at else None,
            "read": False,
        })

    unread_count = sum(1 for n in notifications if not n["read"])

    return {
        "unread_count": unread_count,
        "total": len(notifications),
        "notifications": notifications,
    }
