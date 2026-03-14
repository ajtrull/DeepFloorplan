"""Flooring Showroom Display Program.

This program provides a simple command line interface for browsing
available flooring options, adding new options, and calculating an
estimated cost based on square footage.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


@dataclass
class FlooringOption:
    name: str
    price_per_sqft: float
    colors: List[str] = field(default_factory=list)

    def __str__(self):
        color_list = ", ".join(self.colors) if self.colors else "N/A"
        return f"{self.name} - ${self.price_per_sqft:.2f}/sqft - Colors: {color_list}"


@dataclass
class PartnershipLead:
    """Represents a potential partner discovered from live source signals."""

    company_name: str
    source_url: str
    canonical_url: str
    notes: str = ""
    pipeline_status: str = "active"
    confidence_score: float = 0.0
    source_type: str = "unknown"
    source_metadata: Dict[str, Any] = field(default_factory=dict)


class LeadTracker:
    """In-memory lead tracker used by live-import helpers."""

    def __init__(self):
        self._leads: List[PartnershipLead] = []

    def add_lead(self, lead: PartnershipLead) -> None:
        self._leads.append(lead)

    @property
    def leads(self) -> List[PartnershipLead]:
        return list(self._leads)


def _normalize_url(url: str) -> str:
    """Canonicalize links so equivalent URLs dedupe consistently."""
    parsed = urlparse(url.strip())
    scheme = (parsed.scheme or "https").lower()
    netloc = parsed.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    path = parsed.path.rstrip("/") or "/"

    tracking_prefixes = ("utm_", "fbclid", "gclid", "mc_", "ref")
    filtered_query = [
        (k, v)
        for k, v in parse_qsl(parsed.query, keep_blank_values=False)
        if not any(k.lower().startswith(prefix) for prefix in tracking_prefixes)
    ]
    filtered_query.sort()

    return urlunparse((scheme, netloc, path, "", urlencode(filtered_query), ""))


def _extract_company_name(signal: Dict[str, Any]) -> str:
    """Extract a likely company name from explicit fields, title, or domain."""
    for key in ("company", "organization", "author", "publisher"):
        value = signal.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    title = str(signal.get("title", "")).strip()
    if title:
        parts = re.split(r"\s*[-:|]\s*", title)
        if parts and parts[0].strip():
            return parts[0].strip()

    link = str(signal.get("url", "")).strip()
    if link:
        domain = urlparse(link).netloc.lower().replace("www.", "")
        if domain:
            return domain.split(".")[0].replace("-", " ").title()

    return "Unknown Company"


def _to_utc_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _compute_confidence_score(signal: Dict[str, Any], company_name: str) -> float:
    """Compute score from keyword relevance, source quality, and recency."""
    keywords = {
        "flooring": 0.15,
        "tile": 0.1,
        "hardwood": 0.1,
        "carpet": 0.1,
        "renovation": 0.1,
        "showroom": 0.15,
        "supplier": 0.1,
        "distributor": 0.1,
    }
    text = " ".join(
        [
            str(signal.get("title", "")),
            str(signal.get("summary", "")),
            str(signal.get("description", "")),
            company_name,
        ]
    ).lower()

    keyword_score = sum(weight for keyword, weight in keywords.items() if keyword in text)
    keyword_score = min(keyword_score, 0.5)

    source_type = str(signal.get("source_type", "unknown")).lower()
    source_weights = {
        "industry_news": 0.3,
        "business_registry": 0.35,
        "company_site": 0.25,
        "social": 0.15,
        "forum": 0.1,
        "unknown": 0.05,
    }
    source_score = source_weights.get(source_type, 0.1)

    recency_score = 0.0
    discovered_at = _to_utc_datetime(signal.get("published_at") or signal.get("discovered_at"))
    if discovered_at:
        age_days = max((datetime.now(timezone.utc) - discovered_at).days, 0)
        if age_days <= 7:
            recency_score = 0.2
        elif age_days <= 30:
            recency_score = 0.12
        elif age_days <= 90:
            recency_score = 0.06

    return round(min(keyword_score + source_score + recency_score, 1.0), 3)


def fetch_live_source_signals(
    raw_signals: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Normalize URLs, dedupe by canonical URL + company, and attach score metadata."""
    deduped: Dict[tuple[str, str], Dict[str, Any]] = {}

    for signal in raw_signals:
        if not signal.get("url"):
            continue

        canonical_url = _normalize_url(str(signal["url"]))
        company_name = _extract_company_name(signal)
        score = _compute_confidence_score(signal, company_name)

        enriched_signal = {
            **signal,
            "canonical_url": canonical_url,
            "company_name": company_name,
            "confidence_score": score,
        }
        key = (canonical_url, company_name.lower())
        existing = deduped.get(key)

        if existing is None or enriched_signal["confidence_score"] > existing["confidence_score"]:
            deduped[key] = enriched_signal

    return list(deduped.values())


def import_live_signals_as_leads(
    lead_tracker: LeadTracker,
    raw_signals: List[Dict[str, Any]],
    min_confidence_score: float = 0.45,
    review_before_pipeline: bool = False,
    review_status: str = "new_unverified",
) -> List[PartnershipLead]:
    """Import scored signals as leads, optionally routing first to manual review."""
    imported: List[PartnershipLead] = []
    live_signals = fetch_live_source_signals(raw_signals)

    for signal in live_signals:
        score = float(signal["confidence_score"])
        if score < min_confidence_score:
            continue

        source_metadata = {
            "source_type": signal.get("source_type", "unknown"),
            "published_at": signal.get("published_at") or signal.get("discovered_at"),
            "title": signal.get("title", ""),
            "canonical_url": signal["canonical_url"],
            "original_url": signal.get("url", ""),
        }
        notes = (
            f"Imported from live signal. Confidence={score:.3f}; "
            f"source_type={source_metadata['source_type']}; "
            f"canonical_url={source_metadata['canonical_url']}"
        )
        lead = PartnershipLead(
            company_name=signal["company_name"],
            source_url=str(signal.get("url", "")),
            canonical_url=signal["canonical_url"],
            notes=notes,
            pipeline_status=review_status if review_before_pipeline else "active",
            confidence_score=score,
            source_type=str(source_metadata["source_type"]),
            source_metadata=source_metadata,
        )
        lead_tracker.add_lead(lead)
        imported.append(lead)

    return imported


def display_options(options):
    print("\nFlooring Options:")
    for idx, option in enumerate(options, 1):
        print(f"{idx}. {option}")


def add_option(options):
    name = input("Enter flooring name: ")
    try:
        price = float(input("Enter price per square foot: "))
    except ValueError:
        print("Invalid price.")
        return
    colors = [c.strip() for c in input("Enter available colors (comma separated): ").split(",") if c.strip()]
    options.append(FlooringOption(name, price, colors))
    print("Option added.\n")


def calculate_cost(options):
    if not options:
        print("No flooring options available.")
        return
    display_options(options)
    try:
        idx = int(input("Select option by number: ")) - 1
        sqft = float(input("Enter square footage: "))
    except ValueError:
        print("Invalid input.")
        return
    if 0 <= idx < len(options):
        cost = sqft * options[idx].price_per_sqft
        print(f"Estimated cost: ${cost:.2f}\n")
    else:
        print("Invalid option.\n")


def main():
    options = [
        FlooringOption("Hardwood", 5.50, ["Oak", "Walnut", "Maple"]),
        FlooringOption("Carpet", 2.25, ["Beige", "Gray", "Blue"]),
        FlooringOption("Tile", 4.00, ["White", "Black", "Marble"]),
    ]
    while True:
        print("\nFlooring Showroom Menu:")
        print("1. View Flooring Options")
        print("2. Add Flooring Option")
        print("3. Calculate Cost")
        print("4. Exit")
        choice = input("Select an option: ")
        if choice == "1":
            display_options(options)
        elif choice == "2":
            add_option(options)
        elif choice == "3":
            calculate_cost(options)
        elif choice == "4":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Try again.\n")


if __name__ == "__main__":
    main()
