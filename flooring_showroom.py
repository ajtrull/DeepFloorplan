"""CLI for managing flooring partnership leads and live signals."""

from __future__ import annotations

import json

from services.leads import DEFAULT_STATUSES, LeadTracker, PartnershipLead
from services.signals import import_signals_from_json, load_signals, refresh_live_signals


def print_summary(tracker: LeadTracker) -> None:
    summary = tracker.summary()
    print("\nLead Dashboard")
    print(f"Total Leads: {summary['total_leads']}")
    for status, count in summary["status_breakdown"].items():
        print(f"- {status.title()}: {count}")


def list_leads(tracker: LeadTracker) -> None:
    search = input("Search (blank for all): ").strip()
    status = input(f"Status filter {DEFAULT_STATUSES} or 'all': ").strip().lower() or "all"
    leads = tracker.filter_leads(search=search, status=status)

    if not leads:
        print("No leads found.")
        return

    print("\nLeads")
    for lead in leads:
        print(f"{lead.id} | {lead.company_name} | {lead.contact_name} | {lead.status} | {lead.email}")


def add_lead(tracker: LeadTracker) -> None:
    lead = PartnershipLead(
        company_name=input("Company Name: ").strip(),
        contact_name=input("Contact Name: ").strip(),
        email=input("Email: ").strip(),
        phone=input("Phone: ").strip(),
        city=input("City: ").strip(),
        state=input("State: ").strip(),
        product_interest=input("Product Interest: ").strip(),
        status=(input(f"Status {DEFAULT_STATUSES}: ").strip().lower() or "new"),
        notes=input("Notes: ").strip(),
    )
    tracker.add_lead(lead)
    tracker.save()
    print(f"Added lead {lead.id}")


def update_status(tracker: LeadTracker) -> None:
    lead_id = input("Lead ID: ").strip()
    status = input(f"New status {DEFAULT_STATUSES}: ").strip().lower()
    if tracker.update_status(lead_id, status):
        tracker.save()
        print("Status updated.")
    else:
        print("Lead not found or invalid status.")


def do_refresh_signals() -> None:
    signals = refresh_live_signals()
    print(f"Live signals refreshed. Total signals: {len(signals)}")


def do_import_signals() -> None:
    payload = input("Paste JSON list of signals: ").strip()
    try:
        signals = import_signals_from_json(payload)
    except json.JSONDecodeError:
        print("Invalid JSON payload.")
        return
    print(f"Imported signals. Total signals: {len(signals)}")


def export_data(tracker: LeadTracker) -> None:
    fmt = input("Export format (csv/json): ").strip().lower()
    if fmt == "csv":
        print(tracker.export_csv())
    elif fmt == "json":
        print(tracker.export_json())
    else:
        print("Unsupported format")


def main() -> None:
    tracker = LeadTracker.load()
    load_signals()

    while True:
        print(
            "\nFlooring Showroom Lead Menu\n"
            "1. Dashboard\n"
            "2. Lead Table\n"
            "3. Add Lead\n"
            "4. Update Status\n"
            "5. Refresh Live Signals\n"
            "6. Import Signals\n"
            "7. Export Leads CSV/JSON\n"
            "8. Exit"
        )
        choice = input("Select option: ").strip()

        if choice == "1":
            print_summary(tracker)
        elif choice == "2":
            list_leads(tracker)
        elif choice == "3":
            add_lead(tracker)
        elif choice == "4":
            update_status(tracker)
        elif choice == "5":
            do_refresh_signals()
        elif choice == "6":
            do_import_signals()
        elif choice == "7":
            export_data(tracker)
        elif choice == "8":
            print("Goodbye!")
            break
        else:
            print("Invalid choice")


if __name__ == "__main__":
    main()
