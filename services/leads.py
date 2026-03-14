"""Lead management service layer shared by CLI and web UIs."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import csv
import io
import json
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

DEFAULT_LEADS_PATH = Path("data/partnership_leads.json")
DEFAULT_STATUSES = ["new", "contacted", "qualified", "won", "lost"]


@dataclass
class PartnershipLead:
    company_name: str
    contact_name: str
    email: str
    phone: str
    city: str
    state: str
    product_interest: str
    status: str = "new"
    notes: str = ""
    id: str = ""
    created_at: str = ""
    updated_at: str = ""

    def ensure_metadata(self) -> None:
        now = datetime.utcnow().isoformat(timespec="seconds")
        if not self.id:
            self.id = str(uuid4())
        if not self.created_at:
            self.created_at = now
        self.updated_at = now


class LeadTracker:
    def __init__(self, leads: Optional[List[PartnershipLead]] = None) -> None:
        self.leads: List[PartnershipLead] = leads or []

    @classmethod
    def load(cls, path: Path = DEFAULT_LEADS_PATH) -> "LeadTracker":
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text("[]\n", encoding="utf-8")
            return cls([])

        raw = json.loads(path.read_text(encoding="utf-8") or "[]")
        leads = [PartnershipLead(**item) for item in raw]
        return cls(leads)

    def save(self, path: Path = DEFAULT_LEADS_PATH) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = [asdict(lead) for lead in self.leads]
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def add_lead(self, lead: PartnershipLead) -> PartnershipLead:
        lead.ensure_metadata()
        if lead.status not in DEFAULT_STATUSES:
            lead.status = "new"
        self.leads.append(lead)
        return lead

    def update_status(self, lead_id: str, status: str) -> bool:
        if status not in DEFAULT_STATUSES:
            return False
        for lead in self.leads:
            if lead.id == lead_id:
                lead.status = status
                lead.updated_at = datetime.utcnow().isoformat(timespec="seconds")
                return True
        return False

    def summary(self) -> Dict[str, object]:
        breakdown = {status: 0 for status in DEFAULT_STATUSES}
        for lead in self.leads:
            breakdown[lead.status] = breakdown.get(lead.status, 0) + 1
        return {"total_leads": len(self.leads), "status_breakdown": breakdown}

    def filter_leads(self, search: str = "", status: str = "all") -> List[PartnershipLead]:
        search_term = search.lower().strip()
        filtered = self.leads

        if status != "all":
            filtered = [lead for lead in filtered if lead.status == status]

        if not search_term:
            return filtered

        return [
            lead
            for lead in filtered
            if search_term in lead.company_name.lower()
            or search_term in lead.contact_name.lower()
            or search_term in lead.email.lower()
            or search_term in lead.city.lower()
            or search_term in lead.state.lower()
            or search_term in lead.product_interest.lower()
        ]

    def to_dict_rows(self, leads: Optional[List[PartnershipLead]] = None) -> List[Dict[str, str]]:
        target = leads if leads is not None else self.leads
        return [asdict(lead) for lead in target]

    def export_json(self, leads: Optional[List[PartnershipLead]] = None) -> str:
        return json.dumps(self.to_dict_rows(leads), indent=2)

    def export_csv(self, leads: Optional[List[PartnershipLead]] = None) -> str:
        rows = self.to_dict_rows(leads)
        if not rows:
            return ""

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        return output.getvalue()
