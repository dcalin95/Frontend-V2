import React, { useEffect, useRef, useState } from "react";
import "./TransactionPopup.css";
import avatarGif from "../assets/popup/popup-avatar.gif";
import backgroundGif from "../assets/popup/popupback.gif";
import voiceMp3 from "../assets/popup/popup-sound.mp3";
import successWav from "../assets/sounds/success.mp3";
import { getExplorerLink as getExplorerLinkUtil } from "../utils/getExplorerLink";
import SmartTooltip from "./components/SmartTooltip"; // Import SmartTooltip

const aiIntro = (bits, token, amount) =>
  `Congratulations! You've just bought ${bits} BITS tokens using ${amount} ${token}.`;

const aiDescriptions = [
  "BitSwapDEX AI represents the next evolution of decentralized exchanges, where Artificial Intelligence and Machine Learning redefine trading efficiency, liquidity management, and user experience. By integrating AI-powered tools with the security of Bitcoin and the smart contract capabilities of Stacks, BitSwapDEX AI delivers a secure, intelligent, and scalable platform for decentralized trading.",
  "BitSwapDEX AI introduces a suite of advanced functionalities and groundbreaking innovations designed to address the pressing challenges within the decentralized finance (DeFi) landscape. By integrating Artificial Intelligence, Bitcoin’s security, and the robust capabilities of the Stacks blockchain, BitSwapDEX AI revolutionizes interoperability, scalability, and user experience in a trustless and decentralized environment.",
  "he architecture of BitSwapDEX AI is meticulously crafted to combine the capabilities of Artificial Intelligence (AI) with the unique strengths of the Stacks blockchain and the Bitcoin network. This synergy enables a secure, efficient, and intelligent decentralized finance (DeFi) experience that leverages Bitcoin's unparalleled security while introducing AI-driven functionalities for dynamic optimization and enhanced user interactions.",
  "The roadmap for BitSwapDEX AI outlines a strategic plan for development, innovation, and growth, emphasizing the integration of Artificial Intelligence (AI), robust smart contracts, and Bitcoin-backed security through Stacks blockchain. This phased approach ensures that the platform delivers cutting-edge solutions, while adapting to community needs and technological advancements.",
];

const getExplorerLink = (txHash, token) => {
  if (!txHash) return null;
  try {
    // Presale is mainnet-only
    const chain = 'mainnet';
    // Use appropriate explorer based on token
    if (token === "SOL" || token === "USDC-Solana") {
      return `https://solscan.io/tx/${txHash}`;
    }
    // For other tokens, delegate to util
    return getExplorerLinkUtil(txHash, token || 'BNB', chain);
  } catch (_) {
    // Fallback based on token type
    if (token === "SOL" || token === "USDC-Solana") {
      return `https://solscan.io/tx/${txHash}`;
    }
    return `https://bscscan.com/tx/${txHash}`;
  }
};

const TransactionPopup = ({
  visible,
  txHash,
  token,
  amount,
  bits,
  walletAddress,
  onClose,
  demoMode = false,
}) => {
  const synthRef = useRef(window.speechSynthesis);
  const [spoken, setSpoken] = useState(false);
  const audioRef = useRef(null);
  const [theme, setTheme] = useState("dark");
	const [audioFailed, setAudioFailed] = useState(false);

	useEffect(() => {
    if ((visible || demoMode) && !spoken) {
      const intro = new SpeechSynthesisUtterance(aiIntro(bits, token, amount));
      intro.lang = "en-US";
      intro.rate = 1;
      intro.pitch = 1;
      intro.volume = 1;
      synthRef.current.cancel();
      synthRef.current.speak(intro);
      intro.onend = () => {
        setTimeout(() => {
					// Incearcă redarea, dar nu opri fluxul dacă e blocată de policy
					audioRef.current?.play()?.catch(() => setAudioFailed(true));
        }, 1500);
        setSpoken(true);
      };
    }
  }, [visible, demoMode, spoken, bits, token, amount]);

  const handleLearnMore = () => {
    const text = aiDescriptions[Math.floor(Math.random() * aiDescriptions.length)];
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-US";
    msg.rate = 1;
    msg.pitch = 1;
    msg.volume = 1;
    synthRef.current.speak(msg);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (!visible && !demoMode) return null;

  const explorerLink = getExplorerLink(txHash, token);

  const downloadReceipt = () => {
    try {
      const receipt = {
        title: 'BITS Purchase Receipt',
        txHash,
        token,
        amount,
        bits,
        wallet: walletAddress || 'unknown',
        explorer: explorerLink,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bits-receipt-${txHash?.slice(0,10) || 'tx'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {}
  };

  const printReceipt = () => {
    try {
      const win = window.open('', '_blank');
      if (!win) return;
      const html = `<!doctype html><html><head><title>BITS Receipt</title></head><body style="font-family:Arial;padding:20px;">
        <h2>BITS Purchase Receipt</h2>
        <p><strong>Wallet:</strong> ${walletAddress || 'unknown'}</p>
        <p><strong>Amount:</strong> ${amount} ${token}</p>
        <p><strong>BITS:</strong> ${bits}</p>
        <p><strong>Tx Hash:</strong> ${txHash}</p>
        ${explorerLink ? `<p><a href="${explorerLink}" target="_blank">View on Explorer</a></p>` : ''}
        <p><small>${new Date().toLocaleString()}</small></p>
      </body></html>`;
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch (_) {}
  };

  const emailReceipt = () => {
    try {
      const subject = encodeURIComponent('BITS Purchase Receipt');
      const body = encodeURIComponent([
        'BITS Purchase Receipt',
        `Wallet: ${walletAddress || 'unknown'}`,
        `Amount: ${amount} ${token}`,
        `BITS: ${bits}`,
        `Tx Hash: ${txHash}`,
        explorerLink ? `Explorer: ${explorerLink}` : '',
        `Date: ${new Date().toLocaleString()}`
      ].filter(Boolean).join('\n'));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (_) {}
  };

  return (
    <div className={`popup-overlay ${theme}`}>
      <img src={backgroundGif} className="popup-background" alt="AI Background" />
      <div className="popup-container">
        <div className="popup-eyes">
          <img src={avatarGif} alt="Left Eye" className="popup-eye" />
          <img src={avatarGif} alt="Right Eye" className="popup-eye mirrored" />
        </div>

        <h2 className="popup-title">
          {token === "NOWPAY" ? "💳 Payment Initiated!" : "🎉 Transaction Successful!"}
        </h2>

        <p className="popup-subtitle">
          ✨ Congratulations! You've just bought {bits} BITS
        </p>

        <div className="popup-info-large">
          <SmartTooltip content={`BITS Allocation\nThe total amount of BITS tokens secured for your wallet in this transaction.`}>
          <p className="info-line">
            You bought <span className="glow-amount">{bits} BITS</span>
          </p>
          </SmartTooltip>
          
          <SmartTooltip content={`Payment Details\nThe exact amount and currency spent.`}>
          <p className="info-line">
            Using <span className="glow-amount">{amount} {token}</span>
          </p>
          </SmartTooltip>

          <SmartTooltip content={`Transaction Hash (TX)\nA unique blockchain identifier proving this transaction is immutable and permanent.`}>
          <p className="info-line">
            TX Hash:{" "}
            {txHash ? (
              explorerLink ? (
                <a href={explorerLink} target="_blank" rel="noreferrer">
                  View Transaction
                </a>
              ) : (
                <span>{txHash}</span>
              )
            ) : (
              <span style={{ color: "gray" }}>No transaction hash available.</span>
            )}
          </p>
          </SmartTooltip>
        </div>

        <div className="popup-actions">
          {explorerLink && (
            <SmartTooltip content={`Block Explorer\nVerify this transaction on the public blockchain explorer.`}>
            <a className="btn" href={explorerLink} target="_blank" rel="noreferrer">
              🔗 {token === "SOL" || token === "USDC-Solana" ? "Open on Solscan" : "Open on BscScan"}
            </a>
            </SmartTooltip>
          )}
          <SmartTooltip content={`Save Receipt\nDownload a digital JSON proof of purchase.`}>
            <button className="btn" onClick={downloadReceipt}>💾 Save Receipt</button>
          </SmartTooltip>
          <SmartTooltip content={`Print Receipt\nPrint a physical copy for your records.`}>
            <button className="btn" onClick={printReceipt}>🖨️ Print</button>
          </SmartTooltip>
          <SmartTooltip content={`Email Receipt\nSend this receipt to your email client.`}>
            <button className="btn" onClick={emailReceipt}>✉️ Email Receipt</button>
          </SmartTooltip>
          <SmartTooltip content={`AI Explanation\nListen to an AI-generated overview of the project.`}>
            <button className="btn learn-btn" onClick={handleLearnMore}>
              🔊 Learn More About BITS
            </button>
          </SmartTooltip>
          <button className="btn theme-btn" onClick={toggleTheme}>
            🌓 Switch AI Mode
          </button>
          <button className="btn close-btn" onClick={onClose}>
            ✖ Close
          </button>
			{audioFailed && (
				<button
					className="btn"
					onClick={() => {
						setAudioFailed(false);
						audioRef.current?.play()?.catch(() => setAudioFailed(true));
					}}
				>
					🔈 Enable Sound
				</button>
			)}
        </div>
      </div>
		<audio ref={audioRef} preload="auto">
			<source src={voiceMp3} type="audio/mpeg" />
			<source src="/sounds/click.mp3" type="audio/mpeg" />
			<source src={successWav} type="audio/wav" />
		</audio>
    </div>
  );
};

export default TransactionPopup;
