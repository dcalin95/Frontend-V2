import React, { useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import { aprPercentDisplayFrom1e18 } from "../utils/aprFormat";
import { getStakingContract } from "../../contract/getStakingContract";
import { getContractInstance } from "../../contract/getContract";
import { getRobustProvider } from "../../utils/rpcFallback";
import WalletContext from "../../context/WalletContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/StakeForm.css";
import "../styles/StakeForm.mobile.css"; // 🆕 Import Mobile CSS
import useBitsPrice from "../../Presale/prices/useBitsPrice";
import successSfx from "../../assets/sounds/success.mp3";
import { notifyStakingDeposit } from "../../utils/telegramNotify";

// Static data for tiers and lock periods (module-scope to keep hooks stable)
const TIERS = [
  { name: "Bronze", min: 1, max: 1000, bonus: 0, color: "#CD7F32", icon: "🥉" },
  { name: "Silver", min: 1001, max: 5000, bonus: 2, color: "#C0C0C0", icon: "🥈" },
  { name: "Gold", min: 5001, max: 10000, bonus: 5, color: "#FFD700", icon: "🥇" },
  { name: "Platinum", min: 10001, max: Infinity, bonus: 10, color: "#E5E4E2", icon: "💎" }
];

const LOCK_PERIODS = [
  { name: "Flexible", days: 0, bonus: 0, color: "#00ff88", icon: "🔓" },
  { name: "30 Days", days: 30, bonus: 10, color: "#00aaff", icon: "📅" },
  { name: "90 Days", days: 90, bonus: 25, color: "#ff6b00", icon: "🗓️" },
  { name: "180 Days", days: 180, bonus: 50, color: "#ff00aa", icon: "📆" },
  { name: "365 Days", days: 365, bonus: 100, color: "#aa00ff", icon: "🔒" }
];

// Popular networks registry (mainnets first, include icon and testnet flag)
const SUPPORTED_NETWORKS = {
  1:      { icon: '⬡',   testnet: false, chainId: '0x1',       chainName: 'Ethereum',            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.ankr.com/eth'], blockExplorerUrls: ['https://etherscan.io'] },
  56:     { icon: '🟡',   testnet: false, chainId: '0x38',      chainName: 'BSC Mainnet',         nativeCurrency: { name: 'Binance', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] },
  137:    { icon: '🟣',   testnet: false, chainId: '0x89',      chainName: 'Polygon',             nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] },
  10:     { icon: '🟥',   testnet: false, chainId: '0xa',       chainName: 'Optimism',            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.optimism.io'], blockExplorerUrls: ['https://optimistic.etherscan.io'] },
  42161:  { icon: '🛡️',  testnet: false, chainId: '0xa4b1',   chainName: 'Arbitrum One',        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] },
  43114:  { icon: '🔺',   testnet: false, chainId: '0xa86a',   chainName: 'Avalanche C-Chain',   nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'], blockExplorerUrls: ['https://snowtrace.io'] },
  8453:   { icon: '🟦',   testnet: false, chainId: '0x2105',   chainName: 'Base',                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] },
  250:    { icon: '👻',   testnet: false, chainId: '0xfa',     chainName: 'Fantom Opera',        nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 }, rpcUrls: ['https://rpcapi.fantom.network'], blockExplorerUrls: ['https://ftmscan.com'] },
  324:    { icon: '🧊',   testnet: false, chainId: '0x144',    chainName: 'zkSync Era',          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.era.zksync.io'], blockExplorerUrls: ['https://explorer.zksync.io'] },
  59144:  { icon: '🟦',   testnet: false, chainId: '0xe708',   chainName: 'Linea',               nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.linea.build'], blockExplorerUrls: ['https://lineascan.build'] },
  534352: { icon: '🟨',   testnet: false, chainId: '0x82aef',  chainName: 'Scroll',              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.scroll.io'], blockExplorerUrls: ['https://scrollscan.com'] },
  100:    { icon: '🟢',   testnet: false, chainId: '0x64',     chainName: 'Gnosis',              nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 }, rpcUrls: ['https://rpc.gnosischain.com'], blockExplorerUrls: ['https://gnosisscan.io'] },
  42220:  { icon: '🟡',   testnet: false, chainId: '0xa4ec',   chainName: 'Celo',                nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }, rpcUrls: ['https://forno.celo.org'], blockExplorerUrls: ['https://celoscan.io'] },
  25:     { icon: '🟦',   testnet: false, chainId: '0x19',     chainName: 'Cronos',              nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 }, rpcUrls: ['https://evm.cronos.org'], blockExplorerUrls: ['https://cronoscan.com'] },
  1284:   { icon: '🌙',   testnet: false, chainId: '0x504',    chainName: 'Moonbeam',            nativeCurrency: { name: 'GLMR', symbol: 'GLMR', decimals: 18 }, rpcUrls: ['https://rpc.api.moonbeam.network'], blockExplorerUrls: ['https://moonscan.io'] },
  1101:   { icon: '🟣',   testnet: false, chainId: '0x44d',    chainName: 'Polygon zkEVM',       nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://zkevm-rpc.com'], blockExplorerUrls: ['https://zkevm.polygonscan.com'] },
  5000:   { icon: '🟧',   testnet: false, chainId: '0x1388',   chainName: 'Mantle',              nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 }, rpcUrls: ['https://rpc.mantle.xyz'], blockExplorerUrls: ['https://mantlescan.xyz'] },
  204:    { icon: '🟡',   testnet: false, chainId: '0xcc',     chainName: 'opBNB',               nativeCurrency: { name: 'Binance', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'], blockExplorerUrls: ['https://opbnbscan.com'] },
  // Testnets
  97:     { icon: '🟡',   testnet: true,  chainId: '0x61',     chainName: 'BSC Testnet',         nativeCurrency: { name: 'Binance Testnet', symbol: 'tBNB', decimals: 18 }, rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'], blockExplorerUrls: ['https://testnet.bscscan.com'] },
  11155111:{ icon: '⬡',  testnet: true,  chainId: '0xaa36a7', chainName: 'Sepolia',             nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.sepolia.org'], blockExplorerUrls: ['https://sepolia.etherscan.io'] },
  80002:  { icon: '🟣',   testnet: true,  chainId: '0x13882',  chainName: 'Polygon Amoy',        nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://rpc-amoy.polygon.technology'], blockExplorerUrls: ['https://www.oklink.com/amoy'] },
  5611:   { icon: '🟡',   testnet: true,  chainId: '0x15eb',   chainName: 'opBNB Testnet',       nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 }, rpcUrls: ['https://opbnb-testnet-rpc.bnbchain.org'], blockExplorerUrls: ['https://testnet.opbnbscan.com'] }
};

const getNetworkLabelByChainId = (chainId) => {
  const n = SUPPORTED_NETWORKS[Number(chainId)];
  if (n) return { name: n.chainName, nativeSymbol: n.nativeCurrency.symbol };
  switch (Number(chainId)) {
    case 56: return { name: "BSC Mainnet", nativeSymbol: "BNB" };
    case 97: return { name: "BSC Testnet", nativeSymbol: "tBNB" };
    default: return { name: `Chain ${chainId}`, nativeSymbol: "NATIVE" };
  }
};

const getAddChainParams = (chainId) => (SUPPORTED_NETWORKS[Number(chainId)] || null);

const getNetworkChipStyle = (chainId) => {
  const id = Number(chainId);
  if (id === 97) return { bg: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.5)', color: '#00ff88' };
  if (id === 56) return { bg: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.5)', color: '#ffd700' };
  if (id === 1) return { bg: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.5)', color: '#b388ff' };
  return { bg: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' };
};

const StakeForm = ({ signer, prefilledAmount, rewardsSource }) => {
  const { walletAddress } = useContext(WalletContext);
  const { bitsPrice } = useBitsPrice(walletAddress);
  const bitsPriceNum = parseFloat(bitsPrice || '0');

  // Basic states
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [apr, setApr] = useState("0");
  const [estimatedReward, setEstimatedReward] = useState("0");
  const [loading, setLoading] = useState(false);
  const [stakeStep, setStakeStep] = useState('idle'); // idle | approve_request | approve_pending | stake_request | stake_pending | done | error
  const [showAprInfo, setShowAprInfo] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ name: null, chainId: null, nativeSymbol: "NATIVE" });
  const [isSwitchingNet, setIsSwitchingNet] = useState(false);
  // Default to BSC mainnet; if user is on another chain, effect below will sync to current chainId.
  const [targetChainId, setTargetChainId] = useState(56);

  // Advanced staking states
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(0);
  const [autoCompound, setAutoCompound] = useState(false);
  const [compoundMode, setCompoundMode] = useState("ai");
  const [showCompoundInfo, setShowCompoundInfo] = useState(false);
  const [showApyModal, setShowApyModal] = useState(false);
  const [currentTier, setCurrentTier] = useState({ name: "Bronze", bonus: 0, min: 1, max: 1000, color: "#CD7F32", icon: "🥉" });

  // --- Derived APR/APY helpers ---
  let aprPctNum = 0; // percent (e.g., 100 => 100%)
  let aprDec = 0;    // decimal (e.g., 1.0 => 100%)
  try {
    aprPctNum = parseFloat(ethers.utils.formatUnits(apr, 16));
    if (!isFinite(aprPctNum)) aprPctNum = 0;
    aprDec = aprPctNum / 100;
  } catch (_) {
    aprPctNum = 0; aprDec = 0;
  }
  const apy = (n) => (Math.pow(1 + (aprDec / (n || 1)), n || 1) - 1) * 100; // returns percent
  const apyDaily = apy(365);
  const apyWeekly = apy(52);
  const apyMonthly = apy(12);
  const aiApyMin = apyWeekly; // AI expected range lower bound
  const aiApyMax = apyDaily;  // AI expected range upper bound

  const getDaysByMode = (mode) => {
    switch (mode) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'ai':
      default:
        return 3; // AI: aproximativ 2-3 zile între reinvestiri
    }
  };
  const getLabelByMode = (mode) => {
    switch (mode) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'ai':
      default:
        return 'AI (≈3 days)';
    }
  };
  const formatBitsEstimate = (raw) => {
    const n = parseFloat(raw || '0');
    if (!isFinite(n) || n <= 0) return '0';
    if (n >= 1) return Math.floor(n).toLocaleString();
    return n.toFixed(4).replace(/\.0+$/, '');
  };

  // (removed unused formatCompact helper to satisfy eslint)
  const formatUsd = (n) => {
    const v = parseFloat(n || '0');
    if (!isFinite(v) || v <= 0) return '$0.00';
    if (v < 0.01) return `$${v.toFixed(6)}`; // show tiny values with more precision
    return `$${v.toFixed(2)}`;
  };

  const [aprContext, setAprContext] = useState({ base: 0, tier: 0, lock: 0, final: 0 });
  const [unstakeFeePct, setUnstakeFeePct] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Inline SVG icons per chain (minimal, crisp)
  const ChainIcon = ({ chainId, size = 14 }) => {
    const id = Number(chainId);
    const common = { width: size, height: size, viewBox: "0 0 24 24", style: { display: 'inline-block' } };
    if (id === 56 || id === 97 || id === 204 || id === 5611) {
      // BNB diamond
      return (
        <svg {...common} aria-hidden="true">
          <g fill="#f0b90b">
            <path d="M12 2 7 7l5 5 5-5-5-5z"/>
            <path d="M12 12 7 7l-2 2 7 7 7-7-2-2-5 5z"/>
          </g>
        </svg>
      );
    }
    if (id === 1 || id === 11155111) {
      // ETH hexagon
      return (
        <svg {...common} aria-hidden="true">
          <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#627EEA"/>
          <polygon points="12,4 18,8 12,12 6,8" fill="#8BA3FF"/>
        </svg>
      );
    }
    if (id === 137 || id === 80002 || id === 1101) {
      // Polygon
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 8l4-2 4 2v4l-4 2-4-2V8z" fill="#8247e5"/>
          <circle cx="6" cy="10" r="1.6" fill="#c3a2ff"/>
          <circle cx="18" cy="10" r="1.6" fill="#c3a2ff"/>
        </svg>
      );
    }
    if (id === 42161) {
      // Arbitrum
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="3" fill="#2d374b"/>
          <path d="M6 16l4-8h2l-4 8h-2zm5 0l4-8h2l-4 8h-2z" fill="#60a5fa"/>
        </svg>
      );
    }
    if (id === 43114) {
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l9 18H3L12 3z" fill="#e84142"/>
        </svg>
      );
    }
    if (id === 8453) {
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#0052ff"/>
          <circle cx="12" cy="12" r="5" fill="#ffffff"/>
        </svg>
      );
    }
    if (id === 324) {
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="3" fill="#4fd1c5"/>
          <path d="M8 10h8M8 14h6" stroke="#053b3d" strokeWidth="2"/>
        </svg>
      );
    }
    if (id === 59144) {
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#2bb0ed"/>
          <path d="M7 12h10" stroke="#003049" strokeWidth="2"/>
        </svg>
      );
    }
    // Default globe
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="#9ca3af"/>
        <path d="M3 12h18M12 3v18" stroke="#111827" strokeWidth="1.5"/>
      </svg>
    );
  };

  // (moved TIERS/LOCK_PERIODS/SUPPORTED_NETWORKS + helpers to module scope to satisfy hooks lint)

  const switchNetwork = async (target) => {
    try {
      // IMPORTANT: do NOT use window.ethereum directly (can be Phantom or another injected provider).
      // Prefer the EIP-1193 provider backing the currently connected ethers signer (MetaMask/Trust/etc).
      const pickEip1193 = () => {
        const p = signer?.provider?.provider;
        if (p && typeof p.request === "function") return p;
        const eth = window?.ethereum;
        const list = Array.isArray(eth?.providers) ? eth.providers : [];
        const prefer = (pred) => list.find((x) => x && typeof x.request === "function" && pred(x));
        return (
          prefer((x) => x.isMetaMask) ||
          prefer((x) => x.isTrust) ||
          prefer((x) => x.isCoinbaseWallet) ||
          list.find((x) => x && typeof x.request === "function" && !x.isPhantom) ||
          (eth && typeof eth.request === "function" ? eth : null)
        );
      };

      const eip1193 = pickEip1193();
      if (!eip1193) {
        toast.error('No EVM wallet provider detected for network switch (MetaMask/Trust).');
        return;
      }

      const targetId = Number(target) || 97;
      // Guard: if already on target chain, don't trigger wallet popup
      try {
        const curHex = await eip1193.request({ method: "eth_chainId", params: [] });
        const curId = typeof curHex === "string" ? parseInt(curHex, 16) : Number(curHex);
        if (Number.isFinite(curId) && curId === targetId) {
          toast.info("Already on selected network.");
          return;
        }
      } catch (_) {}
      setIsSwitchingNet(true);
      toast.info('Requesting network switch...');
      const hexId = '0x' + targetId.toString(16);
      await eip1193.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
      toast.success('Network switched successfully');
    } catch (err) {
      if (err?.code === 4001) {
        toast.warn('User rejected network switch');
      } else if (err?.code === 4902) {
        const params = getAddChainParams(Number(target));
        if (params) {
          try {
            const eip1193 = (signer?.provider?.provider && typeof signer.provider.provider.request === "function")
              ? signer.provider.provider
              : window?.ethereum;
            if (!eip1193?.request) throw new Error("No EVM wallet provider available");
            await eip1193.request({ method: 'wallet_addEthereumChain', params: [params] });
            const hexId = '0x' + Number(target).toString(16);
            await eip1193.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
            toast.success('Network added and switched');
          } catch (e2) {
            toast.error('Failed to add network: ' + (e2?.message || 'Unknown error'));
          }
        } else {
          toast.error('Network parameters not known in app.');
        }
      } else {
        console.warn('Switch network failed:', err?.message);
        toast.error('Switch network failed: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      setIsSwitchingNet(false);
    }
  };

  // Keep targetChainId synced with current network
  useEffect(() => {
    if (networkInfo?.chainId) setTargetChainId(networkInfo.chainId);
  }, [networkInfo?.chainId]);

  // ✅ Set prefilled amount from rewards
  useEffect(() => {
    if (prefilledAmount && prefilledAmount > 0) {
      setAmount(prefilledAmount.toString());
    }
  }, [prefilledAmount]);

  // ✅ Calculate tier based on amount
  useEffect(() => {
    if (amount && !isNaN(amount) && TIERS.length > 0) {
      const amountNum = parseFloat(amount);
      const tier = TIERS.find(t => amountNum >= t.min && amountNum <= t.max) || TIERS[0];
      setCurrentTier(tier);
    }
  }, [amount]);

  // ✅ Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!signer || !walletAddress) return;
      try {
        const token = await getContractInstance("BITS");
        const raw = await token.balanceOf(walletAddress);
        setBalance(ethers.utils.formatUnits(raw, 18));
      } catch (err) {
        console.error("Error fetching $BITS balance:", err.message);
      }
    };
    fetchBalance();
  }, [signer, walletAddress]);

  // ✅ Fetch network + native balance
  useEffect(() => {
    const loadNetworkAndNative = async () => {
      try {
        if (!signer || !walletAddress) return;
        const net = await signer.provider.getNetwork();
        const mapped = getNetworkLabelByChainId(net.chainId);
        setNetworkInfo({ name: mapped.name, chainId: net.chainId, nativeSymbol: mapped.nativeSymbol });
      } catch (e) {
        console.warn("Network/native balance fetch failed:", e?.message);
      }
    };
    loadNetworkAndNative();
    // Attach listeners to the same provider used by the connected signer when possible (avoids Phantom opening)
    const eip1193 = signer?.provider?.provider && typeof signer.provider.provider.on === "function"
      ? signer.provider.provider
      : (window?.ethereum && typeof window.ethereum.on === "function" ? window.ethereum : null);
    if (eip1193) {
      const onChainChanged = async (hexId) => {
        const id = parseInt(hexId, 16);
        const mapped = getNetworkLabelByChainId(id);
        setNetworkInfo({ name: mapped.name, chainId: id, nativeSymbol: mapped.nativeSymbol });
      };
      const onAccountsChanged = async (accs) => {
        // networkInfo is refreshed elsewhere; no-op
        void accs;
      };
      eip1193.on('chainChanged', onChainChanged);
      eip1193.on('accountsChanged', onAccountsChanged);
      return () => {
        try {
          eip1193.removeListener('chainChanged', onChainChanged);
          eip1193.removeListener('accountsChanged', onAccountsChanged);
        } catch {}
      };
    }
  }, [signer, walletAddress]);

  // ✅ Fetch APR
  useEffect(() => {
    const fetchAPR = async () => {
      if (!signer) return;
      try {
        const contract = getStakingContract(signer);
        const rawApr = await contract.currentAPR();
        console.log("📊 Raw APR:", rawApr.toString());
        setApr(rawApr.toString());
        try {
          const f = await (await contract).unstakeFee?.();
          if (f) setUnstakeFeePct(parseFloat(ethers.utils.formatUnits(f, 16)));
        } catch(_) {}
      } catch (err) {
        console.error("Error fetching APR:", err.message);
      }
    };
    fetchAPR();
  }, [signer]);

  // ✅ Estimate reward for selected period (Daily/Weekly/Monthly/AI)
  useEffect(() => {
    if (!amount || isNaN(amount) || apr === "0") {
      setEstimatedReward("0");
      return;
    }

    try {
      const amtWei = ethers.utils.parseUnits(amount.toString(), 18);
      const aprBn = ethers.BigNumber.from(apr);
      const periodDays = getDaysByMode(compoundMode);

      // Add tier and lock bonuses
      const tierBonus = currentTier.bonus || 0; // in percent
      const lockBonus = (LOCK_PERIODS[selectedLockPeriod] || { bonus: 0 }).bonus; // in percent
      const totalBonus = tierBonus + lockBonus; // total bonus percent

      // Calculate final APR: base + bonuses
      const bonusMultiplier = ethers.BigNumber.from(100 + totalBonus); // 100% + bonuses
      const finalAPR = aprBn.mul(bonusMultiplier).div(100);

      // Store APR context for transparency (in percent)
      const basePct = parseFloat(ethers.utils.formatUnits(aprBn, 16)); // e.g. 10% -> 10.00
      const finalPct = parseFloat(ethers.utils.formatUnits(finalAPR, 16));
      setAprContext({ base: basePct, tier: tierBonus / 100, lock: lockBonus / 100, final: finalPct });

      // Yearly rewards (in wei BITS)
      const yearlyReward = amtWei.mul(finalAPR).div(ethers.constants.WeiPerEther);
      const baseYearly = amtWei.mul(aprBn).div(ethers.constants.WeiPerEther);

      // Period rewards using integer math: reward * days / 365
      const daysBN = ethers.BigNumber.from(periodDays);
      const periodTotal = yearlyReward.mul(daysBN).div(365);
      const periodBase = baseYearly.mul(daysBN).div(365);

      setEstimatedReward({
        total: ethers.utils.formatUnits(periodTotal, 18),
        base: ethers.utils.formatUnits(periodBase, 18),
        periodLabel: getLabelByMode(compoundMode),
        bonusPercent: totalBonus,
        tierBonus,
        lockBonus
      });
    } catch (err) {
      console.warn("Reward calculation failed:", err.message);
      setEstimatedReward("0");
    }
  }, [amount, apr, currentTier, selectedLockPeriod, compoundMode]);

  const handleStake = async () => {
    if (!signer || !walletAddress) {
      toast.error("❌ Please connect your wallet first!");
      return;
    }

    // Sanitize and parse amount robustly
    const amtStrRaw = String(amount ?? '').replace(/,/g, '').trim();
    let parsed;
    try {
      if (!/^\d*(?:\.\d{0,18})?$/.test(amtStrRaw) || amtStrRaw === '' || Number(amtStrRaw) <= 0) {
        toast.warn("Invalid amount. Use up to 18 decimals.");
        return;
      }
      parsed = ethers.utils.parseUnits(amtStrRaw, 18);
      if (parsed.lte(0)) {
        toast.warn("Please enter a positive amount.");
        return;
      }
    } catch (e) {
      toast.error("Amount parsing failed. Check decimals (max 18) and value size.");
      return;
    }

    // Refresh live balance before staking
    try {
      const tokenForBalance = await getContractInstance("BITS");
      const fresh = await tokenForBalance.balanceOf(walletAddress);
      const freshReadable = ethers.utils.formatUnits(fresh, 18);
      setBalance(freshReadable);
      if (parsed.gt(fresh)) {
        toast.error("Insufficient $BITS balance.");
        return;
      }
    } catch (_) {}

    setLoading(true);
    setStakeStep('approve_request'); // may be skipped if allowance is enough
    try {
      const network = await signer.provider.getNetwork();
      console.log("🌐 Current Network:", network);
      const allowedChainIds = [56, 97]; // BSC Mainnet and Testnet
      if (!allowedChainIds.includes(Number(network.chainId))) {
        toast.error(`❌ Unsupported network (Chain ID: ${network.chainId}). Please switch to BSC Mainnet (56) or BSC Testnet (97).`);
        setLoading(false);
        setStakeStep('error');
        return;
      }

      let contract, token;
      try {
        contract = getStakingContract(signer);
        token = await getContractInstance("BITS");
      } catch (rpcErr) {
        console.warn("⚠️ Direct contract creation failed, trying robust fallback:", rpcErr.message);
        const robustProvider = await getRobustProvider();
        contract = getStakingContract(robustProvider);
        token = await getContractInstance("BITS");
        contract = contract.connect(signer);
        token = token.connect(signer);
      }

      console.log("📋 Contract Addresses:");
      console.log("- BITS Token:", token.address);
      console.log("- Staking Contract:", contract.address);
      console.log("- User Wallet:", walletAddress);

      console.log("🔍 Checking user's stakes...");
      const userStakes = await contract.getStakeByUser(walletAddress);
      console.log("📊 User Stakes:", userStakes);

      if (userStakes.length > 0) {
        const lastStake = userStakes[userStakes.length - 1];
        console.log("📈 Latest Stake Details:");
        try { console.log("- Amount:", ethers.utils.formatUnits(lastStake.locked, 18), "BITS"); } catch(_) {}
        try { console.log("- APR%:", parseFloat(ethers.utils.formatUnits(lastStake.apr, 16)).toFixed(2) + "%"); } catch(_) {}
        try { console.log("- Lock Period:", (lastStake.lockPeriod?.toString?.() || lastStake.lockPeriod) + " seconds"); } catch(_) {}
        try { console.log("- Auto Compound:", lastStake.autoCompound); } catch(_) {}
        try { const ts = lastStake.startTime?.toString?.() || lastStake.startTime; console.log("- Start Time:", new Date(Number(ts) * 1000).toLocaleString()); } catch(_) {}
      }

      toast.info("🔍 Checking token allowance...");
      const allowance = await token.allowance(walletAddress, contract.address);
      console.log("🧪 Parsed amount:", parsed.toString());
      console.log("🧪 Allowance:", allowance.toString());
      console.log("🧪 Wallet address:", walletAddress);
      console.log("🧪 Contract address:", contract.address);

      if (allowance.lt(parsed)) {
        toast.info("🔐 Approving token...");
        setStakeStep('approve_request'); // user needs to confirm in wallet
        const txApprove = await token.approve(contract.address, parsed);
        setStakeStep('approve_pending'); // tx sent, waiting confirmations
        await txApprove.wait();
        setStakeStep('stake_request');
        toast.success("✅ Token approved.");
      } else {
        // skip approval
        setStakeStep('stake_request');
      }

      toast.info("📥 Sending stake transaction...");
      const txStake = await contract.stake(parsed);
      setStakeStep('stake_pending');
      const receipt = await txStake.wait();

      // 📢 TELEGRAM NOTIFICATION
      const bitsStaked = ethers.utils.formatUnits(parsed, 18);
      const lockPeriod = LOCK_PERIODS[selectedLockPeriod] || LOCK_PERIODS[0];
      await notifyStakingDeposit({
        wallet: walletAddress,
        amount: parseFloat(bitsStaked).toFixed(2),
        txHash: receipt.transactionHash
      });

      setAmount("");
      toast.success("🎉 Stake successful!");
      setStakeStep('done');
      try { new Audio(successSfx).play().catch(()=>{});} catch(_) {}
      setSuccessMsg(`Stake successful! You staked ${amtStrRaw} BITS.`);
      setShowSuccess(true);

      const raw = await token.balanceOf(walletAddress);
      setBalance(ethers.utils.formatUnits(raw, 18));
    } catch (err) {
      console.error("🚨 Stake error:", err);
      if (err.message.includes("missing trie node") || err.message.includes("RPC Connection Error")) {
        toast.error("🌐 BSC Testnet RPC Issue: Switching to backup endpoints automatically...");
        try {
          toast.info("🔄 Trying backup RPC automatically...");
          const robustProvider = await getRobustProvider();
          const backupContract = getStakingContract(robustProvider).connect(signer);
          const backupToken = await getContractInstance("BITS", robustProvider);
          setStakeStep('stake_request');
          const backupTx = await backupContract.stake(parsed);
          setStakeStep('stake_pending');
          await backupTx.wait();
          setAmount("");
          toast.success("🎉 Stake successful with backup RPC!");
          const raw = await backupToken.balanceOf(walletAddress);
          setBalance(ethers.utils.formatUnits(raw, 18));
          setStakeStep('done');
          return;
        } catch (backupErr) {
          console.error("❌ Backup RPC also failed:", backupErr);
          toast.error("🌐 All RPC endpoints are experiencing issues. Please try again in a few minutes.");
          setStakeStep('error');
        }
      } else if (err.message.includes("CALL_EXCEPTION")) {
        toast.error("📞 Contract Error: BSC Testnet might be overloaded. Try switching RPC in MetaMask or wait a few minutes.");
        setStakeStep('error');
      } else if (err.message.includes("user rejected")) {
        toast.warn("🚫 Transaction cancelled by user");
        setStakeStep('error');
      } else if (err.message.includes("insufficient funds")) {
        toast.error("💰 Insufficient BNB for gas fees - you need ~0.005 BNB for staking");
        setStakeStep('error');
      } else if (err.message.includes("All") && err.message.includes("endpoints failed")) {
        toast.error("🌐 All BSC Testnet RPCs are down! Try: 1) Switch to BSC Mainnet 2) Wait 30 minutes 3) Use different wallet");
        setStakeStep('error');
      } else if (err.code === 'NETWORK_ERROR') {
        toast.error("🌐 Network Error: Check your internet connection and wallet network settings");
        setStakeStep('error');
      } else {
        const errorMsg = err.reason || err.message || "Unknown blockchain error";
        toast.error("❌ Staking Failed: " + errorMsg);
        console.log("🔍 Full error object:", err);
        setStakeStep('error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stake-form">
      <h2 className="ai-form-title">Staking Protocol</h2>
      <div className="brand-line staking-brand" title="AI data pipeline" style={{ justifyContent: 'center', marginBottom: 10 }}>
        <img src={require("../../assets/logo.png")} alt="BITS" className="bits-logo-mini" />
        <span className="bitsPulseLabel">BitPulse®</span>
      </div>
      {rewardsSource && (
        <div style={{
          background: "rgba(0, 255, 195, 0.2)",
          border: "1px solid rgba(0, 255, 195, 0.5)",
          borderRadius: "15px",
          padding: "15px",
          marginBottom: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <p style={{ margin: "0", color: "rgba(255, 255, 255, 0.8)", fontSize: "1rem", textAlign: "center" }}>
            🎁 <strong>Rewards Integration:</strong> Your rewards are ready for staking!
          </p>
        </div>
      )}

      {/* AI Stats Display */}
      <div className="ai-stats-grid" style={{ marginBottom: "2rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", rowGap: "1.2rem" }}>
        <div className="ai-stat-item">
          <div className="ai-stat-label">Wallet</div>
          <div className="ai-stat-value" style={{ fontSize: "1.2rem", letterSpacing: "0.5px", textShadow: "0 0 8px rgba(0,255,200,0.5)", color: "rgba(0,255,200,0.95)" }}>
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </div>
          {/* Only show the circled chain icon to avoid redundancy */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            {(() => { const sty = getNetworkChipStyle(networkInfo?.chainId); return (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                maxWidth: '100%'
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: sty.bg, border: sty.border, color: sty.color,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ChainIcon chainId={networkInfo?.chainId} size={16} />
                </span>
                <span style={{
                  color: sty.color,
                  fontSize: '0.9rem',
                  maxWidth: '100%',
                  textAlign: 'center',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}>
                  {networkInfo?.name || 'Network'}
                </span>
              </span>
            ); })()}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <select
                value={String(targetChainId)}
                onChange={(e) => setTargetChainId(parseInt(e.target.value))}
                style={{
                  background: 'rgba(24,24,24,0.9)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '4px 6px',
                  fontSize: '0.8rem',
                  flex: '1 1 170px',
                  minWidth: 170,
                  maxWidth: '100%'
                }}
              >
                {Object.keys(SUPPORTED_NETWORKS)
                  .map((cid) => Number(cid))
                  .sort((a, b) => {
                    const an = SUPPORTED_NETWORKS[a];
                    const bn = SUPPORTED_NETWORKS[b];
                    if (an.testnet !== bn.testnet) return an.testnet ? 1 : -1; // mainnets first
                    return an.chainName.localeCompare(bn.chainName);
                  })
                  // ✅ Only mainnets in UI (testnets hidden)
                  .filter((cid) => !SUPPORTED_NETWORKS[cid]?.testnet)
                  .map((cid) => (
                    <option key={cid} value={cid}>
                      {SUPPORTED_NETWORKS[cid].icon} {SUPPORTED_NETWORKS[cid].chainName}{SUPPORTED_NETWORKS[cid].testnet ? ' (testnet)' : ''}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => switchNetwork(targetChainId)}
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                  color: 'black', border: 'none', borderRadius: '10px',
                  padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700,
                  cursor: isSwitchingNet ? 'not-allowed' : 'pointer',
                  opacity: isSwitchingNet ? 0.7 : 1,
                  flex: '0 0 auto'
                }}
                disabled={isSwitchingNet || !window?.ethereum}
              >
                Switch
              </button>
            </div>
          </div>
        </div>
        <div className="ai-stat-item">
          <div className="ai-stat-label">Available</div>
          <div
            className="ai-stat-value"
            title={Number.isFinite(Number(balance)) ? Number(balance).toLocaleString("en-US", { maximumFractionDigits: 6 }) : String(balance || "")}
          >
            {Number.isFinite(Number(balance)) ? Math.floor(Number(balance)).toLocaleString("en-US") : "—"}
          </div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        <div className="ai-stat-item">
          <div className="ai-stat-label" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            APR
            <button
              aria-label="APR info"
              onClick={() => setShowAprInfo((v) => !v)}
              style={{
                cursor: "pointer",
                opacity: 1,
                fontSize: "1.2rem",
                lineHeight: 1,
                background: "radial-gradient(closest-side, rgba(0,255,200,0.25), rgba(0,255,200,0.05))",
                border: "1px solid rgba(0,255,200,0.6)",
                color: "#00ffd0",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(0,255,200,0.4)",
                padding: 0
              }}
              title="APR info"
            >
              ⓘ
            </button>
          </div>
          <div className="ai-stat-value stake-protocol-apr">{aprPercentDisplayFrom1e18(apr)}</div>
          <div className="ai-stat-label">Rate</div>
        </div>
      </div>

      {showAprInfo && (
        <div
          onClick={() => setShowAprInfo(false)}
          onMouseMove={() => setShowAprInfo(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="APR Information"
            style={{
              position: "absolute",
              top: "22%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0b0f14",
              border: "1px solid rgba(0,255,200,0.35)",
              borderRadius: "12px",
              padding: "20px 22px",
              width: "min(420px, 92vw)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
              lineHeight: 1.55
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <strong style={{ color: "#eafffb", letterSpacing: 0.5 }}>APR</strong>
              <button
                onClick={() => setShowAprInfo(false)}
                aria-label="Close"
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: "#d7fffb", fontSize: "1.06rem" }}>
              APR (Annual Percentage Rate) is the estimated yearly return from staking, excluding compounding. Tier and lock bonuses increase the final APR.
            </div>
          </div>
        </div>
      )}

      {/* 💰 MODERN INPUT SECTION - ULTRA COMPACT HUD STYLE */}
      <div style={{
        marginBottom: "20px",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: "12px",
        padding: "15px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        {/* Top Row: Label & Wallet Balance */}
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px"}}>
          <label style={{color: "#14F195", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase"}}>
            STAKE AMOUNT
          </label>
          <div style={{fontSize: "0.8rem", color: "rgba(255,255,255,0.6)"}}>
            Wallet:{" "}
            <span
              style={{ color: "#fff", fontWeight: "600", whiteSpace: "nowrap" }}
              title={Number.isFinite(Number(balance)) ? Number(balance).toLocaleString("en-US", { maximumFractionDigits: 6 }) : String(balance || "")}
            >
              {Number.isFinite(Number(balance)) ? Math.floor(Number(balance)).toLocaleString("en-US") : "—"}
            </span>
          </div>
        </div>

        {/* Input Row: The Input + MAX + Symbol on ONE line */}
        <div style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          paddingBottom: "5px",
          transition: "border-color 0.3s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderBottom = "1px solid rgba(20, 241, 149, 0.5)"}
        onMouseLeave={(e) => e.currentTarget.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)"}
        >
          <input
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "1.6rem",
              fontWeight: "600",
              padding: "0",
              margin: "0",
              fontFamily: "'Orbitron', 'Space Grotesk', sans-serif", /* SOLANA FONT */
              letterSpacing: "1px"
            }}
          />
          
          <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
            <button
              onClick={() => setAmount(balance)}
              style={{
                background: "rgba(153, 69, 255, 0.15)",
                border: "1px solid rgba(153, 69, 255, 0.3)",
                color: "#9945FF",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "0.7rem",
                fontWeight: "800",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              MAX
            </button>
            <span style={{color: "#9945FF", fontWeight: "700", fontSize: "1rem"}}>$BITS</span>
          </div>
        </div>

        {/* Bottom Row: USD & Progress */}
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px"}}>
          <span style={{fontSize: "0.75rem", color: "rgba(255,255,255,0.4)"}}>
            {amount && bitsPriceNum > 0 ? `≈ $${(parseFloat(amount) * bitsPriceNum).toFixed(2)}` : "Min: 0.0001"}
          </span>
          
          {/* Ultra Slim Progress Line */}
          {amount && (
            <div style={{width: "40%", height: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "1px"}}>
               <div style={{
                 width: `${Math.min((parseFloat(amount) / (parseFloat(balance) || 1)) * 100, 100)}%`,
                 height: "100%",
                 background: "#14F195",
                 boxShadow: "0 0 8px #14F195"
               }}></div>
            </div>
          )}
        </div>
      </div>

      {/* 🏆 TIER SYSTEM */}
      {amount && !isNaN(amount) && (
        <div className="tier-display" style={{
          background: `linear-gradient(135deg, ${currentTier.color}20, ${currentTier.color}10)`,
          border: `1px solid ${currentTier.color}60`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "1.5rem",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.5rem" }}>{currentTier.icon}</span>
            <div>
              <h4 style={{ margin: 0, color: currentTier.color }}>{currentTier.name} Tier</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>
                {currentTier.bonus > 0 ? `+${currentTier.bonus}% APR Bonus!` : "Base APR Rate"}
              </p>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
            Range: {currentTier.min === 1 ? "1" : (currentTier.min || 0).toLocaleString()} - {currentTier.max === Infinity ? "∞" : (currentTier.max || 0).toLocaleString()} BITS
          </div>
        </div>
      )}

      {/* 🔒 LOCK PERIOD SELECTOR */}
      <div className="lock-periods" style={{ marginBottom: "1.5rem" }}>
        <label className="ai-input-label" style={{ marginBottom: "12px", display: "block" }}>
          🔒 Lock Period (Higher APR for longer locks)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
          {LOCK_PERIODS.map((period, index) => (
            <div
              key={index}
              onClick={() => setSelectedLockPeriod(index)}
              style={{
                background: selectedLockPeriod === index 
                  ? `linear-gradient(135deg, ${period.color}33, ${period.color}14)` 
                  : "rgba(255,255,255,0.08)",
                border: selectedLockPeriod === index 
                  ? `2px solid ${period.color}` 
                  : "1px solid rgba(255,255,255,0.35)",
                borderRadius: "10px",
                padding: "16px 12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: 'none'
              }}
            >
              {/* AI-styled icon */}
              <div style={{ marginBottom: "8px" }}>
                <span style={{
                  display: 'inline-block',
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: period.color,
                  lineHeight: '36px', fontSize: '1.2rem'
                }}>
                  {period.icon}
                </span>
              </div>
              {/* Name */}
              <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px", color: "#e6f9f5", letterSpacing: 0.3 }}>{period.name}</div>
              {/* Bonus percent with animation */}
              <div style={{
                fontSize: "1.05rem", fontWeight: 800,
                color: selectedLockPeriod === index ? period.color : "#defbf4"
              }}>
                {period.bonus > 0 ? `+${period.bonus}%` : "Base"}
              </div>
            </div>
          ))}
        </div>
        
      </div>

      {/* 🔄 AI REINVEST (refined) */}
      <div className="auto-compound" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: 'column',
            gap: 10,
            background: "rgba(12,16,20,0.35)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            padding: "12px 14px"
          }}
        >
          {/* Header: centered title + help + toggle (3-column grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
            {/* Left: Help icon (compact) */}
            <div style={{ justifySelf: 'center' }}>
              <button
                onClick={() => setShowCompoundInfo(true)}
                title="Help"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '1px solid rgba(142,233,220,0.8)',
                  color: '#8ee9dc',
                  background: 'transparent',
                  cursor: 'pointer',
                  lineHeight: '20px',
                  fontSize: 12,
                  textAlign: 'center',
                  padding: 0
                }}
              >
                ?
              </button>
            </div>

            {/* Center: Title */}
            <div style={{ textAlign: 'center', fontWeight: 800, color: '#ffffff', fontSize: '1.15rem', whiteSpace: 'nowrap' }}>AI Reinvest</div>

            {/* Right: Switch */}
            <div style={{ justifySelf: 'center' }}>
              <button
                type="button"
                aria-label="Toggle AI Reinvest"
                role="switch"
                aria-checked={autoCompound}
                onClick={() => setAutoCompound(!autoCompound)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 9999,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: autoCompound ? '#00cc7a' : 'rgba(255,255,255,0.2)',
                  position: 'relative', cursor: 'pointer', padding: 0
                }}
              >
                <span style={{ position: 'absolute', top: 2, left: autoCompound ? 28 : 2, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left 0.22s ease' }} />
              </button>
            </div>
          </div>

          {/* Segmented control - compact crisp pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', opacity: autoCompound ? 1 : 0.45 }}>
            {[
              { id: 'ai', label: 'AI' },
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  if (!autoCompound) return;
                  setCompoundMode(opt.id);
                }}
                title={opt.id === 'ai' ? 'AI schedules reinvest when profitable' : `Reinvest ${opt.label.toLowerCase()}`}
                style={{
                  background: compoundMode === opt.id && autoCompound ? '#00ff88' : 'transparent',
                  color: compoundMode === opt.id && autoCompound ? '#032016' : '#ffffff',
                  border: '1px solid rgba(255,255,255,0.28)',
                  borderColor: compoundMode === opt.id && autoCompound ? '#00ff88' : 'rgba(255,255,255,0.28)',
                  borderRadius: 9999,
                  padding: '6px 12px',
                  minWidth: 70,
                  fontSize: 13, fontWeight: 700,
                  cursor: autoCompound ? 'pointer' : 'not-allowed'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Explanation + next action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.9rem', color: '#e8f9f7' }}>
              {(!autoCompound) && 'Disabled: rewards are not auto-reinvested.'}
              {autoCompound && compoundMode === 'ai' && 'AI monitors APR, gas and reward size, reinvesting only when it improves your net yield.'}
              {autoCompound && compoundMode === 'daily' && 'Fixed schedule: reinvest once per day.'}
              {autoCompound && compoundMode === 'weekly' && 'Fixed schedule: reinvest once per week.'}
              {autoCompound && compoundMode === 'monthly' && 'Fixed schedule: reinvest once per month.'}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#b9ece6' }}>
              {autoCompound ? (
                compoundMode === 'ai' ? 'Next action: when rewards cover gas and boost APR (typically within 24–72h).' :
                compoundMode === 'daily' ? 'Next action: within 24h of last reinvest.' :
                compoundMode === 'weekly' ? 'Next action: within 7 days of last reinvest.' :
                'Next action: within 30 days of last reinvest.'
              ) : 'Next action: none'}
            </span>
          </div>

          {/* APY details trigger */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <button
              onClick={() => setShowApyModal(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#ffffff',
                borderRadius: 9999,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              APY details
            </button>
          </div>
        </div>

        {/* AI Reinvest Info Modal */}
        {showCompoundInfo && (
          <div onClick={() => setShowCompoundInfo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(11,15,20,0.85)', border: '1px solid rgba(0,255,136,0.35)', borderRadius: 12,
                width: 'min(560px, 92vw)', padding: '16px 18px', color: '#d7fffb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>AI Reinvest – how it works</strong>
                <button onClick={() => setShowCompoundInfo(false)} style={{ background: 'transparent', border: 'none', color: '#a7ffef', cursor: 'pointer' }}>✕</button>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.55 }}>
                <li><strong>Goal</strong>: restake rewards to principal to increase compounding and effective APR.</li>
                <li><strong>AI mode</strong>: watches APR, gas and reward size; executes only when net yield is positive.</li>
                <li><strong>Fixed modes</strong>: Daily/Weekly/Monthly run on simple schedule, regardless of gas/APR.</li>
                <li><strong>Costs & safety</strong>: actions are gas-limited and never withdraw your principal.</li>
              </ul>
              <p style={{ marginTop: 10, fontSize: '0.9rem', opacity: 0.9 }}>You can switch modes anytime; the next action is planned from the last execution time.</p>
            </div>
          </div>
        )}

        {/* APY Modal */}
        {showApyModal && (
          <div onClick={() => setShowApyModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', top: '24%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(11,15,20,0.85)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12,
                width: 'min(520px, 92vw)', padding: '16px 18px', color: '#eaf9f6'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Projected APY gain</strong>
                <button onClick={() => setShowApyModal(false)} style={{ background: 'transparent', border: 'none', color: '#a7ffef', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>Base APR: {aprPctNum.toFixed(2)}%</div>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13 }}>
                <div>AI       : {aiApyMin.toFixed(2)}% – {aiApyMax.toFixed(2)}%  | gain ≈ {(Math.max(aiApyMax, aiApyMin) - aprPctNum).toFixed(2)}%</div>
                <div>Daily    : {apyDaily.toFixed(2)}%  | gain ≈ {(apyDaily - aprPctNum).toFixed(2)}%</div>
                <div>Weekly   : {apyWeekly.toFixed(2)}%  | gain ≈ {(apyWeekly - aprPctNum).toFixed(2)}%</div>
                <div>Monthly  : {apyMonthly.toFixed(2)}% | gain ≈ {(apyMonthly - aprPctNum).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Control Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => setAmount(balance)} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #bdfcff, #a8ffd6)",
            padding: "1rem",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "8px",
            fontWeight: 900,
            fontSize: "1.05rem",
            letterSpacing: "0.5px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            filter: "none",
            backdropFilter: "none"
          }}
        >
          💎 Max Stake
        </button>
        <button 
          onClick={() => setAmount("")} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: "linear-gradient(45deg, #ffd89e, #ff9a76)",
            padding: "1rem",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "8px",
            fontWeight: 900,
            fontSize: "1.05rem",
            letterSpacing: "0.5px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            filter: "none",
            backdropFilter: "none"
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Main Stake Button */}
      <button 
        onClick={handleStake} 
        disabled={loading || !amount}
        style={{
          width: "100%",
          background: loading || !amount 
            ? "rgba(255, 255, 255, 0.3)" 
            : "linear-gradient(135deg, #9dffce, #9ad7ff)",
          color: loading || !amount ? "#555" : "#0a0a0a",
          border: "none",
          borderRadius: "12px",
          padding: "18px 26px",
          fontSize: "1.2rem",
          fontWeight: 900,
          cursor: loading || !amount ? "not-allowed" : "pointer",
          marginTop: "1.5rem",
          marginBottom: "1rem",
          transition: "all 0.3s ease",
          boxShadow: loading || !amount 
            ? "none" 
            : "0 4px 15px rgba(0, 255, 136, 0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          filter: "none",
          backdropFilter: "none"
        }}
        onMouseEnter={(e) => {
          if (!loading && amount) {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(0, 255, 136, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && amount) {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(0, 255, 136, 0.4)";
          }
        }}
      >
        {loading ? (
          stakeStep === 'approve_request' ? '🔐 Approve in wallet…' :
          stakeStep === 'approve_pending' ? '⏳ Approving…' :
          stakeStep === 'stake_request' ? '📥 Confirm stake in wallet…' :
          stakeStep === 'stake_pending' ? '⏳ Staking…' :
          stakeStep === 'done' ? '✅ Done' :
          '🔄 Processing…'
        ) : (
          `🚀 Stake ${amount || 0} BITS${bitsPriceNum>0 && amount ? ` (≈ ${formatUsd(parseFloat(amount||'0')*bitsPriceNum)})` : ''}`
        )}
      </button>

      {(loading || stakeStep !== 'idle') && (
        <div style={{ marginTop: 6, textAlign: 'center', fontSize: '0.9rem', color: '#c8fff0' }}>
          {stakeStep === 'approve_request' && '🔐 Waiting for token approval in your wallet…'}
          {stakeStep === 'approve_pending' && '⏳ Approval submitted. Waiting for confirmations…'}
          {stakeStep === 'stake_request' && '📥 Please confirm the stake transaction in your wallet…'}
          {stakeStep === 'stake_pending' && '⏳ Staking transaction pending…'}
          {stakeStep === 'done' && '✅ Stake completed.'}
        </div>
      )}

      {/* Enhanced Reward Estimation */}
      {amount && estimatedReward !== "0" && typeof estimatedReward === 'object' && (
        <div className="reward-estimate" style={{
          background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,170,255,0.2))",
          border: "1px solid rgba(0,255,136,0.5)",
          borderRadius: "12px",
          padding: "16px",
          marginTop: "1rem"
        }}>
          <h4
            style={{
              margin: "0 0 12px 0",
              color: "#ffffff",
              fontSize: "1.2rem",
              fontWeight: 900,
              lineHeight: 1.2,
              textShadow: 'none',
              filter: 'none',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              mixBlendMode: 'normal'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(0,0,0,0.35)',
                padding: '4px 10px',
                borderRadius: 10,
                textShadow: 'none',
                filter: 'none'
              }}
            >
              📊 Estimated {typeof estimatedReward === 'object' && estimatedReward.periodLabel ? estimatedReward.periodLabel : 'Yearly'} Rewards
            </span>
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", color: "#eaf9f6" }}>Base Reward:</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff" }}>
                {formatBitsEstimate(estimatedReward.base)} BITS
                {bitsPriceNum > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '0.95rem', color: '#9bded4' }}>
                    (💵 {formatUsd(parseFloat(estimatedReward.base || '0') * bitsPriceNum)})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", color: "#eaf9f6" }}>Total Reward:</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#00ff88" }}>
                {formatBitsEstimate(estimatedReward.total)} BITS
                {bitsPriceNum > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '1rem', color: '#9bded4' }}>
                    (💵 {formatUsd(parseFloat(estimatedReward.total || '0') * bitsPriceNum)})
                  </span>
                )}
              </div>
            </div>
          </div>
          {(estimatedReward.bonusPercent || 0) > 0 && (
            <div style={{ 
              background: "rgba(255,215,0,0.1)", 
              border: "1px solid rgba(255,215,0,0.3)", 
              borderRadius: "8px", 
              padding: "8px", 
              fontSize: "0.9rem" 
            }}>
              <div style={{ color: "#FFD700", fontWeight: "600" }}>🚀 Bonus Breakdown:</div>
              <div>🏆 Tier Bonus: +{estimatedReward.tierBonus || 0}% ({currentTier.name})</div>
              <div>🔒 Lock Bonus: +{estimatedReward.lockBonus || 0}% ({LOCK_PERIODS[selectedLockPeriod]?.name || "Flexible"})</div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "4px", marginTop: "4px" }}>
                📈 <strong>Total Bonus: +{estimatedReward.bonusPercent || 0}% APR</strong>
              </div>
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#c8fff0' }}>
            Using APR: <strong>{aprContext.final.toFixed(2)}%</strong> 
            <span style={{ opacity: 0.85 }}> (base {aprContext.base.toFixed(2)}% + tier {aprContext.tier.toFixed(2)}% + lock {aprContext.lock.toFixed(2)}%)</span>
          </div>
        </div>
      )}

      {/* Early Unstake Fee info */}
      {unstakeFeePct !== null && amount && !isNaN(parseFloat(amount)) && (
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.9rem', color: '#ffd27f' }}>
          Early Unstake Fee: {unstakeFeePct.toFixed(2)}% → net receive ≈ {(Math.max(0, parseFloat(amount) * (1 - unstakeFeePct/100))).toLocaleString(undefined, { maximumFractionDigits: 4 })} BITS
        </div>
      )}

      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />

      {showSuccess && (
        <div onClick={() => setShowSuccess(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ background:'#0b0f14', border:'1px solid rgba(0,255,136,0.35)', borderRadius:14, padding:'18px 20px', width:'min(420px,92vw)', color:'#eafffb', textAlign:'center', boxShadow:'0 12px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
            <div style={{ fontSize:'1.05rem' }}>{successMsg || 'Operation completed successfully.'}</div>
            <button onClick={()=>setShowSuccess(false)} style={{ marginTop:14, background:'#00ff88', color:'#032016', border:'none', borderRadius:10, padding:'8px 14px', fontWeight:800, cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakeForm;
