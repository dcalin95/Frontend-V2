from datetime import datetime, timezone
from decimal import Decimal
import httpx
from .config import settings
from .models import Transfer


class ProviderError(RuntimeError):
    pass


class EtherscanProvider:
    async def token_transfers(self, address: str, chain_id: int) -> list[Transfer]:
        if not settings.etherscan_api_key:
            return self._demo(address)
        params = {
            "chainid": chain_id,
            "module": "account",
            "action": "tokentx",
            "address": address,
            "page": 1,
            "offset": settings.max_transfers,
            "sort": "desc",
            "apikey": settings.etherscan_api_key,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(settings.etherscan_base_url, params=params)
            response.raise_for_status()
            payload = response.json()
        if payload.get("status") != "1":
            message = payload.get("message", "Unknown provider error")
            result = payload.get("result", "")
            if message == "No transactions found":
                return []
            raise ProviderError(f"Etherscan: {message}: {result}")
        transfers: list[Transfer] = []
        for row in payload["result"]:
            decimals = int(row.get("tokenDecimal") or 0)
            amount = Decimal(row["value"]) / (Decimal(10) ** decimals)
            transfers.append(Transfer(
                tx_hash=row["hash"],
                timestamp=datetime.fromtimestamp(int(row["timeStamp"]), tz=timezone.utc),
                sender=row["from"].lower(),
                recipient=row["to"].lower(),
                token_symbol=row.get("tokenSymbol", "TOKEN"),
                token_name=row.get("tokenName", ""),
                token_contract=row.get("contractAddress", "").lower(),
                amount=amount,
            ))
        return transfers

    def _demo(self, address: str) -> list[Transfer]:
        a = address.lower()
        samples = [
            ("0xaaa0000000000000000000000000000000000001", a, "USDT", "125000", 1),
            (a, "0xbbb0000000000000000000000000000000000002", "USDT", "60000", 2),
            (a, "0xccc0000000000000000000000000000000000003", "USDT", "40000", 3),
            (a, "0xddd0000000000000000000000000000000000004", "USDT", "20000", 4),
            ("0xeee0000000000000000000000000000000000005", a, "LAB", "8000000", 5),
            (a, "0xfff0000000000000000000000000000000000006", "LAB", "7000000", 6),
        ]
        now = datetime.now(timezone.utc)
        return [Transfer(
            tx_hash=f"0x{i:064x}", timestamp=now.replace(microsecond=0), sender=s,
            recipient=r, token_symbol=sym, token_name=sym,
            token_contract=f"0x{i:040x}", amount=Decimal(value)
        ) for s, r, sym, value, i in samples]
