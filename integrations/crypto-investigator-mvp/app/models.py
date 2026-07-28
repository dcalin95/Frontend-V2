from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class Transfer(BaseModel):
    tx_hash: str
    timestamp: datetime
    sender: str
    recipient: str
    token_symbol: str
    token_name: str = ""
    token_contract: str = ""
    amount: Decimal


class RiskSignal(BaseModel):
    code: str
    label: str
    points: int
    evidence: str


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str = "wallet"
    risk: int = 0


class GraphEdge(BaseModel):
    source: str
    target: str
    amount: Decimal
    symbol: str
    tx_count: int = 1


class AnalysisResponse(BaseModel):
    address: str
    chain_id: int
    generated_at: datetime
    transfer_count: int
    counterparties: int
    total_incoming: dict[str, Decimal]
    total_outgoing: dict[str, Decimal]
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    signals: list[RiskSignal]
    transfers: list[Transfer]
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    disclaimer: str
