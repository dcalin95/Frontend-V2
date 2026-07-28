from datetime import datetime, timezone
from decimal import Decimal
from app.analysis import analyse
from app.models import Transfer


def test_dispersion_signal():
    subject = "0x" + "1" * 40
    transfers = [Transfer(tx_hash="0x"+str(i).zfill(64), timestamp=datetime.now(timezone.utc), sender=subject,
        recipient="0x"+str(i)*40, token_symbol="USDT", amount=Decimal("100000")) for i in range(2,5)]
    result = analyse(subject, 1, transfers)
    assert result.risk_score >= 25
    assert any(s.code == "DISPERSION" for s in result.signals)
