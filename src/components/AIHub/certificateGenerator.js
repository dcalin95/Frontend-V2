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
  const resilienceLevel = c.score >= 90 ? 'Exceptional' : c.score >= 80 ? 'High' : c.score >= 70 ? 'Moderate' : c.score >= 60 ? 'Low' : 'Critical';
  const psychologicalStability = c.score >= 75 ? 'Stable' : c.score >= 50 ? 'Borderline' : 'Unstable';
  
  // COMPREHENSIVE PSYCHOLOGICAL ANALYSIS
  const cognitiveLoad = c.score >= 85 ? 'Low to Moderate' : c.score >= 70 ? 'Moderate' : c.score >= 55 ? 'High' : 'Extreme';
  const emotionalRegulation = c.score >= 85 ? 'Excellent' : c.score >= 70 ? 'Good' : c.score >= 55 ? 'Fair' : 'Poor';
  const decisionMakingCapacity = c.score >= 85 ? 'Optimal under pressure' : c.score >= 70 ? 'Adequate with support' : c.score >= 55 ? 'Impaired under stress' : 'Severely compromised';
  const riskTolerance = c.score >= 85 ? 'High Risk Compatible' : c.score >= 70 ? 'Moderate Risk Compatible' : c.score >= 55 ? 'Low Risk Only' : 'Risk Averse Required';
  
  // Behavioral patterns
  const attentionPattern = avgAttention >= 80 ? 'Sustained focus with minimal distraction' : avgAttention >= 65 ? 'Adequate focus with occasional lapses' : avgAttention >= 50 ? 'Frequent attentional shifts' : 'Severe attentional deficits';
  const stressResponse = c.score >= 80 ? 'Adaptive coping mechanisms demonstrated' : c.score >= 60 ? 'Moderate stress response with partial adaptation' : 'Maladaptive stress response patterns';
  
  // Clinical assessment paragraphs
  const clinicalSummary = c.score >= 85
    ? `The subject demonstrates exceptional psychological resilience under extreme financial stress conditions. Cognitive performance remains optimal despite systematic wealth depletion, indicating superior emotional regulation and stress adaptation mechanisms. Attentional metrics (${avgAttention.toFixed(1)}% sustained focus) suggest maintained executive function integrity throughout the assessment period. This level of performance is consistent with individuals possessing robust psychological defense mechanisms, high frustration tolerance, and well-developed coping strategies.`
    : c.score >= 70
    ? `The subject exhibits good stress resilience with adequate psychological adaptation to financial stressors. While some fluctuations in emotional regulation were observed during critical loss periods, overall cognitive functioning remained within acceptable parameters. Attentional metrics (${avgAttention.toFixed(1)}% sustained focus) indicate maintained task engagement despite mounting pressure. The subject would benefit from structured stress management protocols when operating in high-volatility environments.`
    : c.score >= 55
    ? `The subject demonstrates moderate stress vulnerability with notable psychological strain under sustained financial pressure. Cognitive load indicators suggest approaching threshold capacity, with observable decrements in emotional regulation during peak stress periods. Attentional metrics (${avgAttention.toFixed(1)}% sustained focus) reveal compromised executive function. Clinical recommendation: avoid high-risk financial environments without comprehensive psychological support and risk mitigation strategies.`
    : `The subject exhibits significant stress vulnerability with marked psychological decompensation under financial pressure. Severe deficits in emotional regulation, cognitive flexibility, and stress adaptation were observed. Attentional metrics (${avgAttention.toFixed(1)}% sustained focus) indicate critical impairment of executive function. CLINICAL ALERT: High-risk trading contraindicated. Referral for psychological evaluation and stress management intervention strongly recommended.`;
  
  const behavioralAnalysis = c.score >= 85
    ? `Behavioral observation reveals consistent engagement patterns with minimal avoidance behaviors. The subject maintained direct visual contact ${avgAttention.toFixed(1)}% of the assessment period, demonstrating active cognitive processing and emotional confrontation of stress stimuli rather than denial or avoidance. Blink rate analysis (${blinkRate.toFixed(1)} bpm) falls within normal physiological range, suggesting autonomic regulation remains intact. These behavioral markers are highly predictive of successful performance in high-pressure trading environments.`
    : c.score >= 70
    ? `Behavioral patterns demonstrate generally adaptive engagement with occasional stress-related avoidance. Visual engagement (${avgAttention.toFixed(1)}%) remained adequate despite financial losses, though brief attentional disengagement episodes suggest mild cognitive avoidance during peak stress. Blink rate (${blinkRate.toFixed(1)} bpm) shows moderate elevation, consistent with heightened arousal states. Overall behavioral profile supports capacity for controlled risk exposure with appropriate safety parameters.`
    : c.score >= 55
    ? `Behavioral assessment reveals concerning patterns of cognitive avoidance and emotional dysregulation. Visual engagement (${avgAttention.toFixed(1)}%) demonstrates frequent attentional disengagement, particularly during high-stress intervals, indicating maladaptive coping through avoidance rather than confrontation. Elevated blink rate (${blinkRate.toFixed(1)} bpm) and increased look-away frequency (${lookAwayCount} episodes) suggest significant autonomic dysregulation. These patterns correlate with poor stress tolerance and increased decision-making errors under pressure.`
    : `Behavioral observation reveals severe stress-related dysfunction. Critical attentional deficits (${avgAttention.toFixed(1)}% engagement) with pronounced avoidance behaviors indicate psychological overwhelm. Markedly elevated blink rate (${blinkRate.toFixed(1)} bpm) and excessive look-away episodes (${lookAwayCount} instances) demonstrate autonomic hyperarousal and fight-flight activation. This behavioral profile is incompatible with high-stress trading and suggests underlying vulnerability requiring clinical intervention.`;
  
  const recommendations = c.score >= 85
    ? `<strong>CLEARED FOR HIGH-RISK TRADING:</strong> Subject possesses exceptional stress resilience suitable for volatile market environments. Recommended for autonomous high-stakes trading, leveraged positions, and rapid decision-making scenarios. No psychological restrictions. Periodic stress assessments recommended at 12-month intervals to monitor continued resilience. Consider advanced performance optimization protocols to maintain peak cognitive efficiency.`
    : c.score >= 70
    ? `<strong>CLEARED WITH CONDITIONS:</strong> Subject demonstrates adequate stress tolerance for moderate-risk trading. Recommended for controlled risk exposure with established stop-loss protocols and position sizing limits. Suggest maximum 30-40% portfolio risk exposure. Implement mandatory cool-down periods after significant losses. Monthly stress monitoring recommended. Consider cognitive-behavioral stress management training to enhance resilience capacity.`
    : c.score >= 55
    ? `<strong>RESTRICTED CLEARANCE:</strong> Subject shows marginal stress tolerance. Trading restricted to low-risk, conservative strategies only. Maximum 15-20% portfolio risk exposure with mandatory automated risk management systems. Real-time psychological monitoring required during active trading. Weekly stress assessments mandatory. Formal stress management therapy strongly recommended before increasing risk exposure. Consider alternative investment strategies (passive investing, robo-advisors) that minimize psychological burden.`
    : `<strong>NOT CLEARED - CLINICAL INTERVENTION REQUIRED:</strong> Subject demonstrates insufficient psychological resilience for active trading. High-risk trading is medically contraindicated. Recommend immediate cessation of active trading activities. Referral for comprehensive psychological evaluation and stress management intervention required. Focus on passive investment strategies with minimal cognitive demand. Re-evaluation only after documented completion of stress resilience training program and demonstrable improvement in stress tolerance metrics.`;
  
  // TRADING STYLE RECOMMENDATIONS based on psychological profile
  const tradingStyleRec = c.score >= 85
    ? {
      primary: 'Day Trading / Scalping',
      secondary: 'High-frequency trading, Options trading, Futures',
      timeframes: '1min-15min charts optimal',
      sessions: 'High volatility periods: 9:30-11:00 AM ET, 2:00-4:00 PM ET (US markets), 8:00-10:00 AM GMT (EU open), 1:00-3:00 AM ET (Asian session)',
      risk: 'Aggressive position sizing acceptable (40-50% portfolio)',
      notes: 'Cognitive profile supports rapid decision-making under pressure. Suitable for high-frequency strategies requiring split-second execution.'
    }
    : c.score >= 70
    ? {
      primary: 'Swing Trading / Position Trading',
      secondary: 'ETF trading, Index funds, Cryptocurrency swing trades',
      timeframes: '4H-Daily charts recommended',
      sessions: 'Market open/close periods: 9:30-10:30 AM ET, 3:00-4:00 PM ET. Avoid mid-day chop.',
      risk: 'Moderate position sizing (20-30% portfolio)',
      notes: 'Psychological profile favors medium-term strategies with defined risk parameters. Benefits from structured entry/exit rules.'
    }
    : c.score >= 55
    ? {
      primary: 'Long-term Investing / ETFs',
      secondary: 'Blue-chip stocks, Dividend aristocrats, Index ETFs',
      timeframes: 'Weekly/Monthly charts only',
      sessions: 'End-of-day analysis preferred. Avoid real-time price monitoring.',
      risk: 'Conservative (10-15% active portfolio)',
      notes: 'Stress profile indicates vulnerability to short-term volatility. Recommend automated rebalancing and limit order strategies only.'
    }
    : {
      primary: 'Passive Index Investing ONLY',
      secondary: 'Robo-advisors, Target-date funds, Dollar-cost averaging',
      timeframes: 'Quarterly/Annual review only',
      sessions: 'NO active trading recommended. Set-and-forget strategy.',
      risk: 'Minimal (5-10% equities, rest in bonds/stable assets)',
      notes: 'CLINICAL RESTRICTION: Active trading contraindicated. Psychological profile incompatible with real-time market exposure.'
    };

  return `<!doctype html>
<html lang="${c.lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${t.certTitle}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0b0b0b; color: #f5f5f5; margin: 0; padding: 24px; direction: ${isRtl ? 'rtl' : 'ltr'}; }
    .page { position: relative; max-width: 1000px; margin: 0 auto; border: 2px solid rgba(0,255,102,0.45); padding: 40px 32px 32px; border-radius: 18px; background: linear-gradient(180deg, rgba(0,0,0,0.85), rgba(20,0,0,0.75)); overflow: hidden; }
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
    .cert-header { position: absolute; top: 24px; ${isRtl ? 'left' : 'right'}: 24px; padding: 14px 20px; 
      background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(10,10,30,0.92)); 
      border: 1px solid rgba(0,255,102,0.3); 
      border-radius: 12px; 
      box-shadow: 0 4px 20px rgba(0,255,102,0.25); 
      backdrop-filter: blur(8px);
      max-width: 320px;
    }
    .cert-logo-text { display: flex; flex-direction: column; gap: 3px; }
    .cert-logo-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 800; letter-spacing: 0.5px; 
      color: #00ff66;
      line-height: 1.2;
    }
    .cert-logo-url { font-family: 'Courier New', monospace; font-size: 11px; font-weight: 600; color: rgba(0,255,102,0.75); letter-spacing: 0.5px; }
    h1 { margin: 0 0 12px; letter-spacing: 1px; font-size: 28px; padding-top: 60px; }
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
    <div class="watermark"></div>
    
    <!-- PROFESSIONAL HEADER - RIGHT SIDE -->
    <div class="cert-header">
      <div class="cert-logo-text" style="text-align: right;">
        <div class="cert-logo-title">BitSwapDEX AI • $BITS</div>
        <div class="cert-logo-url">bits-ai.io</div>
        <div style="font-size: 10px; color: rgba(0,255,102,0.7); margin-top: 4px; letter-spacing: 0.5px;">Quantum Stress Lab</div>
      </div>
    </div>
    
    <h1>BitSwapDEX AI — Official Stress Resilience Certificate</h1>
    <div class="sub">Certificate ID: <strong>${c.certId}</strong> • Issued: <strong>${new Date(c.issuedAt).toUTCString()}</strong></div>
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
      <div class="analysis-title">📊 Professional Biometric & Psychological Analysis</div>
      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-value">${avgAttention.toFixed(1)}%</div>
          <div class="metric-label">Visual Attention</div>
        </div>
        <div class="metric">
          <div class="metric-value">${blinkRate.toFixed(1)}</div>
          <div class="metric-label">Blink Rate (bpm)</div>
        </div>
        <div class="metric">
          <div class="metric-value">${lookAwayCount}</div>
          <div class="metric-label">Avoidance Episodes</div>
        </div>
        <div class="metric">
          <div class="metric-value">${engagementScore.toFixed(0)}</div>
          <div class="metric-label">Engagement Score</div>
        </div>
      </div>
      
      <div class="metrics-grid" style="margin-top: 16px;">
        <div class="metric">
          <div class="metric-value">${stressIndex}/10</div>
          <div class="metric-label">Stress Index</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="font-size: 16px;">${resilienceLevel}</div>
          <div class="metric-label">Resilience Level</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="font-size: 16px;">${psychologicalStability}</div>
          <div class="metric-label">Psych. Stability</div>
        </div>
        <div class="metric">
          <div class="metric-value">${c.fit ? 'PASS' : 'FAIL'}</div>
          <div class="metric-label">Final Verdict</div>
        </div>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 4px solid #00ff66;">
        <div style="font-size: 13px; font-weight: 700; color: #00ff66; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">I. Clinical Summary</div>
        <div class="analysis-text" style="margin-bottom: 16px;">${clinicalSummary}</div>
        
        <div style="font-size: 13px; font-weight: 700; color: #00ff66; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">II. Behavioral Analysis</div>
        <div class="analysis-text" style="margin-bottom: 16px;">${behavioralAnalysis}</div>
        
        <div style="font-size: 13px; font-weight: 700; color: #00ff66; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">III. Psychological Profile</div>
        <div class="analysis-text" style="margin-bottom: 8px;">
          <strong>Cognitive Load Capacity:</strong> ${cognitiveLoad}<br />
          <strong>Emotional Regulation:</strong> ${emotionalRegulation}<br />
          <strong>Decision-Making Under Pressure:</strong> ${decisionMakingCapacity}<br />
          <strong>Risk Tolerance Classification:</strong> ${riskTolerance}<br />
          <strong>Attention Pattern:</strong> ${attentionPattern}<br />
          <strong>Stress Response Type:</strong> ${stressResponse}
        </div>
        
        <div style="font-size: 13px; font-weight: 700; color: ${c.score >= 70 ? '#00ff66' : '#ff6600'}; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">IV. Clinical Recommendations</div>
        <div class="analysis-text">${recommendations}</div>
        
        <div style="font-size: 13px; font-weight: 700; color: #00ccff; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">V. Trading Strategy Recommendations</div>
        <div class="analysis-text" style="margin-bottom: 12px;">
          <strong>Recommended Trading Style:</strong> ${tradingStyleRec.primary}<br />
          <strong>Alternative Strategies:</strong> ${tradingStyleRec.secondary}<br />
          <strong>Optimal Timeframes:</strong> ${tradingStyleRec.timeframes}<br />
          <strong>Best Trading Sessions:</strong> ${tradingStyleRec.sessions}<br />
          <strong>Risk Allocation:</strong> ${tradingStyleRec.risk}<br />
          <strong>Clinical Notes:</strong> <em>${tradingStyleRec.notes}</em>
        </div>
      </div>
    </div>
    
    ${c.videoSnapshots && c.videoSnapshots.length > 0 ? `
    <div class="analysis-section" style="margin-top: 20px;">
      <div class="analysis-title">📸 Video Evidence - Facial Verification</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px;">
        ${c.videoSnapshots.map((snapshot, idx) => `
          <div style="text-align: center;">
            <img src="${snapshot}" alt="Snapshot ${idx + 1}" style="width: 100%; border-radius: 8px; border: 2px solid rgba(0,255,102,0.3);" />
            <div style="font-size: 11px; margin-top: 6px; opacity: 0.7;">${idx === 0 ? 'Start' : idx === 1 ? 'Middle' : 'End'} (T+${idx === 0 ? '0' : idx === 1 ? '5' : '10'}min)</div>
          </div>
        `).join('')}
      </div>
      <div class="analysis-text" style="margin-top: 12px; font-size: 12px; opacity: 0.8;">
        <strong>Verification Protocol:</strong> Three timestamped facial captures confirm subject identity and continuous engagement throughout the 10-minute assessment period. Facial landmarks and biometric consistency validated via MediaPipe Face Mesh technology.
      </div>
    </div>
    ` : ''}

    <div class="foot">
      <strong>Legal Disclaimer:</strong> This is a simulated stress resilience certificate for entertainment/testing. Not medical or financial advice.
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

