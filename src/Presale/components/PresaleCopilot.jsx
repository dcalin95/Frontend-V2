import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { switchNetwork as presaleSwitchNetwork } from "../networkSwitcher";
import { BITS_TREASURY_WALLET } from "../../utils/paymentService";
import aiAvatarVideo from "../../assets/BitSwapDEX_AI.mp4";
import { CONTRACT_MAP } from "../../contract/contractMap";
import bitsLogo from "../../assets/logo.png";
import { ethers } from "ethers";
import "./PresaleCopilot.css";

const getExplorerBase = (desiredChainId) => {
  // BSC Mainnet
  if (desiredChainId === 56) return "https://bscscan.com";
  // fallback
  return "https://bscscan.com";
};

const getChainLabel = (cid) => {
  const n = Number(cid);
  if (!Number.isFinite(n) || n <= 0) return null;
  switch (n) {
    case 56:
      return "BSC Mainnet (56)";
    case 1:
      return "Ethereum Mainnet (1)";
    case 11155111:
      return "Sepolia (11155111)";
    case 137:
      return "Polygon (137)";
    default:
      return `Chain ID ${n}`;
  }
};

const isTxHash = (v) => /^0x[a-fA-F0-9]{64}$/.test(String(v || "").trim());
const shortAddr = (addr, left = 6, right = 4) => {
  const s = String(addr || "").trim();
  if (!s) return "—";
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}…${s.slice(-right)}`;
};

const safeJsonParse = (v) => {
  try {
    return JSON.parse(v);
  } catch (_) {
    return null;
  }
};

const readAmountFromDom = () => {
  try {
    const root =
      document.querySelector(".grid-payment") ||
      document.querySelector(".presale-wrapper") ||
      document.body;
    if (!root) return null;

    const candidates = [
      'input[type="number"]',
      'input[inputmode="decimal"]',
      'input[placeholder*="0"]',
    ];

    for (const sel of candidates) {
      const el = root.querySelector(sel);
      if (el && typeof el.value === "string" && el.value.trim()) {
        return el.value.trim();
      }
    }
    return null;
  } catch (_) {
    return null;
  }
};

const PresaleCopilot = ({
  selectedToken,
  selectedChain,
  onScrollToPayment,
  enableBodyClasses = true,
  defaultOpen = true,
  variant = "presale", // "presale" | "global"
}) => {
  const { walletAddress, chainId, connectWallet, walletName, walletType, nativeSymbol, ethBalance } = useWallet();
  const [open, setOpen] = useState(() => !!defaultOpen);
  const [txHash, setTxHash] = useState("");
  const [lastTx, setLastTx] = useState(null);
  const [lastTxStatus, setLastTxStatus] = useState(null); // 'pending' | 'confirmed' | 'failed' | null
  const [faqOpen, setFaqOpen] = useState(false);
  const [txHistoryOpen, setTxHistoryOpen] = useState(false); // 🆕 Pentru istoricul SOL
  const [solTxHistory, setSolTxHistory] = useState([]); // 🆕 Lista TX-urilor SOL
  const [tgInfo, setTgInfo] = useState({ loading: false, eligible: false, reward: 0, timeSpent: 0, messages: 0, error: null });

  // 🎯 Detect if we are actually connected to Solana
  const isActuallySolana = walletType?.toUpperCase() === "SOLANA";

  // Let Presale layout reserve space for the fixed Copilot (no overlap).
  useEffect(() => {
    if (!enableBodyClasses) return undefined;
    const b = document?.body;
    if (!b) return undefined;
    b.classList.add("has-presale-copilot");
    b.classList.toggle("presale-copilot-open", !!open);
    b.classList.toggle("presale-copilot-closed", !open);
    return () => {
      b.classList.remove("has-presale-copilot", "presale-copilot-open", "presale-copilot-closed");
    };
  }, [open, enableBodyClasses]);

  // Presale is MAINNET-only
  const desiredChainId = 56;

  const explorerBase = useMemo(() => getExplorerBase(desiredChainId), [desiredChainId]);
  const bitsTokenAddress = useMemo(() => {
    const a = String(CONTRACT_MAP?.BITS_TOKEN?.address || "").trim();
    return a || null;
  }, []);
  const treasuryWallet = useMemo(() => {
    const w = String(BITS_TREASURY_WALLET || "").trim();
    return w || null;
  }, []);

  const isFiat = useMemo(() => {
    const t = String(selectedToken || "").toUpperCase();
    return selectedChain === "fiat" || ["STRIPE", "MOONPAY", "TRANSAK", "NOWPAY"].includes(t);
  }, [selectedChain, selectedToken]);

  const isSolana = useMemo(() => {
    // If actually connected to Solana, respect that
    if (isActuallySolana) return true;
    const t = String(selectedToken || "").toUpperCase();
    return selectedChain === "solana" || ["SOL", "USDC-SOLANA", "USDT-SOLANA"].includes(t);
  }, [selectedChain, selectedToken, isActuallySolana]);

  const isEvmFlow = selectedChain === "evm" && !isFiat && !isSolana;
  const walletOk = !!walletAddress; // show connected only when we really have an address
  const chainOk = !isEvmFlow || Number(chainId) === desiredChainId || isActuallySolana;
  const connectedNetworkLabel = isActuallySolana ? "Solana Mainnet" : getChainLabel(chainId);
  const desiredNetworkLabel = getChainLabel(desiredChainId);

  const walletLogo = useMemo(() => {
    const n = String(walletName || "").toLowerCase();
    if (!n) return null;
    if (n.includes("metamask")) return "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
    if (n.includes("trust")) return "https://trustwallet.com/assets/images/media/assets/TWT.png";
    if (n.includes("coinbase")) return "https://avatars.githubusercontent.com/u/18060234?s=200&v=4";
    if (n.includes("rainbow")) return "https://avatars.githubusercontent.com/u/48327834?s=200&v=4";
    if (n.includes("walletconnect")) return "https://docs.walletconnect.com/img/walletconnect-logo.png";
    if (n.includes("binance")) return "https://cryptologos.cc/logos/bnb-bnb-logo.png";
    if (n.includes("phantom")) return "https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/phantom.svg";
    return null;
  }, [walletName]);

  const handleSwitch = useCallback(async () => {
    try {
      await presaleSwitchNetwork(String(selectedToken || "").toUpperCase());
    } catch (e) {
      // networkSwitcher already toasts; keep silent here
      console.warn("[PresaleCopilot] switch failed:", e?.message || e);
    }
  }, [selectedToken]);

  const handleOpenTx = useCallback(() => {
    const h = String(txHash || "").trim();
    if (!isTxHash(h)) return;
    window.open(`${explorerBase}/tx/${h}`, "_blank", "noopener,noreferrer");
  }, [txHash, explorerBase]);

  const handleCopy = useCallback(async (text) => {
    const v = String(text || "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
    } catch (e) {
      // best-effort; do not break UI
      console.warn("[PresaleCopilot] copy failed:", e?.message || e);
    }
  }, []);

  const handleOpenTreasury = useCallback(() => {
    if (!treasuryWallet) return;
    window.open(`${explorerBase}/address/${treasuryWallet}`, "_blank", "noopener,noreferrer");
  }, [treasuryWallet, explorerBase]);

  const handleOpenBitsToken = useCallback(() => {
    if (!bitsTokenAddress) return;
    window.open(`${explorerBase}/token/${bitsTokenAddress}`, "_blank", "noopener,noreferrer");
  }, [bitsTokenAddress, explorerBase]);

  const defaultScrollToPayment = useCallback(() => {
    // Desktop grid
    const el =
      document.querySelector(".grid-payment") ||
      document.querySelector(".grid-select") ||
      document.querySelector(".presale-wrapper") ||
      document.querySelector(".mobile-presale-wrapper");
    el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToPayment = onScrollToPayment || defaultScrollToPayment;

  const headerSub = useMemo(() => {
    // Dacă nu e wallet conectat, arată clar
    if (!walletAddress) return "Not connected";
    
    // IF CONNECTED TO SOLANA, SHOW SOLANA INFO
    if (isActuallySolana) return "SOLANA • OK";

    const t = String(selectedToken || "").toUpperCase();
    const c = String(selectedChain || "").trim();
    if (!t && !c) return variant === "global" ? "Open Presale" : "—";
    if (t && c) return `${t} • ${c}`;
    return t || c || "—";
  }, [selectedToken, selectedChain, variant, walletAddress, isActuallySolana]);

  const BACKEND_URL = useMemo(() => {
    return (process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com").toString().replace(/\/+$/, "");
  }, []);

  const loadTelegramInfo = useCallback(async () => {
    if (!walletAddress) {
      setTgInfo({ loading: false, eligible: false, reward: 0, timeSpent: 0, messages: 0, error: null });
      return;
    }
    try {
      setTgInfo((p) => ({ ...p, loading: true, error: null }));
      const res = await fetch(`${BACKEND_URL}/api/telegram-rewards/reward/${walletAddress}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTgInfo({
        loading: false,
        eligible: !!data?.eligible,
        reward: Number(data?.reward || 0) || 0,
        timeSpent: Number(data?.time_spent_hours || 0) || 0,
        messages: Number(data?.messages_total || 0) || 0,
        error: null,
      });
    } catch (e) {
      setTgInfo((p) => ({ ...p, loading: false, error: e?.message || "Failed to load" }));
    }
  }, [walletAddress, BACKEND_URL]);

  // Load last TX from localStorage (set by PaymentBox flow)
  useEffect(() => {
    const loadHistory = async () => {
      // Load EVM last TX from localStorage
      const raw = localStorage.getItem("presale_last_tx");
      const parsed = safeJsonParse(raw);
      if (parsed?.hash && isTxHash(parsed.hash)) {
        setLastTx(parsed);
      } else {
        setLastTx(null);
      }
      
      // 🆕 Load SOL transaction history from BACKEND (not localStorage)
      if (walletAddress) {
        try {
          console.log("🔍 [Copilot] Fetching SOL history from backend for wallet:", walletAddress);
          console.log("🔍 [Copilot] Backend URL:", BACKEND_URL);
          console.log("🔍 [Copilot] Full endpoint:", `${BACKEND_URL}/api/solana/payments/user/${walletAddress}`);
          
          const response = await fetch(`${BACKEND_URL}/api/solana/payments/user/${walletAddress}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          console.log("📊 [Copilot] Response status:", response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log("✅ [Copilot] SOL history from backend:", data);
            
            // Backend returns { ok: true, payments: [...] }
            const payments = Array.isArray(data.payments) ? data.payments : [];
            
            console.log("📋 [Copilot] Payments array:", payments);
            
            // Sort by timestamp, newest first
            const sorted = payments.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            console.log("🔍 [Copilot] Setting solTxHistory state:", sorted.length, "transactions");
            console.log("🔍 [Copilot] First transaction:", sorted[0]);
            setSolTxHistory(sorted);
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.warn("⚠️ [Copilot] Backend returned error:", response.status, errorText);
            setSolTxHistory([]);
          }
        } catch (error) {
          console.error("❌ [Copilot] Failed to fetch SOL history from backend:", error);
          console.error("❌ [Copilot] Error details:", error.message, error.stack);
          setSolTxHistory([]);
        }
      } else {
        console.log("ℹ️ [Copilot] No wallet connected, skipping SOL history fetch");
        setSolTxHistory([]);
      }
    };

    // Load initially
    loadHistory();

    // Listen for SOL payment success events to refresh history
    const handleSolPaymentSuccess = () => {
      console.log("✅ [Copilot] SOL payment success event detected, reloading history");
      loadHistory();
    };

    window.addEventListener('sol-payment-success', handleSolPaymentSuccess);
    
    return () => {
      window.removeEventListener('sol-payment-success', handleSolPaymentSuccess);
    };
  }, [walletAddress, BACKEND_URL]);

  // Load Telegram time/reward for connected wallet (best-effort, backend read)
  useEffect(() => {
    loadTelegramInfo();
    const id = setInterval(loadTelegramInfo, 30000);
    return () => clearInterval(id);
  }, [loadTelegramInfo]);

  // Best-effort status check for last TX (BSC Mainnet public RPC)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!lastTx?.hash || !isTxHash(lastTx.hash)) {
        setLastTxStatus(null);
        return;
      }
      try {
        setLastTxStatus("pending");
        const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
        const receipt = await provider.getTransactionReceipt(lastTx.hash);
        if (cancelled) return;
        if (!receipt) {
          setLastTxStatus("pending");
          return;
        }
        const ok = receipt && (receipt.status === 1 || receipt.status === "0x1");
        setLastTxStatus(ok ? "confirmed" : "failed");
      } catch (_) {
        if (!cancelled) setLastTxStatus(null);
      }
    };
    run();
    const id = setInterval(run, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [lastTx]);

  const handleAddBitsToWallet = useCallback(async () => {
    if (!bitsTokenAddress) {
      console.error('❌ [PresaleCopilot] BITS token address not available');
      return;
    }

    if (!window.ethereum) {
      console.error('❌ [PresaleCopilot] No Ethereum provider found');
      alert('❌ No crypto wallet detected. Please install MetaMask.');
      return;
    }

    try {
      console.log('🔄 [PresaleCopilot] ===== ATTEMPTING TO ADD BITS TOKEN =====');
      
      // 🎯 DETECT MULTIPLE PROVIDERS (MetaMask, Coinbase, Trust, etc.)
      console.log('🔍 [PresaleCopilot] Checking for multiple providers...');
      console.log('🔍 [PresaleCopilot] window.ethereum.providers:', window.ethereum.providers);
      
      let ethereum = window.ethereum;
      
      // 🦊 IF MULTIPLE PROVIDERS, TRY TO FIND METAMASK
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        console.log('🔍 [PresaleCopilot] Multiple providers detected:', window.ethereum.providers.length);
        const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
        if (metamaskProvider) {
          console.log('✅ [PresaleCopilot] Found MetaMask provider in array');
          ethereum = metamaskProvider;
        } else {
          console.log('⚠️ [PresaleCopilot] MetaMask not found in providers array, using default');
        }
      }
      
      const image = (() => {
        try {
          return new URL(bitsLogo, window.location.origin).toString();
        } catch (_) {
          return bitsLogo;
        }
      })();

      console.log('📋 [PresaleCopilot] Token Details:', {
        address: bitsTokenAddress,
        symbol: 'BITS',
        decimals: 18,
        image
      });

      // 🔍 DETECT WALLET TYPE & CAPABILITIES
      const walletType = ethereum.isCoinbaseWallet ? 'Coinbase Wallet' :
                         ethereum.isTrust ? 'Trust Wallet' :
                         ethereum.isMetaMask ? 'MetaMask' :
                         ethereum.isBraveWallet ? 'Brave Wallet' :
                         'Unknown Wallet';
      
      console.log('🔍 [PresaleCopilot] Selected Provider:', walletType);
      console.log('🔍 [PresaleCopilot] Wallet Capabilities:', {
        isMetaMask: ethereum.isMetaMask,
        isCoinbaseWallet: ethereum.isCoinbaseWallet,
        isTrust: ethereum.isTrust,
        isBraveWallet: ethereum.isBraveWallet,
        hasRequest: typeof ethereum.request === 'function'
      });

      // 🔍 CHECK IF wallet_watchAsset IS SUPPORTED
      const supportsRequest = typeof ethereum.request === 'function';
      
      if (!supportsRequest) {
        console.warn('⚠️ [PresaleCopilot] Wallet does not support ethereum.request()');
        
        // 📋 COPY CONTRACT ADDRESS AS FALLBACK
        try {
          await navigator.clipboard.writeText(bitsTokenAddress);
          console.log('📋 [PresaleCopilot] Contract address copied as fallback:', bitsTokenAddress);
          alert(`⚠️ ${walletType} doesn't support automatic token adding.\n\n📋 Contract address copied to clipboard!\n\nPlease add manually:\nAddress: ${bitsTokenAddress}\nSymbol: BITS\nDecimals: 18\nNetwork: BSC (BEP-20)`);
        } catch (clipError) {
          console.error('[PresaleCopilot] Failed to copy to clipboard:', clipError);
          alert(`Please add BITS token manually:\n\nAddress: ${bitsTokenAddress}\nSymbol: BITS\nDecimals: 18\nNetwork: BSC (BEP-20)`);
        }
        return;
      }

      // 🚀 TRY TO ADD TOKEN VIA wallet_watchAsset
      console.log('🚀 [PresaleCopilot] Calling wallet_watchAsset...');
      const wasAdded = await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: bitsTokenAddress,
            symbol: "BITS",
            decimals: 18,
            image,
          },
        },
      });

      console.log('✅ [PresaleCopilot] Token addition result:', wasAdded);

      if (wasAdded) {
        console.log('✅ [PresaleCopilot] User confirmed token addition');
      } else {
        console.log('ℹ️ [PresaleCopilot] User cancelled token addition');
      }
    } catch (error) {
      console.error('❌ [PresaleCopilot] ===== ERROR ADDING BITS TOKEN =====');
      console.error('❌ [PresaleCopilot] Error Object:', error);
      console.error('❌ [PresaleCopilot] Error Code:', error.code);
      console.error('❌ [PresaleCopilot] Error Message:', error.message);
      console.error('❌ [PresaleCopilot] Error Stack:', error.stack);
      
      // 🔍 DETAILED ERROR HANDLING
      if (error.code === 4001) {
        console.log('⚠️ [PresaleCopilot] User rejected the request (code 4001)');
        // User rejected - silent, no alert needed
        
      } else if (error.code === -32002) {
        console.log('⚠️ [PresaleCopilot] Request already pending (code -32002)');
        alert('⚠️ Request already pending. Please check your wallet.');
        
      } else if (error.message && (
        error.message.includes('wallet_watchAsset') || 
        error.message.includes("isn't implemented") ||
        error.message.includes('not supported')
      )) {
        // ⚠️ WALLET DOESN'T SUPPORT wallet_watchAsset
        console.warn('⚠️ [PresaleCopilot] Wallet does not support wallet_watchAsset method');
        
        // 📋 FALLBACK: COPY CONTRACT ADDRESS TO CLIPBOARD
        try {
          await navigator.clipboard.writeText(bitsTokenAddress);
          console.log('📋 [PresaleCopilot] Contract address copied as fallback:', bitsTokenAddress);
          alert(`⚠️ Your wallet doesn't support automatic token adding.\n\n📋 Contract address copied to clipboard!\n\nPlease add manually in your wallet:\n\nAddress: ${bitsTokenAddress}\nSymbol: BITS\nDecimals: 18\nNetwork: BSC (BEP-20)`);
        } catch (clipError) {
          console.error('[PresaleCopilot] Failed to copy to clipboard:', clipError);
          alert(`Please add BITS token manually:\n\nAddress: ${bitsTokenAddress}\nSymbol: BITS\nDecimals: 18\nNetwork: BSC (BEP-20)`);
        }
        
      } else if (error.message && error.message.includes('network')) {
        console.log('⚠️ [PresaleCopilot] Wrong network detected');
        alert('❌ Please switch to BSC Network (Binance Smart Chain) in your wallet.');
        
      } else {
        // GENERIC ERROR
        console.log('❌ [PresaleCopilot] Generic error occurred');
        
        // 📋 FALLBACK: COPY CONTRACT ADDRESS
        try {
          await navigator.clipboard.writeText(bitsTokenAddress);
          console.log('📋 [PresaleCopilot] Fallback: Contract address copied:', bitsTokenAddress);
          alert(`❌ Failed to add BITS token: ${error.message || 'Unknown error'}\n\n📋 Contract address copied to clipboard.\n\nPlease add manually:\nAddress: ${bitsTokenAddress}\nSymbol: BITS\nDecimals: 18`);
        } catch (clipError) {
          console.error('[PresaleCopilot] Failed to copy to clipboard:', clipError);
        }
      }
      
      console.log('🔄 [PresaleCopilot] ===== END ERROR HANDLING =====');
    }
  }, [bitsTokenAddress]);

  const handleGoDex = useCallback(() => {
    try {
      window.location.hash = "#/dex";
    } catch (_) {}
  }, []);

  const handleGoRewardsHub = useCallback(() => {
    try {
      window.location.hash = "#/rewards-hub";
    } catch (_) {}
  }, []);

  const handleCopyAmount = useCallback(async () => {
    const amount = readAmountFromDom();
    const token = String(selectedToken || "").toUpperCase();
    const chain = String(selectedChain || "");
    const text = amount
      ? `Presale amount: ${amount} (${token}, ${chain})`
      : `Presale amount: (not detected) (${token}, ${chain})`;
    await navigator.clipboard.writeText(text);
  }, [selectedToken, selectedChain]);

  const handleCopyDebug = useCallback(async () => {
    const lines = [
      "BitSwapDEX Presale Debug",
      `page: ${window.location.href}`,
      `wallet: ${walletAddress || "—"}`,
      `chainId: ${chainId || "—"}`,
      `selected: ${String(selectedToken || "").toUpperCase()} • ${selectedChain}`,
      `BITS token: ${bitsTokenAddress || "—"}`,
      `treasury: ${treasuryWallet || "—"}`,
      `lastTx: ${lastTx?.hash || "—"} (${lastTxStatus || "unknown"})`,
      `time: ${new Date().toISOString()}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch (_) {}
  }, [walletAddress, chainId, selectedToken, selectedChain, bitsTokenAddress, treasuryWallet, lastTx, lastTxStatus]);

  return (
    <aside className={`presale-copilot ${open ? "is-open" : "is-closed"}`} aria-label="Presale Copilot">
      {!open ? (
        <button
          type="button"
          className="presale-copilot__mini"
          onClick={() => {
            // Global/minimized: clicking the badge should take user straight to Presale.
            if (!enableBodyClasses && variant === "global") {
              try {
                scrollToPayment();
              } catch (_) {}
              return;
            }
            setOpen(true);
          }}
          aria-label={(!enableBodyClasses && variant === "global") ? "Open Presale" : "Open Presale Copilot"}
          title={(!enableBodyClasses && variant === "global") ? "Open Presale" : "Open Presale Copilot"}
        >
          <span className="presale-copilot__miniBadge" aria-hidden>
            <video
              className="presale-copilot__avatar"
              src={aiAvatarVideo}
              autoPlay
              loop
              muted
              playsInline
            />
          </span>
          <span className="presale-copilot__miniText">
            {variant === "global" ? "Presale" : "Copilot"}
          </span>
        </button>
      ) : (
        <>
          <div className="presale-copilot__header">
            <div className="presale-copilot__title">
              <div className="presale-copilot__badge" aria-hidden>
                <video
                  className="presale-copilot__avatar"
                  src={aiAvatarVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <div>
                <div className="presale-copilot__name">Presale Copilot</div>
                <div className="presale-copilot__sub">
                  {headerSub}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="presale-copilot__toggle"
              onClick={() => setOpen(false)}
              aria-expanded={open}
            >
              Minimize
            </button>
          </div>

        <div className="presale-copilot__body">
          <div className="presale-copilot__checks">
            <div className={`pc-check ${walletOk ? "ok" : "bad"}`}>
              <span className="pc-dot" />
              <span className="pc-label">
                Wallet:{" "}
                {walletOk ? (
                  <>
                    ready
                    {walletAddress ? (
                      <>
                        {" "}
                        •{" "}
                        {walletLogo ? (
                          <img className="pc-wallet-icon" src={walletLogo} alt="" aria-hidden />
                        ) : null}
                        <span className="pc-value">{walletName || "Wallet"}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  "connect required"
                )}
              </span>
            </div>
            <div className={`pc-check ${chainOk ? "ok" : "bad"}`}>
              <span className="pc-dot" />
              <span className="pc-label">
                Network:{" "}
                {isSolana ? (
                  // 🟣 SOLANA: No network check needed
                  "Solana • OK"
                ) : connectedNetworkLabel ? (
                  <>
                    connected to <strong>{connectedNetworkLabel}</strong>
                    {chainOk ? (
                      <> • OK</>
                    ) : (
                      <>
                        {" "}
                        → switch to <strong>{desiredNetworkLabel || `BSC (chainId ${desiredChainId})`}</strong>
                      </>
                    )}
                  </>
                ) : chainOk ? (
                  "OK"
                ) : (
                  <>switch to <strong>{desiredNetworkLabel || `BSC (chainId ${desiredChainId})`}</strong></>
                )}
              </span>
            </div>
            
            {/* 💰 New Balance Line in Copilot */}
            {walletAddress && (
              <div className="pc-check ok">
                <span className="pc-dot" />
                <span className="pc-label">
                  Balance: <strong>{ethBalance || "0.0000"} {nativeSymbol}</strong>
                </span>
              </div>
            )}

            <div className="pc-check ok">
              <span className="pc-dot" />
              <span className="pc-label">Payment: choose amount and confirm</span>
            </div>
          </div>

          <div className="presale-copilot__actions">
            {!walletOk && (
              <button type="button" className="pc-btn primary" onClick={() => {
                // Deschide modalul de wallet (generic)
                if (typeof window !== 'undefined' && window.openUnifiedWalletModal) {
                  window.openUnifiedWalletModal();
                } else {
                  connectWallet();
                }
              }}>
                Connect Wallet
              </button>
            )}
            {walletOk && (
              <button type="button" className="pc-btn" onClick={() => {
                if (typeof window !== 'undefined' && window.disconnectWallet) {
                  window.disconnectWallet();
                } else {
                  // fallback
                  connectWallet(); // va redeschide și poți deconecta din modal
                }
              }}>
                Disconnect Wallet
              </button>
            )}
            {!chainOk && !isSolana && (
              <button type="button" className="pc-btn" onClick={handleSwitch}>
                Switch Network
              </button>
            )}
            <button type="button" className="pc-btn ghost" onClick={scrollToPayment}>
              {enableBodyClasses ? "Go to payment box" : "Open Presale"}
            </button>

            <div className="pc-actions-row">
              <button type="button" className="pc-btn pc-btn--tg" onClick={handleAddBitsToWallet} disabled={!bitsTokenAddress || !window?.ethereum?.request}>
                Add $BITS to wallet
              </button>
              <button type="button" className="pc-btn pc-btn--copy" onClick={handleCopyDebug}>
                Copy debug
              </button>
            </div>

            <div className="pc-actions-row">
              <button type="button" className="pc-btn pc-btn--open" onClick={handleGoDex}>
                Go to DEX Swap
              </button>
              <button type="button" className="pc-btn" onClick={handleCopyAmount}>
                Copy amount
              </button>
            </div>
          </div>

          <div className="presale-copilot__divider" />

          {lastTx?.hash && (
            <div className="presale-copilot__lasttx">
              <div className="pc-tx__title">Last transaction</div>
              <div className="pc-lasttx__row">
                <div className="pc-lasttx__left">
                  <div className="pc-lasttx__hash mono" title={lastTx.hash}>
                    {shortAddr(lastTx.hash, 10, 10)}
                  </div>
                  <div className={`pc-lasttx__status ${lastTxStatus || "unknown"}`}>
                    {lastTxStatus === "confirmed" && "Confirmed"}
                    {lastTxStatus === "failed" && "Failed"}
                    {lastTxStatus === "pending" && "Pending"}
                    {!lastTxStatus && "Unknown"}
                  </div>
                </div>
                <button type="button" className="pc-btn pc-btn--open" onClick={() => window.open(`${explorerBase}/tx/${lastTx.hash}`, "_blank", "noopener,noreferrer")}>
                  Open
                </button>
              </div>
            </div>
          )}

          {lastTx?.hash && <div className="presale-copilot__divider" />}

          {/* 🆕 SOL Transaction History Button */}
          {solTxHistory.length > 0 ? (
            <>
              <div className="presale-copilot__sol-history-btn">
                <button 
                  type="button" 
                  className="pc-btn primary" 
                  onClick={() => setTxHistoryOpen(true)}
                >
                  📜 View SOL History ({solTxHistory.length})
                </button>
              </div>
              <div className="presale-copilot__divider" />
            </>
          ) : (
            walletAddress && (
              <>
                <div className="presale-copilot__sol-history-btn">
                  <div style={{ padding: '10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
                    📊 No SOL transactions yet for this wallet
                  </div>
                  <button 
                    type="button" 
                    className="pc-btn ghost" 
                    onClick={async () => {
                      console.log("🔍 [DEBUG] Checking SOL history for:", walletAddress);
                      console.log("🔍 [DEBUG] Backend URL:", BACKEND_URL);
                      console.log("🔍 [DEBUG] Full endpoint:", `${BACKEND_URL}/api/solana/payments/user/${walletAddress}`);
                      console.log("🔍 [DEBUG] Current solTxHistory state:", solTxHistory);
                      
                      // Try to fetch again
                      try {
                        const response = await fetch(`${BACKEND_URL}/api/solana/payments/user/${walletAddress}`, {
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await response.json();
                        console.log("🔍 [DEBUG] Backend response:", data);
                        console.log("🔍 [DEBUG] Response status:", response.status);
                        console.log("🔍 [DEBUG] Response ok:", response.ok);
                      } catch (e) {
                        console.error("❌ [DEBUG] Fetch error:", e);
                      }
                    }}
                  >
                    🔍 Debug SOL History
                  </button>
                </div>
                <div className="presale-copilot__divider" />
              </>
            )
          )}

          <div className="presale-copilot__trust">
            <div className="pc-trust__title">
              <img className="pc-token-icon" src={bitsLogo} alt="" aria-hidden />
              $BITS essentials
            </div>

            <div className="pc-trust__k">
              <img className="pc-token-icon pc-token-icon--inline" src={bitsLogo} alt="" aria-hidden />
              BITS token contract
            </div>
            <div className="pc-trust__row">
              <div className="pc-trust__addr mono" title={bitsTokenAddress || ""}>
                {shortAddr(bitsTokenAddress)}
              </div>
              <div className="pc-trust__btns">
                <button
                  type="button"
                  className="pc-btn pc-btn--copy"
                  onClick={() => handleCopy(bitsTokenAddress)}
                  disabled={!bitsTokenAddress}
                  title="Copy BITS token contract"
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="pc-btn pc-btn--open"
                  onClick={handleOpenBitsToken}
                  disabled={!bitsTokenAddress}
                  title="Open BITS token on explorer"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="pc-trust__k">Treasury wallet</div>
            <div className="pc-trust__row">
              <div className="pc-trust__addr mono" title={treasuryWallet || ""}>
                {shortAddr(treasuryWallet)}
              </div>
              <div className="pc-trust__btns">
                <button
                  type="button"
                  className="pc-btn pc-btn--copy"
                  onClick={() => handleCopy(treasuryWallet)}
                  disabled={!treasuryWallet}
                  title="Copy treasury address"
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="pc-btn pc-btn--open"
                  onClick={handleOpenTreasury}
                  disabled={!treasuryWallet}
                  title="Open treasury on explorer"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="pc-trust__cta">
              <a
                className="pc-btn pc-btn--tg"
                href="https://t.me/BitSwapDEX_AI"
                target="_blank"
                rel="noopener noreferrer"
                title="Join the official Telegram community"
              >
                Join Telegram
              </a>
            </div>
          </div>

          <div className="presale-copilot__divider" />

          <div className="presale-copilot__telegram">
            <div className="pc-tx__title">Telegram activity (connected wallet)</div>
            {!walletAddress ? (
              <div className="pc-tx__hint">Connect a wallet to see your Telegram time & rewards.</div>
            ) : (
              <div className="pc-tele__grid">
                <div className="pc-tele__stat">
                  <div className="pc-tele__k">Time in group</div>
                  <div className="pc-tele__v">{tgInfo.timeSpent.toFixed(1)}h</div>
                </div>
                <div className="pc-tele__stat">
                  <div className="pc-tele__k">Messages</div>
                  <div className="pc-tele__v">{tgInfo.messages}</div>
                </div>
                <div className="pc-tele__stat">
                  <div className="pc-tele__k">Pending reward</div>
                  <div className="pc-tele__v">{tgInfo.eligible ? `${tgInfo.reward} $BITS` : "—"}</div>
                </div>

                <div className="pc-tele__actions">
                  <button type="button" className="pc-btn pc-btn--copy" onClick={loadTelegramInfo} disabled={!walletAddress || tgInfo.loading}>
                    {tgInfo.loading ? "Refreshing..." : "Refresh"}
                  </button>
                  <button type="button" className="pc-btn pc-btn--open" onClick={handleGoRewardsHub}>
                    Open Rewards Hub
                  </button>
                </div>

                {tgInfo.error && <div className="pc-tx__hint">Telegram info unavailable: {tgInfo.error}</div>}
              </div>
            )}
          </div>

          <div className="presale-copilot__divider" />

          <div className="presale-copilot__tx">
            <div className="pc-tx__title">Verify a transaction</div>
            <div className="pc-tx__row">
              <input
                className="pc-tx__input mono"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste tx hash (0x...)"
              />
              <button type="button" className="pc-btn" onClick={handleOpenTx} disabled={!isTxHash(txHash)}>
                Open
              </button>
            </div>
            <div className="pc-tx__hint">
              Explorer: <span className="mono">{explorerBase.replace("https://", "")}</span>
            </div>
          </div>

          <div className="presale-copilot__divider" />

          <div className="presale-copilot__faq">
            <button type="button" className="pc-faq__toggle" onClick={() => setFaqOpen(v => !v)}>
              {faqOpen ? "Hide FAQ" : "Show FAQ"}
            </button>
            {faqOpen && (
              <div className="pc-faq__body">
                <div className="pc-faq__q">Why do I need to switch network?</div>
                <div className="pc-faq__a">Presale runs on BSC Mainnet. Your wallet must be on chainId 56 to sign transactions.</div>
                <div className="pc-faq__q">When do I receive $BITS?</div>
                <div className="pc-faq__a">After your transaction is confirmed on-chain. Use “Last transaction” or paste the tx hash above to verify.</div>
                <div className="pc-faq__q">Need help fast?</div>
                <div className="pc-faq__a">Tap “Copy debug” and paste it in Telegram for instant troubleshooting.</div>
              </div>
            )}
          </div>
        </div>
        </>
      )}
      
      {/* 🆕 SOL Transaction History Modal - SIMPLIFIED */}
      {txHistoryOpen && (
        <>
          {/* HISTORY SIDE PANEL */}
          <div 
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              width: '420px',
              maxHeight: 'calc(100vh - 40px)',
              background: 'rgba(10, 12, 16, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '3px solid #14f195',
              borderRadius: '20px',
              boxShadow: '0 0 60px rgba(20, 241, 149, 0.5), inset 0 0 40px rgba(20, 241, 149, 0.1)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            {/* HEADER */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(20, 241, 149, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(20, 241, 149, 0.05)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#14f195', fontWeight: '700' }}>
                📜 SOL History
              </h3>
              <button
                type="button"
                onClick={() => setTxHistoryOpen(false)}
                style={{
                  background: 'rgba(255, 68, 68, 0.15)',
                  border: '2px solid rgba(255, 68, 68, 0.5)',
                  borderRadius: '50%',
                  color: '#ff4444',
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 68, 68, 0.3)';
                  e.target.style.transform = 'rotate(90deg) scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 68, 68, 0.15)';
                  e.target.style.transform = 'rotate(0deg) scale(1)';
                }}
              >
                ✕
              </button>
            </div>
              
              {/* BODY */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
              }}>
                {solTxHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <p>No SOL transactions yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {solTxHistory.map((tx, idx) => (
                      <div key={tx.tx_signature || tx.signature || idx} style={{
                        background: 'rgba(20, 241, 149, 0.05)',
                        border: '1px solid rgba(20, 241, 149, 0.15)',
                        borderRadius: '12px',
                        padding: '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(20, 241, 149, 0.1)'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {new Date(tx.created_at || tx.timestamp).toLocaleString()}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            color: '#14f195',
                            background: 'rgba(20, 241, 149, 0.15)'
                          }}>
                            {tx.fulfilment_status === 'fulfilled' ? 'Confirmed' : tx.fulfilment_status || tx.status || 'Pending'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Amount:</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>{tx.amount_sol || tx.amount || 0} SOL</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>USD Value:</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>${(tx.usd_invested || tx.usdInvested || 0).toFixed(2)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>BITS:</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>{(tx.bits_to_receive || tx.bits_received || 0).toLocaleString()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Signature:</span>
                          <span style={{ 
                            color: '#14f195', 
                            fontFamily: 'monospace', 
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '200px'
                          }}>
                            {(tx.tx_signature || tx.signature || '—').slice(0, 8)}...{(tx.tx_signature || tx.signature || '—').slice(-8)}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(20, 241, 149, 0.1)' }}>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              background: 'rgba(20, 241, 149, 0.1)',
                              border: '1px solid rgba(20, 241, 149, 0.3)',
                              borderRadius: '8px',
                              color: '#14f195',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => navigator.clipboard.writeText(tx.tx_signature || tx.signature)}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              background: 'rgba(20, 241, 149, 0.1)',
                              border: '1px solid rgba(20, 241, 149, 0.3)',
                              borderRadius: '8px',
                              color: '#14f195',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => window.open(`https://solscan.io/tx/${tx.tx_signature || tx.signature}`, "_blank", "noopener,noreferrer")}
                          >
                            🔍 Solscan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    );
};

export default PresaleCopilot;


