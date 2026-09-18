import enum


class StrEnum(str, enum.Enum):
    def __str__(self) -> str:
        return self.value


class UserRole(StrEnum):
    student = "student"
    coordinator = "coordinator"
    admin = "admin"


class OpportunityCategory(StrEnum):
    job = "job"
    internship = "internship"
    hackathon = "hackathon"
    nomination = "nomination"
    scholarship = "scholarship"
    workshop = "workshop"
    competition = "competition"
    webinar = "webinar"
    fellowship = "fellowship"


class OpportunityStatus(StrEnum):
    active = "active"
    expired = "expired"
    removed = "removed"


class ApplicationStatus(StrEnum):
    saved = "saved"
    applied = "applied"
    shortlisted = "shortlisted"
    interview = "interview"
    selected = "selected"
    rejected = "rejected"


class SourceType(StrEnum):
    job = "job"
    hackathon = "hackathon"
    email = "email"
    company = "company"


class SourceStatus(StrEnum):
    active = "active"
    disabled = "disabled"