from __future__ import annotations

import email
import imaplib
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from app.core.crypto import decrypt_secret
from app.models.email import EmailAccount, SenderAllowlist
from app.models.enums import OpportunityStatus, SourceStatus, SourceType
from app.models.source import ScrapingLog, Source
from pipeline.runner import ingest_drafts
from scrapers.email_parser import EmailOpportunityParser

logger = logging.getLogger(__name__)


SAMPLE_CAMPUS_EMAILS = [
    """From: Poornima Training & Placement Cell <placement@poornima.edu.in>
To: 2023csbhavya14015@poornima.edu.in
Subject: [Urgent Drive] TCS CodeVita Season 13 - Global Coding Contest & Direct Job Interviews
Date: Thu, 24 Sep 2026 10:15:00 +0530
Content-Type: text/plain; charset="utf-8"

Dear Students of 2026/2027 Batches,

Greetings from Training & Placement Cell, Poornima Group of Institutions!

TCS (Tata Consultancy Services) has officially announced CodeVita Season 13.
Top performers will receive direct interview opportunities for Ninja and Digital developer roles.

Key Details:
- Organizer: TCS
- Eligibility: All B.Tech CSE/IT/ECE students (Min 60% in 10th, 12th, and ongoing B.Tech)
- Registration Deadline: 15 October 2026
- Event Date: 22 October 2026
- Prize Pool: USD $20,000 + Direct Ninja/Digital Job Offers
- Mode: Online
- Required Skills: python, java, c++, sql, algorithms

Official Registration Link: https://campus.tcs.com/codevita-season13/register
Google Form for College Records: https://forms.gle/tcs-codevita-poornima-2026

Ensure you register before the last date to apply: 15/10/2026.

Regards,
TPO Cell, Poornima Group of Institutions, Jaipur
""",
    """From: Poornima Innovation & Incubation Council <hackathons@poornima.edu.in>
To: 2023csbhavya14015@poornima.edu.in
Subject: [Nomination] Smart Rajasthan Student Hackathon 2026 - Rs. 10 Lakh Prize Pool
Date: Wed, 23 Sep 2026 14:30:00 +0530
Content-Type: text/plain; charset="utf-8"

Dear Innovators,

Department of Information Technology & Communication (DoITC) Rajasthan in association with Poornima
is inviting student nominations for the Smart Rajasthan Student Hackathon 2026.

Event Highlights:
- Hackathon Theme: AI for Citizen Services, Smart Water Grid, Clean Energy
- Total Prize: Rs. 10,00,000
- Mode: Onsite Hackathon at Jaipur Exhibition & Convention Centre (JECC)
- Team Size: 2 to 4 members
- Required Skills: react, python, machine learning, flutter, aws
- Registration Deadline: 28 October 2026
- Hackathon Dates: 05 November 2026 to 06 November 2026

Portal Link: https://unstop.com/hackathons/smart-rajasthan-hackathon-2026
Colleges must submit internal team nomination by: 28/10/2026.

Best wishes,
Innovation & Hackathon Cell
Poornima Campus, Jaipur
""",
    """From: Placement Officer <tpo@poornima.edu.in>
To: 2023csbhavya14015@poornima.edu.in
Subject: Campus Internship Recruitment: Google Summer of Code (GSoC) 2026 Mentorship & Internship Drive
Date: Tue, 22 Sep 2026 09:00:00 +0530
Content-Type: text/plain; charset="utf-8"

Hello Students,

The Open Source & Internship Club is organizing a specialized mentorship fellowship
for Google Summer of Code (GSoC) 2026 applicants. Selected students receive direct stipends
and open source commit reviews from alumni mentors at Google and Red Hat.

- Category: Fellowship / Internship
- Organization: Google Open Source Programs
- Stipend: $1,500 - $3,000
- Apply by: 20 November 2026
- Location: Remote
- Required Skills: python, c++, docker, react, javascript

Register via: https://summerofcode.withgoogle.com/apply
College internal register link: https://forms.gle/gsoc-poornima-mentorship-2026

Happy Coding!
TPO Officer, Poornima
""",
]


def is_email_tagged_with(raw_email_str: str, tag: str = "Nomination") -> bool:
    """Checks whether an RFC822 message carries the specified label or tag.

    Verifies:
    1. Subject header contains the tag (e.g., [Nomination], (Nomination), Nomination:, or word nomination)
    2. Header metadata contains tag (X-GM-LABELS, X-Label, Keywords, X-Keywords)
    3. The message body mentions the tag in initial paragraphs
    """
    if not tag or tag.strip().upper() == "ALL":
        return True
    tag_lower = tag.strip().lower()
    try:
        msg = email.message_from_string(raw_email_str)
        subject = (msg.get("Subject") or "").lower()

        # 1. Subject match (e.g. [Nomination], Nomination drive, etc.)
        if tag_lower in subject:
            return True

        # 2. Custom IMAP / Gmail label headers
        for h in ("X-GM-LABELS", "X-Label", "Keywords", "X-Keywords"):
            val = (msg.get(h) or "").lower()
            if tag_lower in val:
                return True

        # 3. Body text inspection
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() in ("text/plain", "text/html"):
                    p = part.get_payload(decode=True)
                    if p:
                        body += " " + p.decode(errors="replace")
        else:
            p = msg.get_payload(decode=True)
            if p:
                body = p.decode(errors="replace")

        if re.search(rf"\b{re.escape(tag_lower)}\b", body[:800], re.IGNORECASE):
            return True
    except Exception:
        pass
    return False


def fetch_emails_from_imap(account: EmailAccount, limit: int = 20) -> list[str]:
    """Connect to the designated mailbox using IMAP over TLS/SSL (port 993) and fetch RFC822 messages filtered strictly by the Nomination tag."""
    decrypted_password = decrypt_secret(account.password_encrypted)
    raw_emails: list[str] = []

    try:
        # Port 993 SSL/TLS connection
        client = imaplib.IMAP4_SSL(account.imap_server, port=account.imap_port, timeout=15)
        client.login(account.username, decrypted_password)
    except Exception as exc:
        logger.error(f"IMAP authentication failed for {account.email}: {exc}")
        raise ConnectionError(f"Failed to connect to IMAP server ({account.imap_server}): {exc}")

    try:
        tag = (account.mailbox_folder or "Nomination").strip()
        selected_folder = None

        # 1. Attempt to select designated Nomination folder / mailbox directly
        folder_candidates = [tag, f'"{tag}"', f"[Gmail]/{tag}", f"INBOX/{tag}", f"[Gmail]/Labels/{tag}"]
        for cand in folder_candidates:
            try:
                res, _ = client.select(cand, readonly=True)
                if res == "OK":
                    selected_folder = cand
                    logger.info(f"Opened IMAP mailbox folder '{cand}' for account {account.email}")
                    break
            except Exception:
                continue

        # 2. If folder could not be opened directly, select INBOX and apply Gmail label / subject query
        if not selected_folder:
            logger.info(f"Custom folder '{tag}' not listed as top-level mailbox; checking 'INBOX' with '{tag}' tag filter.")
            res, _ = client.select("INBOX", readonly=True)
            if res != "OK":
                client.select('"[Gmail]/All Mail"', readonly=True)
                selected_folder = "[Gmail]/All Mail"
            else:
                selected_folder = "INBOX"

        allowlist = [s.sender_email.strip() for s in (account.sender_allowlist or []) if s.active]
        email_ids = []

        if selected_folder in ("INBOX", "[Gmail]/All Mail"):
            # Try Gmail X-GM-RAW label query first
            try:
                typ, data = client.search(None, f'X-GM-RAW "label:{tag}"')
                if typ == "OK" and data[0]:
                    email_ids = data[0].split()
            except Exception as e:
                logger.debug(f"X-GM-RAW label search not supported: {e}")

            # Fallback to subject / text query for the tag
            if not email_ids:
                for q in [
                    f'(HEADER Subject "{tag}")',
                    f'(SUBJECT "{tag}")',
                    f'(OR (HEADER Subject "{tag}") (TEXT "{tag}"))',
                ]:
                    try:
                        typ, data = client.search(None, q)
                        if typ == "OK" and data[0]:
                            email_ids = data[0].split()
                            if email_ids:
                                break
                    except Exception:
                        continue

            # If sender allowlist is configured, intersect with allowlist senders
            if allowlist and email_ids:
                filtered_ids = []
                for sender in allowlist:
                    try:
                        typ, data = client.search(None, f'(FROM "{sender}")')
                        if typ == "OK" and data[0]:
                            sender_ids = set(data[0].split())
                            filtered_ids.extend([eid for eid in email_ids if eid in sender_ids])
                    except Exception:
                        continue
                email_ids = list(dict.fromkeys(filtered_ids))
        else:
            # We are inside the dedicated Nomination mailbox folder
            if allowlist:
                for sender in allowlist:
                    typ, data = client.search(None, f'(FROM "{sender}")')
                    if typ == "OK" and data[0]:
                        email_ids.extend(data[0].split())
            else:
                typ, data = client.search(None, "ALL")
                if typ == "OK" and data[0]:
                    email_ids = data[0].split()

        # Limit to the most recent messages
        unique_ids = list(dict.fromkeys(email_ids))
        selected_ids = unique_ids[-limit:] if len(unique_ids) > limit else unique_ids

        for eid in reversed(selected_ids):
            typ, msg_data = client.fetch(eid, "(RFC822)")
            if typ == "OK" and msg_data and msg_data[0]:
                raw_bytes = msg_data[0][1]
                if isinstance(raw_bytes, bytes):
                    raw_str = raw_bytes.decode(errors="replace")
                else:
                    raw_str = str(raw_bytes)

                # Strict validation: if fetched from INBOX or All Mail, ensure it carries the Nomination tag
                if selected_folder in ("INBOX", "[Gmail]/All Mail") and not is_email_tagged_with(raw_str, tag):
                    logger.info(f"Skipping email {eid} as it does not carry the '{tag}' tag")
                    continue

                raw_emails.append(raw_str)

        client.close()
        client.logout()
    except Exception as exc:
        logger.error(f"Error reading emails from IMAP: {exc}")
        try:
            client.logout()
        except Exception:
            pass
        raise

    return raw_emails


def ingest_raw_emails(
    raw_emails: list[str],
    db,
    source_name: str = "college_email",
    default_sender: str = "Placement Cell",
    tag_filter: str | None = None,
) -> dict:
    """Parse raw RFC822 messages into OpportunityDrafts and ingest them with deduplication."""
    if tag_filter:
        raw_emails = [raw for raw in raw_emails if is_email_tagged_with(raw, tag_filter)]
    # 1. Ensure Source record exists
    source = db.scalar(select(Source).where(Source.name == source_name))
    if not source:
        source = Source(
            name=source_name,
            url="https://poornima.edu.in/placements",
            type=SourceType.email,
            status=SourceStatus.active,
        )
        db.add(source)
        db.commit()
        db.refresh(source)

    now = datetime.now(timezone.utc)
    log = ScrapingLog(
        source_id=source.id,
        started_at=now,
        records_found=len(raw_emails),
        records_added=0,
        duplicates=0,
        errors=0,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # 2. Parse emails into OpportunityDrafts
    drafts = []
    parse_errors = 0
    for raw in raw_emails:
        try:
            draft = EmailOpportunityParser.parse_raw_email(raw, default_sender=default_sender)
            if draft:
                drafts.append(draft)
            else:
                parse_errors += 1
        except Exception as exc:
            logger.warning(f"Failed to parse email message: {exc}")
            parse_errors += 1

    # 3. Deduplicate and ingest
    added, duplicates, errors = ingest_drafts(drafts, db)
    total_errors = errors + parse_errors

    # 4. Finalize log
    completed = datetime.now(timezone.utc)
    log.completed_at = completed
    log.records_added = added
    log.duplicates = duplicates
    log.errors = total_errors
    source.last_scraped = completed

    db.commit()

    return {
        "source": source_name,
        "records_found": len(raw_emails),
        "records_parsed": len(drafts),
        "records_added": added,
        "duplicates": duplicates,
        "errors": total_errors,
        "started_at": log.started_at.isoformat(),
        "completed_at": completed.isoformat(),
    }


def sync_sample_placement_mailbox(db) -> dict:
    """Convenience helper to ingest sample campus placement emails (useful for instant testing and demo)."""
    return ingest_raw_emails(
        raw_emails=SAMPLE_CAMPUS_EMAILS,
        db=db,
        source_name="college_email",
        default_sender="Poornima Placement Cell",
    )
