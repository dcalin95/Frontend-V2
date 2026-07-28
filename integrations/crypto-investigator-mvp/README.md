# Crypto Investigator MVP

MVP defensiv pentru analiza preliminară a adreselor EVM: transferuri ERC-20, graf de contrapartide, reguli explicabile de risc și raport PDF.

## Pornire rapidă

```bash
cp .env.example .env
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Deschide `http://127.0.0.1:8000`. Fără `ETHERSCAN_API_KEY`, aplicația funcționează în mod demonstrativ cu date sintetice.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

## Deploy pe Render

1. Creează un Web Service din repository-ul acestui proiect și lasă Render să citească `render.yaml`.
2. Adaugă în Render secretul `ETHERSCAN_API_KEY` (nu îl pune în Git sau în S3).
3. După deploy, configurează domeniul `investigator.bits-ai.io` către serviciu.
4. Verifică `https://investigator.bits-ai.io/health`; endpointul trebuie să răspundă cu `status: ok`.

Aplicația servește propria interfață și API-ul FastAPI din același serviciu. Frontendul `bits-ai.io` doar deschide acest serviciu din butonul **Investigator** din header.

## API

- `GET /api/analyse/{address}?chain_id=1`
- `GET /api/report/{address}.pdf?chain_id=1`
- `GET /health`

## Limitări actuale

- folosește numai transferurile ERC-20 furnizate de Etherscan V2;
- nu include tranzacții native, internal transactions, traces, prețuri USD sau etichete KYC;
- pragurile sunt euristice și folosesc cantitatea brută a tokenului, nu valoarea monetară;
- scorurile reprezintă indicii investigative, nu constatări juridice.

## Extensii prioritare

1. indexare tranzacții native și internal transactions;
2. prețuri istorice și normalizare USD;
3. bază de etichete pentru exchange-uri, bridge-uri și contracte;
4. PostgreSQL/ClickHouse și cozi de procesare;
5. alerte WebSocket și monitorizare continuă;
6. graf interactiv și trasee multi-hop;
7. autentificare, dosare și audit log.
