from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
import networkx as nx
from .models import AnalysisResponse, GraphEdge, GraphNode, RiskSignal, Transfer


def analyse(address: str, chain_id: int, transfers: list[Transfer]) -> AnalysisResponse:
    address = address.lower()
    incoming: dict[str, Decimal] = defaultdict(Decimal)
    outgoing: dict[str, Decimal] = defaultdict(Decimal)
    counterparties: set[str] = set()
    edge_bucket: dict[tuple[str, str, str], dict] = {}
    g = nx.MultiDiGraph()
    g.add_node(address)

    for tx in transfers:
        counterparties.update([tx.sender, tx.recipient])
        if tx.recipient == address:
            incoming[tx.token_symbol] += tx.amount
        if tx.sender == address:
            outgoing[tx.token_symbol] += tx.amount
        key = (tx.sender, tx.recipient, tx.token_symbol)
        bucket = edge_bucket.setdefault(key, {"amount": Decimal(0), "count": 0})
        bucket["amount"] += tx.amount
        bucket["count"] += 1
        g.add_edge(tx.sender, tx.recipient, symbol=tx.token_symbol, amount=float(tx.amount))

    counterparties.discard(address)
    signals: list[RiskSignal] = []
    out_txs = [t for t in transfers if t.sender == address]
    in_txs = [t for t in transfers if t.recipient == address]

    if len({t.recipient for t in out_txs}) >= 3 and len(out_txs) >= 3:
        signals.append(RiskSignal(code="DISPERSION", label="Rapid fund dispersion", points=25,
            evidence=f"Outgoing transfers were distributed across {len({t.recipient for t in out_txs})} counterparties."))
    if in_txs and out_txs:
        in_total = sum((t.amount for t in in_txs), Decimal(0))
        out_total = sum((t.amount for t in out_txs), Decimal(0))
        if in_total > 0 and out_total / in_total >= Decimal("0.75"):
            signals.append(RiskSignal(code="PASS_THROUGH", label="High pass-through ratio", points=25,
                evidence=f"Outgoing value is approximately {(out_total / in_total * 100):.1f}% of incoming value across observed tokens."))
    if len(counterparties) >= 5:
        signals.append(RiskSignal(code="COUNTERPARTIES", label="Broad counterparty exposure", points=10,
            evidence=f"The address interacted with {len(counterparties)} distinct counterparties in the sample."))
    large = [t for t in transfers if t.amount >= Decimal("100000")]
    if large:
        signals.append(RiskSignal(code="LARGE_TRANSFERS", label="Large-value movements", points=15,
            evidence=f"Detected {len(large)} transfer(s) with raw token amount of at least 100,000."))

    score = min(100, sum(s.points for s in signals))
    level = "low" if score < 30 else "moderate" if score < 60 else "high" if score < 80 else "critical"
    nodes = [GraphNode(id=n, label=_short(n), kind="subject" if n == address else "wallet", risk=score if n == address else 0) for n in g.nodes]
    edges = [GraphEdge(source=s, target=t, symbol=sym, amount=data["amount"], tx_count=data["count"])
             for (s, t, sym), data in edge_bucket.items()]

    return AnalysisResponse(
        address=address, chain_id=chain_id, generated_at=datetime.now(timezone.utc),
        transfer_count=len(transfers), counterparties=len(counterparties),
        total_incoming=dict(incoming), total_outgoing=dict(outgoing), risk_score=score,
        risk_level=level, signals=signals, transfers=transfers, nodes=nodes, edges=edges,
        disclaimer="Risk signals are investigative indicators, not proof of criminal conduct or identity attribution. Demo mode uses synthetic data when no Etherscan API key is configured."
    )


def _short(address: str) -> str:
    return f"{address[:6]}…{address[-4:]}" if len(address) > 14 else address
