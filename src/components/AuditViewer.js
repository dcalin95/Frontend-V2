import React, { useState } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "./AuditViewer.css";

const auditPDF = process.env.PUBLIC_URL + "/pdf/BitSwapDEX_audit.pdf";
const tokenPDF = process.env.PUBLIC_URL + "/pdf/BitSwapDEX_Token.pdf";

const AuditViewer = () => {
  const [selected, setSelected] = useState("audit");

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "transparent",
        zIndex: 1,
      }}
    >
      {/* Butoane */}
      <div className="pdf-toggle-group">
        <button
          className={`pdf-toggle-btn ${selected === "audit" ? "active" : ""}`}
          onClick={() => setSelected("audit")}
        >
          Audit Report
        </button>
        <button
          className={`pdf-toggle-btn ${selected === "token" ? "active" : ""}`}
          onClick={() => setSelected("token")}
        >
          Token Report
        </button>
      </div>

      {/* PDF Viewer */}
      <div
        style={{
          height: "calc(100vh - 80px)",
          width: "100%",
          overflow: "auto",
          backgroundColor: "transparent",
        }}
      >
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
     <Viewer
  fileUrl={selected === "audit" ? auditPDF : tokenPDF}
  defaultScale={1.5}
  theme="dark" // ← Lasă aici "dark" ca să nu mai vină fundalul alb
/>

        </Worker>
      </div>
    </div>
  );
};

export default AuditViewer;
