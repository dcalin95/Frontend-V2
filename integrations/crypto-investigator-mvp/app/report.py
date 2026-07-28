from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors
from .models import AnalysisResponse


def make_pdf(result: AnalysisResponse) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title="Crypto Investigation Report")
    styles = getSampleStyleSheet()
    story = [Paragraph("Crypto Investigation Report", styles["Title"]), Spacer(1, 12)]
    story += [Paragraph(f"Address: {result.address}", styles["BodyText"]),
              Paragraph(f"Chain ID: {result.chain_id}", styles["BodyText"]),
              Paragraph(f"Risk: {result.risk_score}/100 ({result.risk_level})", styles["Heading2"]), Spacer(1, 8)]
    if result.signals:
        data = [["Signal", "Points", "Evidence"]] + [[s.label, str(s.points), s.evidence] for s in result.signals]
        table = Table(data, colWidths=[120, 45, 330])
        table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.lightgrey), ("GRID", (0,0), (-1,-1), .5, colors.grey), ("VALIGN", (0,0), (-1,-1), "TOP")]))
        story += [table, Spacer(1, 12)]
    txdata = [["Token", "Amount", "From", "To"]]
    for t in result.transfers[:30]:
        txdata.append([t.token_symbol, f"{t.amount}", t.sender[:12] + "…", t.recipient[:12] + "…"])
    table = Table(txdata, colWidths=[50, 90, 175, 175])
    table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.lightgrey), ("GRID", (0,0), (-1,-1), .4, colors.grey)]))
    story += [Paragraph("Observed transfers", styles["Heading2"]), table, Spacer(1, 12), Paragraph(result.disclaimer, styles["Italic"])]
    doc.build(story)
    return buffer.getvalue()
