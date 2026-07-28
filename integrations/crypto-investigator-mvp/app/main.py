from io import BytesIO
import re
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from .analysis import analyse
from .config import settings
from .providers import EtherscanProvider, ProviderError
from .report import make_pdf

app = FastAPI(title="Crypto Investigator MVP", version="0.1.0")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
provider = EtherscanProvider()
ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")


@app.get("/", response_class=HTMLResponse)
async def index():
    return FileResponse("app/static/index.html")


@app.get("/api/analyse/{address}")
async def analyse_address(address: str, chain_id: int = settings.default_chain_id):
    if not ADDRESS.match(address):
        raise HTTPException(422, "Invalid EVM address")
    try:
        transfers = await provider.token_transfers(address, chain_id)
        return analyse(address, chain_id, transfers)
    except ProviderError as exc:
        raise HTTPException(502, str(exc)) from exc


@app.get("/api/report/{address}.pdf")
async def report(address: str, chain_id: int = settings.default_chain_id):
    if not ADDRESS.match(address):
        raise HTTPException(422, "Invalid EVM address")
    transfers = await provider.token_transfers(address, chain_id)
    result = analyse(address, chain_id, transfers)
    return StreamingResponse(BytesIO(make_pdf(result)), media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="crypto-report-{address[:10]}.pdf"'})


@app.get("/health")
async def health():
    return {"status": "ok", "demo_mode": not bool(settings.etherscan_api_key)}
