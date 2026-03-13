"""Flooring Showroom Display Program.

This program provides a command line showroom workflow for:
- browsing flooring options
- adding options
- estimating project cost
- discovering partnership leads
- tracking outreach activity with dashboard metrics
- fetching live online source signals (RSS)
- exporting lead records to CSV/JSON
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import date
from pathlib import Path
from typing import List
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from xml.etree import ElementTree


SOCIAL_PLATFORMS = [
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Houzz",
    "Pinterest",
    "YouTube",
    "TikTok",
]

OUTREACH_TARGETS = [
    "flooring showrooms",
    "remodelers",
    "renovation companies",
    "interior designers",
    "design-build firms",
    "property managers",
    "home builders",
]

LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "partnered", "archived"]

LEADS_DATA_FILE = Path("data/partnership_leads.json")
LIVE_SOURCES_FILE = Path("data/live_source_signals.json")
EXPORT_DIR = Path("exports")


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
    company: str
    contact_role: str
    platform: str
    city_state: str
    surface_focus: str
    status: str = "new"
    last_touch: str = field(default_factory=lambda: date.today().isoformat())
    notes: str = ""


class LeadTracker:
    def __init__(self, data_file: Path = LEADS_DATA_FILE):
        self.data_file = data_file
        self.leads: List[PartnershipLead] = self._load()

    def _load(self) -> List[PartnershipLead]:
        if not self.data_file.exists():
            return []
        try:
            rows = json.loads(self.data_file.read_text(encoding="utf-8"))
            return [PartnershipLead(**row) for row in rows]
        except (json.JSONDecodeError, TypeError):
            print("Warning: lead data file could not be parsed; starting with empty list.")
            return []

    def save(self) -> None:
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        payload = [asdict(lead) for lead in self.leads]
        self.data_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def add_lead(self, lead: PartnershipLead) -> None:
        self.leads.append(lead)
        self.save()

    def update_status(self, index: int, status: str, notes: str = "") -> bool:
        if not 0 <= index < len(self.leads):
            return False
        if status not in LEAD_STATUSES:
            return False
        self.leads[index].status = status
        self.leads[index].last_touch = date.today().isoformat()
        if notes:
            self.leads[index].notes = notes
        self.save()
        return True

    def summary(self) -> dict:
        counts = {status: 0 for status in LEAD_STATUSES}
        for lead in self.leads:
            counts[lead.status] = counts.get(lead.status, 0) + 1
        counts["total"] = len(self.leads)
        return counts

    def export_json(self, output_file: Path) -> Path:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(
            json.dumps([asdict(lead) for lead in self.leads], indent=2),
            encoding="utf-8",
        )
        return output_file

    def export_csv(self, output_file: Path) -> Path:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = list(asdict(PartnershipLead("", "", "", "", "")).keys())
        with output_file.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            for lead in self.leads:
                writer.writerow(asdict(lead))
        return output_file


def display_options(options):
    print("\nFlooring Options:")
    for idx, option in enumerate(options, 1):
        print(f"{idx}. {option}")


def add_option(options):
    name = input("Enter flooring name: ").strip()
    try:
        price = float(input("Enter price per square foot: "))
    except ValueError:
        print("Invalid price.")
        return
    colors = [
        c.strip()
        for c in input("Enter available colors (comma separated): ").split(",")
        if c.strip()
    ]
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


def build_partnership_search_queries(
    source_name="All South Flooring", product_focus="soft and hard surface flooring samples"
):
    """Create search queries for finding likely partnership leads online."""
    queries = []
    for platform in SOCIAL_PLATFORMS:
        for target in OUTREACH_TARGETS:
            queries.append(
                f'site:{platform.lower()}.com "{target}" "{product_focus}" "{source_name}"'
            )
    queries.extend(
        [
            f'"{source_name}" showroom sample placement partnership',
            f'"{source_name}" flooring designer program',
            '"flooring sample board" "showroom" "partnership"',
        ]
    )
    return queries


def display_partnership_resources():
    print("\nPartnership Lead Resource Plan")
    print("Source Brand: All South Flooring")

    print("\n1) Social signal channels to monitor:")
    for platform in SOCIAL_PLATFORMS:
        print(f"   - {platform}")

    print("\n2) Prospect audiences to target:")
    for target in OUTREACH_TARGETS:
        print(f"   - {target}")

    print("\n3) Suggested Google/social search queries:")
    for query in build_partnership_search_queries()[:15]:
        print(f"   - {query}")

    print(
        "\n4) Messaging angle: Offer soft and hard surface sample access, "
        "fast replenishment, and collaborative display placement via All South Flooring.\n"
    )


def _extract_company_name(title: str) -> str:
    cleaned = re.sub(r"\s+", " ", title).strip()
    if not cleaned:
        return "Unknown Company"
    return cleaned[:60]


def fetch_live_source_signals(limit: int = 12) -> List[dict]:
    """Fetch real-time public source signals from RSS feeds.

    Uses Google News RSS and Reddit search RSS for renovation/flooring intent.
    """
    queries = [
        "flooring showroom remodeler",
        "renovation company flooring samples",
        "interior designer flooring materials",
    ]
    feeds = []
    for q in queries:
        feeds.append(("Google News", f"https://news.google.com/rss/search?q={quote_plus(q)}"))
        feeds.append(("Reddit", f"https://www.reddit.com/search.rss?q={quote_plus(q)}"))

    signals: List[dict] = []
    headers = {"User-Agent": "Mozilla/5.0 (compatible; flooring-showroom-bot/1.0)"}

    for source_type, url in feeds:
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=10) as response:
                xml_data = response.read()
            root = ElementTree.fromstring(xml_data)
            channel_items = root.findall("./channel/item")
            if not channel_items:
                channel_items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

            for item in channel_items[:4]:
                title = item.findtext("title") or item.findtext("{http://www.w3.org/2005/Atom}title")
                link = item.findtext("link")
                if link is None:
                    link_node = item.find("{http://www.w3.org/2005/Atom}link")
                    link = link_node.attrib.get("href") if link_node is not None else ""
                pub = (
                    item.findtext("pubDate")
                    or item.findtext("published")
                    or item.findtext("{http://www.w3.org/2005/Atom}published")
                    or ""
                )
                if not title or not link:
                    continue
                signals.append(
                    {
                        "source": source_type,
                        "title": title.strip(),
                        "link": link.strip(),
                        "published": pub.strip(),
                        "captured_on": date.today().isoformat(),
                    }
                )
                if len(signals) >= limit:
                    return signals
        except Exception:
            continue
    return signals


def refresh_live_source_signals() -> List[dict]:
    signals = fetch_live_source_signals(limit=12)
    LIVE_SOURCES_FILE.parent.mkdir(parents=True, exist_ok=True)
    LIVE_SOURCES_FILE.write_text(json.dumps(signals, indent=2), encoding="utf-8")
    return signals


def show_live_source_signals():
    signals = refresh_live_source_signals()
    if not signals:
        print("\nNo live signals found right now (network/feed may be unavailable).")
        return

    print(f"\nLive Source Signals ({len(signals)} found)")
    for idx, signal in enumerate(signals, 1):
        print(f"{idx}. [{signal['source']}] {signal['title']}")
        print(f"    {signal['link']}")
        if signal.get("published"):
            print(f"    Published: {signal['published']}")


def import_live_signals_as_leads(tracker: LeadTracker):
    if not LIVE_SOURCES_FILE.exists():
        print("No live signal file found. Run 'Show Live Source Signals' first.")
        return

    try:
        signals = json.loads(LIVE_SOURCES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("Could not read live signal file.")
        return

    if not signals:
        print("No live signals available to import.")
        return

    imported = 0
    existing_companies = {lead.company for lead in tracker.leads}
    for signal in signals:
        company = _extract_company_name(signal.get("title", ""))
        if company in existing_companies:
            continue
        tracker.add_lead(
            PartnershipLead(
                company=company,
                contact_role="unknown",
                platform=signal.get("source", "web"),
                city_state="unknown",
                surface_focus="mixed",
                notes=signal.get("link", ""),
            )
        )
        existing_companies.add(company)
        imported += 1

    print(f"Imported {imported} live signals as leads.")


def show_lead_dashboard(tracker: LeadTracker):
    summary = tracker.summary()
    print("\n=== Partnership Dashboard ===")
    print(f"Total Leads: {summary['total']}")
    print("Pipeline:")
    for status in LEAD_STATUSES:
        print(f"  - {status.title():<10} {summary.get(status, 0)}")

    if not tracker.leads:
        print("\nNo leads yet. Add leads to start tracking.")
        return

    print("\nRecent Leads:")
    for idx, lead in enumerate(tracker.leads[-10:], 1):
        print(
            f"{idx}. {lead.company} | {lead.contact_role} | {lead.platform} | "
            f"{lead.city_state} | {lead.surface_focus} | {lead.status} | {lead.last_touch}"
        )


def add_partnership_lead(tracker: LeadTracker):
    print("\nAdd Partnership Lead")
    company = input("Company name: ").strip()
    contact_role = input("Contact role (designer/showroom owner/etc): ").strip()
    platform = input("Source platform (Instagram/Facebook/etc): ").strip()
    city_state = input("City, State: ").strip()
    surface_focus = input("Surface focus (soft, hard, or mixed): ").strip()
    notes = input("Notes: ").strip()

    if not company:
        print("Company is required.")
        return

    tracker.add_lead(
        PartnershipLead(
            company=company,
            contact_role=contact_role or "unknown",
            platform=platform or "unknown",
            city_state=city_state or "unknown",
            surface_focus=surface_focus or "mixed",
            notes=notes,
        )
    )
    print("Lead saved.")


def update_lead_status(tracker: LeadTracker):
    if not tracker.leads:
        print("No leads available.")
        return

    print("\nLead List:")
    for idx, lead in enumerate(tracker.leads, 1):
        print(f"{idx}. {lead.company} ({lead.status})")

    try:
        lead_idx = int(input("Select lead number: ")) - 1
    except ValueError:
        print("Invalid lead selection.")
        return

    print("Available statuses:", ", ".join(LEAD_STATUSES))
    status = input("New status: ").strip().lower()
    notes = input("Optional note update: ").strip()

    if tracker.update_status(lead_idx, status, notes):
        print("Lead updated.")
    else:
        print("Update failed. Check lead number/status.")


def export_leads(tracker: LeadTracker):
    if not tracker.leads:
        print("No leads to export.")
        return

    today = date.today().isoformat()
    csv_path = tracker.export_csv(EXPORT_DIR / f"partnership_leads_{today}.csv")
    json_path = tracker.export_json(EXPORT_DIR / f"partnership_leads_{today}.json")

    print("\nExport complete:")
    print(f" - CSV:  {csv_path}")
    print(f" - JSON: {json_path}")


def main():
    options = [
        FlooringOption("Hardwood", 5.50, ["Oak", "Walnut", "Maple"]),
        FlooringOption("Carpet", 2.25, ["Beige", "Gray", "Blue"]),
        FlooringOption("Tile", 4.00, ["White", "Black", "Marble"]),
    ]
    tracker = LeadTracker()

    while True:
        print("\nFlooring Showroom Menu:")
        print("1. View Flooring Options")
        print("2. Add Flooring Option")
        print("3. Calculate Cost")
        print("4. Show Partnership Lead Resources")
        print("5. Partnership Dashboard")
        print("6. Add Partnership Lead")
        print("7. Update Lead Status")
        print("8. Export Leads (CSV + JSON)")
        print("9. Refresh + Show Live Source Signals")
        print("10. Import Live Signals as Leads")
        print("11. Exit")

        choice = input("Select an option: ").strip()
        if choice == "1":
            display_options(options)
        elif choice == "2":
            add_option(options)
        elif choice == "3":
            calculate_cost(options)
        elif choice == "4":
            display_partnership_resources()
        elif choice == "5":
            show_lead_dashboard(tracker)
        elif choice == "6":
            add_partnership_lead(tracker)
        elif choice == "7":
            update_lead_status(tracker)
        elif choice == "8":
            export_leads(tracker)
        elif choice == "9":
            show_live_source_signals()
        elif choice == "10":
            import_live_signals_as_leads(tracker)
        elif choice == "11":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Try again.\n")


if __name__ == "__main__":
    main()
