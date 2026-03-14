"""Streamlit web app for flooring partnership lead operations."""

from __future__ import annotations

import json
import streamlit as st

from services.leads import DEFAULT_STATUSES, LeadTracker, PartnershipLead
from services.signals import import_signals_from_json, refresh_live_signals, signals_to_rows

st.set_page_config(page_title="Flooring Showroom CRM", layout="wide")
st.title("Flooring Showroom CRM")

tracker = LeadTracker.load()

summary = tracker.summary()
st.subheader("Dashboard Metrics")
metric_cols = st.columns(1 + len(summary["status_breakdown"]))
metric_cols[0].metric("Total Leads", summary["total_leads"])
for idx, (status, count) in enumerate(summary["status_breakdown"].items(), start=1):
    metric_cols[idx].metric(status.title(), count)

st.subheader("Lead Table")
left, right = st.columns([2, 1])
search = left.text_input("Search leads", placeholder="Company, contact, email, city...")
status_filter = right.selectbox("Status filter", ["all"] + DEFAULT_STATUSES)
filtered_leads = tracker.filter_leads(search=search, status=status_filter)
st.dataframe(tracker.to_dict_rows(filtered_leads), use_container_width=True)

st.subheader("Update Status")
if filtered_leads:
    status_cols = st.columns([2, 1, 1])
    selected_lead_id = status_cols[0].selectbox(
        "Select lead",
        options=[lead.id for lead in filtered_leads],
        format_func=lambda lead_id: next(
            f"{lead.company_name} ({lead.contact_name})" for lead in filtered_leads if lead.id == lead_id
        ),
    )
    new_status = status_cols[1].selectbox("New status", DEFAULT_STATUSES)
    if status_cols[2].button("Update", use_container_width=True):
        if tracker.update_status(selected_lead_id, new_status):
            tracker.save()
            st.success("Lead status updated")
            st.rerun()
        else:
            st.error("Unable to update lead status")
else:
    st.info("Add leads to enable status updates.")

st.subheader("Add Lead")
with st.form("add_lead_form"):
    col1, col2 = st.columns(2)
    company_name = col1.text_input("Company Name")
    contact_name = col2.text_input("Contact Name")
    email = col1.text_input("Email")
    phone = col2.text_input("Phone")
    city = col1.text_input("City")
    state = col2.text_input("State")
    product_interest = col1.text_input("Product Interest")
    status = col2.selectbox("Status", DEFAULT_STATUSES)
    notes = st.text_area("Notes")
    submitted = st.form_submit_button("Add Lead")

    if submitted:
        lead = PartnershipLead(
            company_name=company_name,
            contact_name=contact_name,
            email=email,
            phone=phone,
            city=city,
            state=state,
            product_interest=product_interest,
            status=status,
            notes=notes,
        )
        tracker.add_lead(lead)
        tracker.save()
        st.success("Lead added")
        st.rerun()

st.subheader("Signals Controls")
ctl_cols = st.columns(2)
if ctl_cols[0].button("Refresh Live Signals", use_container_width=True):
    refresh_live_signals()
    st.success("Live signals refreshed")

uploaded = ctl_cols[1].file_uploader("Import Signals (JSON)", type=["json"])
if uploaded is not None:
    content = uploaded.getvalue().decode("utf-8")
    try:
        import_signals_from_json(content)
        st.success("Signals imported")
    except (json.JSONDecodeError, TypeError):
        st.error("Invalid signals JSON")

signals_rows = signals_to_rows()
with st.expander("Live Signals", expanded=False):
    st.dataframe(signals_rows, use_container_width=True)

st.subheader("Export Leads")
export_cols = st.columns(2)
export_cols[0].download_button(
    "Export CSV",
    tracker.export_csv(filtered_leads),
    file_name="partnership_leads.csv",
    mime="text/csv",
    use_container_width=True,
)
export_cols[1].download_button(
    "Export JSON",
    tracker.export_json(filtered_leads),
    file_name="partnership_leads.json",
    mime="application/json",
    use_container_width=True,
)
