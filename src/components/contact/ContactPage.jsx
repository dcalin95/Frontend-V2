import React, { useState } from "react";
import "./ContactPage.clean.css";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const sendMail = (e) => {
    e.preventDefault();
    setError("");
    const subject = `[BitsDex_AI] ${form.subject || "Contact"}`;
    const attachmentNote = file ? `\n\n[Please attach file manually: ${file.name}]` : "";
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}${attachmentNote}`;
    try {
      const params = new URLSearchParams({ subject, body });
      const mailto = `mailto:contact@bits-ai.io?${params.toString()}`;
      window.location.href = mailto;
      setStatus("sent");
    } catch (err) {
      console.error("mailto open error:", err);
      setStatus("error");
      setError("Could not open your email app.");
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-card">
        <div className="contact-header">
          <span className="badge">Let’s talk</span>
          <h1 className="contact-title">Contact</h1>
          <p className="contact-subtitle">We reply within 24–48h. For partnerships and press, use this form.</p>
        </div>

        <div className="contact-wrapper">
          <aside className="contact-info">
            <ul className="info-list">
              <li><i className="fas fa-paper-plane"></i> Direct email: <a href="mailto:contact@bits-ai.io">contact@bits-ai.io</a></li>
              <li><i className="fas fa-clock"></i> Response time: 24–48 hours</li>
              <li><i className="fas fa-shield-alt"></i> No wallet data stored</li>
              <li><i className="fas fa-file"></i> Attachments must be added in your email client</li>
              <li><i className="fab fa-telegram"></i> Telegram group: <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noreferrer">@BitSwapDEX_AI</a></li>
            </ul>
            <div className="qr-grid">
              <div className="qr-item">
                <img
                  className="qr-img"
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Ft.me%2FBitSwapDEX_AI"
                  alt="Telegram QR @BitSwapDEX_AI"
                />
                <div className="qr-caption">Telegram group</div>
              </div>
            </div>
          </aside>

          <form onSubmit={sendMail} className="contact-form contact-grid">
          <div className="form-row two-col">
            <div className="form-group">
              <label>Name</label>
              <div className="input-with-icon">
                <i className="far fa-user"></i>
                <input name="name" value={form.name} onChange={onChange} required placeholder="Your name" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <i className="far fa-envelope"></i>
                <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
              </div>
              <small className="hint">We'll use this to get back to you.</small>
            </div>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <div className="input-with-icon">
              <i className="far fa-comment"></i>
              <input name="subject" value={form.subject} onChange={onChange} placeholder="Subject" />
            </div>
          </div>

          <div className="form-group">
            <label>Message</label>
            <div className="input-with-icon textarea">
              <i className="far fa-edit"></i>
              <textarea name="message" value={form.message} onChange={onChange} required rows={6} placeholder="How can we help?" />
            </div>
          </div>

          <div className="form-group">
            <label>Attachment (optional)</label>
            <div className="file-row">
              <input
                id="attachment"
                className="file-input"
                type="file"
                accept="image/*,application/pdf,.txt,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="attachment" className="btn-file">Choose file</label>
              <span className="file-name">{file ? file.name : "No file selected"}</span>
            </div>
            <small className="hint">You’ll need to attach the file manually in your email client.</small>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={status === "sending"} className="btn-send">
              {status === "sending" ? "Sending…" : "Send"}
            </button>
            <a href="mailto:contact@bits-ai.io" className="mailto-link">contact@bits-ai.io</a>
          </div>

          {status === "sent" && (
            <div className="status sent">Message sent. Thank you! If you don't see a reply in 48h, email contact@bits-ai.io.</div>
          )}
          {status === "error" && (
            <div className="status error">Could not send. Please try again or email contact@bits-ai.io.</div>
          )}
          {!!error && (
            <div className="status warn">{error}</div>
          )}
          </form>
        </div>
      </div>
      <div className="company-info">
        <div className="company-title">Company & Mailing Address</div>
        <div className="company-text">
          Administered by <strong>Bitswapdex LAB</strong> (Company No. <strong>250661</strong>).<br/>
          Registered office: <strong>Suite 1, Second Floor, Sound & Vision House, Rue Pierre De Possession, Victoria, Mahé, Seychelles</strong>.
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
