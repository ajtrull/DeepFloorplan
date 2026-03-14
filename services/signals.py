"""Signal ingestion and refresh helpers shared by CLI and web UIs."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import json
from pathlib import Path
import random
from typing import List, Optional

DEFAULT_SIGNALS_PATH = Path("data/live_source_signals.json")
DEFAULT_SOURCES = ["website", "email_campaign", "partner_referral", "trade_show"]


@dataclass
class LiveSourceSignal:
    source: str
    company_name: str
    contact_name: str
    email: str
    product_interest: str
    score: int
    captured_at: str = ""

    def ensure_metadata(self) -> None:
        if not self.captured_at:
            self.captured_at = datetime.utcnow().isoformat(timespec="seconds")


def load_signals(path: Path = DEFAULT_SIGNALS_PATH) -> List[LiveSourceSignal]:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text("[]\n", encoding="utf-8")
        return []
    raw = json.loads(path.read_text(encoding="utf-8") or "[]")
    return [LiveSourceSignal(**item) for item in raw]


def save_signals(signals: List[LiveSourceSignal], path: Path = DEFAULT_SIGNALS_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(signal) for signal in signals]
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def import_signals_from_json(content: str, path: Path = DEFAULT_SIGNALS_PATH) -> List[LiveSourceSignal]:
    incoming = json.loads(content or "[]")
    imported = [LiveSourceSignal(**item) for item in incoming]
    for signal in imported:
        signal.ensure_metadata()

    existing = load_signals(path)
    combined = existing + imported
    save_signals(combined, path)
    return combined


def refresh_live_signals(path: Path = DEFAULT_SIGNALS_PATH, count: int = 3) -> List[LiveSourceSignal]:
    new_signals: List[LiveSourceSignal] = []
    for idx in range(count):
        signal = LiveSourceSignal(
            source=random.choice(DEFAULT_SOURCES),
            company_name=f"Prospect {random.randint(1000, 9999)}",
            contact_name=f"Contact {idx + 1}",
            email=f"lead{random.randint(1, 9999)}@example.com",
            product_interest=random.choice(["hardwood", "tile", "vinyl", "carpet"]),
            score=random.randint(50, 100),
        )
        signal.ensure_metadata()
        new_signals.append(signal)

    existing = load_signals(path)
    combined = existing + new_signals
    save_signals(combined, path)
    return combined


def signals_to_rows(signals: Optional[List[LiveSourceSignal]] = None, path: Path = DEFAULT_SIGNALS_PATH):
    target = signals if signals is not None else load_signals(path)
    return [asdict(signal) for signal in target]
