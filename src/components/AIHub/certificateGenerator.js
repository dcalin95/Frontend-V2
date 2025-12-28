// Certificate Generator - Separate Logic for Stress Test
// Handles automatic certificate generation and download after payment

export const CERT_I18N = {
  en: {
    certTitle: 'BitSwapDEX AI — Official Stress Resilience Certificate',
    certId: 'Certificate',
    issued: 'Issued',
    participant: 'Participant',
    name: 'Name',
    email: 'Email',
    wallet: 'Wallet',
    scenario: 'Scenario',
    duration: 'Duration',
    startWealth: 'Starting Wealth (USD)',
    finalWealth: 'Final Wealth (USD)',
    stressScore: 'Stress Resilience Score',
    grade: 'Grade',
    verdict: 'Verdict',
    avgAttention: 'Avg. Attention (%)',
    lookAways: 'Look-Aways',
    blinkFreq: 'Blink Frequency',
    avgTension: 'Avg. Tension',
    heartRatePeak: 'Heart Rate Peak',
    biometrics: 'Biometric Data',
    footer: 'This is a simulated stress resilience certificate for entertainment/testing. Not medical or financial advice.',
    fitVerdict: 'FIT FOR HIGH-RISK MARKETS',
    unfitVerdict: 'NOT RECOMMENDED FOR HIGH-STRESS TRADING'
  },
  ro: {
    certTitle: 'BitSwapDEX AI — Official Stress Resilience Certificate',
    certId: 'Certificate',
    issued: 'Issued',
    participant: 'Participant',
    name: 'Name',
    email: 'Email',
    wallet: 'Wallet',
    scenario: 'Scenario',
    duration: 'Duration',
    startWealth: 'Starting Wealth (USD)',
    finalWealth: 'Final Wealth (USD)',
    stressScore: 'Stress Resilience Score',
    grade: 'Grade',
    verdict: 'Verdict',
    avgAttention: 'Avg. Attention (%)',
    lookAways: 'Look-Aways',
    blinkFreq: 'Blink Frequency',
    avgTension: 'Avg. Tension',
    heartRatePeak: 'Heart Rate Peak',
    biometrics: 'Biometric Data',
    footer: 'This is a simulated stress resilience certificate for entertainment/testing. Not medical or financial advice.',
    fitVerdict: 'FIT FOR HIGH-RISK MARKETS',
    unfitVerdict: 'NOT RECOMMENDED FOR HIGH-STRESS TRADING'
  },
  fr: {
    certTitle: 'BitSwapDEX AI — Certificat Officiel de Résilience au Stress',
    certId: 'Certificat',
    issued: 'Émis',
    participant: 'Participant',
    name: 'Nom',
    email: 'E-mail',
    wallet: 'Portefeuille',
    scenario: 'Scénario',
    duration: 'Durée',
    startWealth: 'Richesse Initiale (USD)',
    finalWealth: 'Richesse Finale (USD)',
    stressScore: 'Score de Résilience au Stress',
    grade: 'Note',
    verdict: 'Verdict',
    avgAttention: 'Attention Moyenne (%)',
    lookAways: 'Distractions',
    blinkFreq: 'Fréquence de Clignement',
    avgTension: 'Tension Moyenne',
    heartRatePeak: 'Pic de Fréquence Cardiaque',
    biometrics: 'Données Biométriques',
    footer: 'Ceci est un certificat de résilience au stress simulé à des fins de divertissement/test. Ce n\'est pas un conseil médical ou financier.',
    fitVerdict: 'ADAPTÉ AUX MARCHÉS À HAUT RISQUE',
    unfitVerdict: 'NON RECOMMANDÉ POUR LE TRADING STRESSANT'
  },
  de: {
    certTitle: 'BitSwapDEX AI — Offizielles Stress-Resilienz-Zertifikat',
    certId: 'Zertifikat',
    issued: 'Ausgestellt',
    participant: 'Teilnehmer',
    name: 'Name',
    email: 'E-Mail',
    wallet: 'Wallet',
    scenario: 'Szenario',
    duration: 'Dauer',
    startWealth: 'Anfangsvermögen (USD)',
    finalWealth: 'Endvermögen (USD)',
    stressScore: 'Stress-Resilienz-Score',
    grade: 'Note',
    verdict: 'Urteil',
    avgAttention: 'Durchschn. Aufmerksamkeit (%)',
    lookAways: 'Ablenkungen',
    blinkFreq: 'Blinzelfrequenz',
    avgTension: 'Durchschn. Spannung',
    heartRatePeak: 'Maximale Herzfrequenz',
    biometrics: 'Biometrische Daten',
    footer: 'Dies ist ein simuliertes Stress-Resilienz-Zertifikat zu Unterhaltungs-/Testzwecken. Keine medizinische oder finanzielle Beratung.',
    fitVerdict: 'GEEIGNET FÜR HOCHRISIKOMÄRKTE',
    unfitVerdict: 'NICHT EMPFOHLEN FÜR STRESSVOLLES TRADING'
  },
  ar: {
    certTitle: 'BitSwapDEX AI — شهادة رسمية للمرونة ضد الإجهاد',
    certId: 'شهادة',
    issued: 'صدر',
    participant: 'المشارك',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    wallet: 'المحفظة',
    scenario: 'السيناريو',
    duration: 'المدة',
    startWealth: 'الثروة الأولية (دولار)',
    finalWealth: 'الثروة النهائية (دولار)',
    stressScore: 'درجة المرونة ضد الإجهاد',
    grade: 'الدرجة',
    verdict: 'الحكم',
    avgAttention: 'متوسط الانتباه (%)',
    lookAways: 'الانحرافات',
    blinkFreq: 'تردد الرمش',
    avgTension: 'متوسط التوتر',
    heartRatePeak: 'ذروة معدل ضربات القلب',
    biometrics: 'البيانات البيومترية',
    footer: 'هذه شهادة محاكاة للمرونة ضد الإجهاد لأغراض الترفيه/الاختبار. ليست نصيحة طبية أو مالية.',
    fitVerdict: 'مناسب للأسواق عالية المخاطر',
    unfitVerdict: 'غير موصى به للتداول الضاغط'
  },
  ru: {
    certTitle: 'BitSwapDEX AI — Официальный сертификат стрессоустойчивости',
    certId: 'Сертификат',
    issued: 'Выдан',
    participant: 'Участник',
    name: 'Имя',
    email: 'Эл. почта',
    wallet: 'Кошелёк',
    scenario: 'Сценарий',
    duration: 'Продолжительность',
    startWealth: 'Начальный капитал (USD)',
    finalWealth: 'Конечный капитал (USD)',
    stressScore: 'Оценка стрессоустойчивости',
    grade: 'Оценка',
    verdict: 'Вердикт',
    avgAttention: 'Сред. внимание (%)',
    lookAways: 'Отвлечения',
    blinkFreq: 'Частота моргания',
    avgTension: 'Сред. напряжение',
    heartRatePeak: 'Макс. пульс',
    biometrics: 'Биометрические данные',
    footer: 'Это смоделированный сертификат стрессоустойчивости для развлечения/тестирования. Не является медицинской или финансовой консультацией.',
    fitVerdict: 'ПОДХОДИТ ДЛЯ РЫНКОВ ВЫСОКОГО РИСКА',
    unfitVerdict: 'НЕ РЕКОМЕНДУЕТСЯ ДЛЯ СТРЕССОВОГО ТРЕЙДИНГА'
  }
};

/**
 * Generate complete HTML certificate with all styling and data
 * ENHANCED: Professional medical-grade biometric analysis
 * @param {Object} certificate - Certificate data object
 * @returns {string} Complete HTML document
 */
export function generateCertificateHTML(certificate) {
  if (!certificate) return '';
  
  const c = certificate;
  const t = CERT_I18N[c.lang] || CERT_I18N.en;
  const isRtl = c.lang === 'ar';
  const txLine = c.payment?.txHash 
    ? `<div class="sub">Payment TX: <strong>${c.payment.txHash}</strong></div>` 
    : '';

  // Professional biometric analysis
  const avgAttention = c.attention?.lookingPct || 0;
  const blinkRate = c.attention?.blinkPerMin || 0;
  const engagementScore = c.attention?.engagementScore || 0;
  const lookAwayCount = c.attention?.lookAwayCount || 0;
  
  // Calculate professional stress metrics
  const stressIndex = Math.round((c.score / 100) * 10);
  const resilenceLevel = c.score >= 90 ? 'Exceptional' : c.score >= 80 ? 'High' : c.score >= 70 ? 'Moderate' : c.score >= 60 ? 'Low' : 'Critical';
  const psychologicalStability = c.score >= 75 ? 'Stable' : c.score >= 50 ? 'Borderline' : 'Unstable';
  
  // Medical-grade recommendations
  const recommendations = c.score >= 80 
    ? 'Subject demonstrates exceptional stress resilience. Suitable for high-pressure financial environments.'
    : c.score >= 60
    ? 'Subject shows moderate stress tolerance. Recommended for medium-risk trading with proper risk management protocols.'
    : 'Subject exhibits low stress resilience. High-risk trading NOT RECOMMENDED. Consider professional psychological assessment.';

  return `<!doctype html>
<html lang="${c.lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${t.certTitle}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0b0b0b; color: #f5f5f5; margin: 0; padding: 24px; direction: ${isRtl ? 'rtl' : 'ltr'}; }
    .page { position: relative; max-width: 1000px; margin: 0 auto; border: 2px solid rgba(0,255,102,0.45); padding: 32px; border-radius: 18px; background: linear-gradient(180deg, rgba(0,0,0,0.85), rgba(20,0,0,0.75)); overflow: hidden; }
    .watermark { position: absolute; inset: -90px; 
      background:
        url("data:image/svg+xml,%3Csvg width='360' height='260' viewBox='0 0 360 260' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='180' y='130' font-family='Roboto, sans-serif' font-weight='700' font-size='11' fill='rgba(0, 255, 102, 0.12)' text-anchor='middle' transform='rotate(-24 180 130)'%3EThe Quantum Stress Test is an Official AI BitSwapDEX Diagnostic%3C/text%3E%3C/svg%3E") repeat,
        radial-gradient(circle at 20% 30%, rgba(0,255,102,0.10), transparent 55%),
        radial-gradient(circle at 75% 40%, rgba(112,0,255,0.08), transparent 55%),
        conic-gradient(from 180deg, rgba(255,0,51,0.06), rgba(0,255,102,0.05), rgba(255,255,255,0.035), rgba(112,0,255,0.05), rgba(255,0,51,0.06));
      mix-blend-mode: screen;
      opacity: 0.7;
      pointer-events: none;
    }
    .cert-logo { position: absolute; top: 24px; ${isRtl ? 'right' : 'left'}: 24px; display: flex; align-items: center; gap: 12px; padding: 14px 18px; 
      background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(10,10,20,0.85)); border: 2px solid rgba(0,255,102,0.5); 
      border-radius: 12px; box-shadow: 0 0 30px rgba(0,255,102,0.2); }
    .cert-logo-icon { width: 44px; height: 44px; background: radial-gradient(circle, rgba(0,255,102,0.15), transparent); 
      border-radius: 8px; border: 1px solid rgba(0,255,102,0.3); display: flex; align-items: center; justify-content: center; }
    .cert-logo-icon svg { width: 32px; height: 32px; filter: drop-shadow(0 0 6px rgba(0,255,102,0.6)); }
    .cert-logo-text { display: flex; flex-direction: column; gap: 2px; }
    .cert-logo-title { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 900; letter-spacing: 2px; 
      background: linear-gradient(135deg, #00ff66, #00cc88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cert-logo-url { font-family: 'Roboto Mono', monospace; font-size: 9px; font-weight: 600; color: rgba(0,255,102,0.8); letter-spacing: 0.5px; }
    .cert-logo-badge { font-family: 'Roboto Mono', monospace; font-size: 8px; font-weight: 600; color: rgba(170,100,255,0.9); 
      letter-spacing: 0.8px; text-transform: uppercase; }
    .seal { position: absolute; ${isRtl ? 'left' : 'right'}: 22px; top: 22px; width: 96px; height: 96px; border-radius: 50%;
      border: 2px solid rgba(0,255,102,0.55);
      box-shadow: 0 0 28px rgba(0,255,102,0.18), inset 0 0 22px rgba(255,255,255,0.08);
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), rgba(0,0,0,0.6));
    }
    .seal::after { content: "BSDX\\A AI"; white-space: pre; position: absolute; inset: 0; display: grid; place-items: center;
      font-weight: 900; letter-spacing: 2px; color: rgba(0,255,102,0.9); font-size: 18px; text-align: center; }
    h1 { margin: 0 0 8px; letter-spacing: 1px; font-size: 28px; }
    .sub { opacity: 0.85; margin-bottom: 18px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .box { border: 1px solid rgba(255,255,255,0.14); border-radius: 14px; padding: 16px; background: rgba(0,0,0,0.35); text-align: ${isRtl ? 'right' : 'left'}; }
    .k { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .v { font-size: 15px; word-break: break-word; font-weight: 600; }
    .score-box { text-align: center; padding: 24px; background: rgba(0,0,0,0.5); border: 2px solid rgba(0,255,102,0.4); border-radius: 16px; margin: 24px 0; }
    .score { font-size: 56px; font-weight: 900; color: ${c.fit ? '#00ff66' : '#ff0033'}; margin: 12px 0; }
    .badge { display: inline-block; padding: 10px 16px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.18); margin-top: 12px; font-weight: 700; }
    .analysis-section { background: rgba(0,255,102,0.05); border: 1px solid rgba(0,255,102,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .analysis-title { font-size: 16px; font-weight: 800; color: #00ff66; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .analysis-text { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.85); }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .metric { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; text-align: center; }
    .metric-value { font-size: 20px; font-weight: 900; color: #00ff66; margin-bottom: 4px; }
    .metric-label { font-size: 10px; text-transform: uppercase; opacity: 0.7; letter-spacing: 0.5px; }
    .foot { margin-top: 24px; font-size: 11px; opacity: 0.7; text-align: ${isRtl ? 'right' : 'left'}; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
    @media print { 
      body { background: #fff; color: #000; } 
      .page { background: #fff; border-color: #000; } 
      .box, .metric, .analysis-section { background: #fff; } 
      .score { color: #000; } 
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cert-logo">
      <div class="cert-logo-icon">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="certBitsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#00ff66;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#00cc88;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#certBitsGrad)" stroke-width="4" opacity="0.3"/>
          <path d="M30 35 L30 65 L50 65 Q65 65 65 50 Q65 35 50 35 L30 35 M30 50 L50 50" 
                fill="none" stroke="url(#certBitsGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="70" cy="35" r="3" fill="url(#certBitsGrad)"/>
          <circle cx="70" cy="50" r="3" fill="url(#certBitsGrad)"/>
          <circle cx="70" cy="65" r="3" fill="url(#certBitsGrad)"/>
        </svg>
      </div>
      <div class="cert-logo-text">
        <div class="cert-logo-title">BITS A.I</div>
        <div class="cert-logo-url">bits-ai.io</div>
        <div class="cert-logo-badge">Quantum Stress Lab</div>
      </div>
    </div>
    <div class="watermark"></div>
    <div class="seal"></div>
    <h1>${t.certTitle}</h1>
    <div class="sub">${t.certId}: <strong>${c.certId}</strong> • ${t.issued}: <strong>${new Date(c.issuedAt).toUTCString()}</strong></div>
    ${txLine}
    
    <div class="grid">
      <div class="box"><div class="k">Participant Name</div><div class="v">${c.name || 'N/A'}</div></div>
      <div class="box"><div class="k">Email</div><div class="v">${c.email || 'N/A'}</div></div>
      <div class="box"><div class="k">Wallet Address</div><div class="v" style="word-break:break-all;font-size:12px;">${c.wallet}</div></div>
      <div class="box"><div class="k">Test Scenario</div><div class="v">${c.scenario}</div></div>
      <div class="box"><div class="k">Starting Capital</div><div class="v">$${Number(c.startingWealthUsd || 0).toLocaleString()}</div></div>
      <div class="box"><div class="k">Final Capital</div><div class="v" style="color:#ff0033;">$0.00</div></div>
      <div class="box"><div class="k">Test Duration</div><div class="v">10:00 minutes</div></div>
      <div class="box"><div class="k">Camera Verification</div><div class="v">${c.cameraVerified ? '✅ VERIFIED' : '⚠️ NOT VERIFIED'}</div></div>
    </div>

    <div class="score-box">
      <div style="font-size:14px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">Quantum Stress Resilience Score</div>
      <div class="score">${c.score}/100</div>
      <div class="badge" style="border-color: ${c.fit ? '#00ff66' : '#ff0033'}; color: ${c.fit ? '#00ff66' : '#ff0033'};">
        GRADE: ${c.grade} • ${c.fit ? 'FIT FOR HIGH-RISK MARKETS' : 'NOT FIT FOR HIGH-RISK MARKETS'}
      </div>
    </div>

    <div class="analysis-section">
      <div class="analysis-title">📊 Professional Biometric Analysis</div>
      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-value">${avgAttention.toFixed(1)}%</div>
          <div class="metric-label">Attention Rate</div>
        </div>
        <div class="metric">
          <div class="metric-value">${blinkRate}</div>
          <div class="metric-label">Blink/Min</div>
        </div>
        <div class="metric">
          <div class="metric-value">${engagementScore.toFixed(0)}</div>
          <div class="metric-label">Engagement</div>
        </div>
        <div class="metric">
          <div class="metric-value">${lookAwayCount}</div>
          <div class="metric-label">Look-Aways</div>
        </div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-value">${stressIndex}/10</div>
          <div class="metric-label">Stress Index</div>
        </div>
        <div class="metric">
          <div class="metric-value">${resilenceLevel}</div>
          <div class="metric-label">Resilience</div>
        </div>
        <div class="metric">
          <div class="metric-value">${psychologicalStability}</div>
          <div class="metric-label">Stability</div>
        </div>
        <div class="metric">
          <div class="metric-value">${c.fit ? 'PASS' : 'FAIL'}</div>
          <div class="metric-label">Assessment</div>
        </div>
      </div>

      <div class="analysis-text">
        <strong>Clinical Assessment:</strong> ${recommendations}
      </div>
    </div>

    <div class="foot">
      <strong>Legal Disclaimer:</strong> ${t.footer}
      <br /><br />
      <strong>Issued by:</strong> BitSwapDEX AI - Quantum Stress Lab | <strong>bits-ai.io</strong>
      <br />
      <strong>Methodology:</strong> This assessment uses real-time facial tracking, attention monitoring, and biometric analysis during a 10-minute high-stress financial simulation.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Open certificate in new window for print/save
 * @param {Object} certificate - Certificate data object
 */
export function openCertificateWindow(certificate) {
  if (!certificate) {
    console.error('[CertificateGenerator] No certificate data provided');
    return;
  }

  try {
    const html = generateCertificateHTML(certificate);
    const win = window.open('', '_blank');
    
    if (!win) {
      console.error('[CertificateGenerator] Popup blocked. Please allow popups for this site.');
      alert('Please allow popups to view your certificate.');
      return;
    }

    win.document.write(html);
    win.document.close();
    
    // Auto-focus and trigger print dialog after a short delay
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);

    console.log('✅ [CertificateGenerator] Certificate opened successfully');
  } catch (err) {
    console.error('[CertificateGenerator] Error opening certificate:', err);
    alert('Error generating certificate. Please try again.');
  }
}

/**
 * Download certificate as HTML file
 * @param {Object} certificate - Certificate data object
 */
export function downloadCertificateHTML(certificate) {
  if (!certificate) {
    console.error('[CertificateGenerator] No certificate data provided for download');
    return;
  }

  try {
    const html = generateCertificateHTML(certificate);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BitSwapDEX_Certificate_${certificate.certId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ [CertificateGenerator] Certificate downloaded successfully');
  } catch (err) {
    console.error('[CertificateGenerator] Error downloading certificate:', err);
    alert('Error downloading certificate. Please try again.');
  }
}

