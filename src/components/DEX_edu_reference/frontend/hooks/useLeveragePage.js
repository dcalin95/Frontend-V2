/**
 * useLeveragePage – state și handlers pentru LeveragePage (Spot + CFD).
 * Dacă demo (useLeverageDemoAccount) e în mod demo: folosește solduri/poziții demo, open/close simulate.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP } from '../../../../contract/contractMap';
import {
  getTokenOptions,
  getCfdMarginOptions,
  CFD_ASSETS,
  DEMO_CFD_ENTRY_PRICES,
  SPOT_LEVERAGE_UI_DISABLED,
} from '../constants/leverageConstants';
import { fetchSpotTokenPrice } from '../services/cfdPriceService';
import { normalizeTxError } from '../utils/leverageTxErrors';
import { validateSpotAddCollateral, validateSpotRemoveCollateral } from '../utils/leverageSpotCollateral';
import { emitLeverageActivity } from '../utils/leverageActivityBus';
import { LEVERAGE_ACTIVITY_KIND } from '../utils/leverageActivityTypes';

/** Build vaultBalanceMap (address -> wei string) from demo vaultBalances (symbol -> human string) */
function demoVaultBalanceMap(demoAccount, tokenOptions, getTokenDecimals) {
  if (!demoAccount?.vaultBalances || !tokenOptions?.length || !getTokenDecimals) return {};
  const map = {};
  tokenOptions.forEach((t) => {
    const amt = demoAccount.vaultBalances[t.symbol] || '0';
    try {
      map[t.address] = ethers.utils.parseUnits(amt, getTokenDecimals(t.address)).toString();
    } catch {
      map[t.address] = '0';
    }
  });
  return map;
}

/** Get symbol for token address */
function symbolForAddress(tokenOptions, address) {
  const t = tokenOptions.find((o) => (o.address || '').toLowerCase() === (address || '').toLowerCase());
  return t?.symbol || null;
}

/** Fetch real-time price for a token symbol via Binance public API (no auth required) */
async function fetchPriceForSymbol(symbol) {
  return fetchSpotTokenPrice(symbol);
}

function liveTradingGateMessage(gate) {
  if (!gate) return 'Network not ready for live trading.';
  if (gate.chainPending) return 'Detecting wallet network…';
  if (gate.chainReadFailed) {
    return 'Could not read network from wallet. Unlock the wallet or refresh the page.';
  }
  if (gate.isWrongChain) {
    return `Wrong network: switch to ${gate.expectedLeverageChainName} (chain ${gate.expectedLeverageChainId}). Current chain: ${gate.connectedChainId}.`;
  }
  return 'Network not ready for live trading.';
}

export function useLeveragePage(useLeverageTradingResult, demo = null, options = {}) {
  const { getCurrentPriceForAsset, forceRealMode = false } = options;
  const {
    contractReady,
    spotAvailable,
    positions: livePositions,
    loading: liveLoading,
    cfdPositions: liveCfdPositions,
    configuredCFDAssets = CFD_ASSETS,
    openPosition,
    closePosition,
    openCFDPosition,
    closeCFDPosition,
    isConnected,
    connectWallet,
    vaultBalanceMap: liveVaultBalanceMap,
    getTokenDecimals,
    BPS_DENOMINATOR,
    fetchVaultBalances,
    leverageChainGate,
    addCollateral,
    removeCollateral,
  } = useLeverageTradingResult;

  // Trebuie aliniat la demo.isDemoMode din useLeverageDemoAccount; demoAccount poate lipsi temporar după status OK.
  const isDemoMode = !!demo?.isDemoMode && !forceRealMode;
  const gate = leverageChainGate || {};
  const liveTradingBlocked =
    !isDemoMode &&
    isConnected &&
    (gate.chainPending || gate.chainReadFailed || gate.isWrongChain);
  const demoPositions = (demo?.demoAccount?.positions || []).filter((p) => p.type === 'spot');
  const demoCfdPositions = (demo?.demoAccount?.positions || []).filter((p) => p.type === 'cfd');
  const tokenOptions = getTokenOptions();

  const vaultBalanceMap = useMemo(() => {
    if (isDemoMode) return demoVaultBalanceMap(demo.demoAccount, tokenOptions, getTokenDecimals);
    return liveVaultBalanceMap;
  }, [isDemoMode, demo?.demoAccount?.vaultBalances, liveVaultBalanceMap, tokenOptions, getTokenDecimals]);

  const positions = isDemoMode ? demoPositions : livePositions;
  const cfdPositions = isDemoMode ? demoCfdPositions : liveCfdPositions;
  const loading = isDemoMode ? false : liveLoading;

  const [activeTab, setActiveTab] = useState('spot');
  const [collateralToken, setCollateralToken] = useState('');
  const [borrowedToken, setBorrowedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [leverageBps, setLeverageBps] = useState(50000);
  const [txPendingDemo, setTxPendingDemo] = useState(false);
  const [txPendingReal, setTxPendingReal] = useState(false);
  const [txError, setTxError] = useState(null);

  const [cfdSettlementToken, setCfdSettlementToken] = useState('');
  const [cfdAssetId, setCfdAssetId] = useState(0);
  const [cfdAmount, setCfdAmount] = useState('');
  const [cfdLeverageBps, setCfdLeverageBps] = useState(50000);
  const [cfdIsLong, setCfdIsLong] = useState(true);

  const cfdMarginOptions = getCfdMarginOptions();

  useEffect(() => {
    if (tokenOptions.length && !collateralToken) setCollateralToken(tokenOptions[0].address);
    if (tokenOptions.length && !borrowedToken) setBorrowedToken(CONTRACT_MAP?.USDT?.address || tokenOptions[0].address);
    if (cfdMarginOptions.length > 0 && !cfdSettlementToken) setCfdSettlementToken(cfdMarginOptions[0].address);
  }, [tokenOptions.length, cfdMarginOptions.length]);

  useEffect(() => {
    if (configuredCFDAssets.length > 0 && !configuredCFDAssets.some((a) => a.id === cfdAssetId))
      setCfdAssetId(configuredCFDAssets[0]?.id ?? 0);
  }, [configuredCFDAssets, cfdAssetId]);

  const decimals = getTokenDecimals?.(collateralToken) ?? 18;
  const vaultBalanceRaw = vaultBalanceMap?.[collateralToken] || '0';
  const vaultBalanceFormatted = ethers.utils.formatUnits(vaultBalanceRaw, decimals);

  const handleMax = useCallback(() => {
    const formatted = ethers.utils.formatUnits(vaultBalanceRaw, decimals);
    if (formatted && parseFloat(formatted) > 0) setAmount(parseFloat(formatted).toString());
  }, [vaultBalanceRaw, decimals]);

  const sameToken = collateralToken && borrowedToken && collateralToken === borrowedToken;

  const handleOpen = useCallback(async () => {
    setTxError(null);
    if (SPOT_LEVERAGE_UI_DISABLED) {
      setTxError(
        'Spot leverage is disabled until a compatible ILendingPool integration (or Venus adapter) is deployed. CFD remains available.'
      );
      return;
    }
    if (!isDemoMode && liveTradingBlocked) {
      setTxError(liveTradingGateMessage(gate));
      return;
    }
    if (sameToken) {
      setTxError('Collateral and borrowed token must be different');
      return;
    }
    const amt = amount.trim();
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) {
      setTxError('Enter a valid collateral amount');
      return;
    }
    const amountNum = parseFloat(amt);
    if (isDemoMode) setTxPendingDemo(true); else setTxPendingReal(true);
    try {
      if (isDemoMode && demo?.updateDemoAccount) {
        const current = demo.demoAccount || {};
        const vaultBalances = { ...(current.vaultBalances || {}) };
        const symbol = symbolForAddress(tokenOptions, collateralToken);
        if (symbol) {
          const cur = parseFloat(vaultBalances[symbol] || '0');
          if (cur < amountNum) {
            setTxError('Insufficient demo balance. Use "Reset demo balance" above to get 10,000 USDT.');
            setTxPendingDemo(false);
            return;
          }
          vaultBalances[symbol] = String(Math.max(0, cur - amountNum));
        }
        const amountWei = ethers.utils.parseUnits(amt, decimals);

        // Fetch real entry price for borrowed token
        const borrowedSymbol = symbolForAddress(tokenOptions, borrowedToken);
        let spotEntryPrice = 0;
        try {
          const fetched = await fetchPriceForSymbol(borrowedSymbol);
          if (fetched != null && fetched > 0) spotEntryPrice = fetched;
        } catch (_) {}
        const leverageNum = Number(leverageBps) / BPS_DENOMINATOR;
        // Liquidation when losses consume ~80% of collateral
        const liqPrice = spotEntryPrice > 0 ? Math.max(0, spotEntryPrice * (1 - 0.8 / leverageNum)) : 0;
        const entryPriceWei = spotEntryPrice > 0 ? ethers.utils.parseEther(spotEntryPrice.toFixed(6)).toString() : '0';
        const liqPriceWei = liqPrice > 0 ? ethers.utils.parseEther(liqPrice.toFixed(6)).toString() : '0';

        const newPosition = {
          type: 'spot',
          positionId: `demo-spot-${Date.now()}`,
          collateralToken,
          borrowedToken,
          collateralAmount: amountWei.toString(),
          // borrowed = collateral * (leverage - 1): la 10x cu 100 USDT → împrumuți 900, total 1000
          borrowedAmount: amountWei.mul(leverageBps - BPS_DENOMINATOR).div(BPS_DENOMINATOR).toString(),
          leverageRatio: leverageBps.toString(),
          entryPrice: entryPriceWei,
          entryPriceHuman: spotEntryPrice || null,
          liquidationPrice: liqPriceWei,
          liquidationPriceHuman: liqPrice || null,
          isActive: true,
        };
        const existingCfd = (current.positions || []).filter((p) => p.type === 'cfd');
        const existingSpot = (current.positions || []).filter((p) => p.type === 'spot');
        const allPositions = [...existingCfd, ...existingSpot, newPosition];
        await demo.updateDemoAccount({ vaultBalances, positions: allPositions });
        emitLeverageActivity({
          scope: 'demo',
          kind: LEVERAGE_ACTIVITY_KIND.DEMO_SPOT_OPEN,
          phase: 'confirmed',
          positionId: newPosition.positionId,
          amountLabel: amt,
          at: new Date().toISOString(),
        });
        setAmount('');
      } else {
        const amountWei = ethers.utils.parseUnits(amount.trim(), decimals);
        const OPEN_SPOT_TIMEOUT_MS = 90000;
        const openPromise = openPosition(collateralToken, borrowedToken, amountWei, leverageBps);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout 90s. Check your wallet for a confirmation request. If you already confirmed, check BSCScan for status.')), OPEN_SPOT_TIMEOUT_MS)
        );
        await Promise.race([openPromise, timeoutPromise]);
        setAmount('');
      }
    } catch (e) {
      setTxError(normalizeTxError(e).userMessage);
    } finally {
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
    }
  }, [sameToken, amount, collateralToken, borrowedToken, decimals, leverageBps, openPosition, isDemoMode, demo, tokenOptions, BPS_DENOMINATOR, liveTradingBlocked, gate]);

  const handleClose = useCallback(async (positionId) => {
    setTxError(null);
    if (!isDemoMode && liveTradingBlocked) {
      setTxError(liveTradingGateMessage(gate));
      return;
    }
    if (isDemoMode) setTxPendingDemo(true); else setTxPendingReal(true);
    try {
      if (isDemoMode && demo?.updateDemoAccount) {
        const current = demo.demoAccount || {};
        const pos = (current.positions || []).find((p) => p.positionId === positionId && p.type === 'spot');
        const vaultBalances = { ...(current.vaultBalances || {}) };
        if (pos) {
          const symbol = symbolForAddress(tokenOptions, pos.collateralToken);
          if (symbol) {
            const posDecimals = getTokenDecimals?.(pos.collateralToken) ?? 18;
            const addBack = ethers.utils.formatUnits(pos.collateralAmount || '0', posDecimals);
            const cur = parseFloat(vaultBalances[symbol] || '0');
            vaultBalances[symbol] = String(cur + parseFloat(addBack));
          }
        }
        const nextPositions = (current.positions || []).filter((p) => p.positionId !== positionId);
        await demo.updateDemoAccount({ vaultBalances, positions: nextPositions });
        emitLeverageActivity({
          scope: 'demo',
          kind: LEVERAGE_ACTIVITY_KIND.DEMO_SPOT_CLOSE,
          phase: 'confirmed',
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
      } else {
        await closePosition(positionId);
      }
    } catch (e) {
      setTxError(normalizeTxError(e).userMessage);
    } finally {
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
    }
  }, [closePosition, isDemoMode, demo, tokenOptions, getTokenDecimals, liveTradingBlocked, gate]);

  const cfdDecimals = getTokenDecimals?.(cfdSettlementToken) ?? 18;
  const cfdVaultBalanceRaw = vaultBalanceMap?.[cfdSettlementToken] || '0';
  const cfdVaultBalanceFormatted = ethers.utils.formatUnits(cfdVaultBalanceRaw, cfdDecimals);

  const handleCfdMax = useCallback(() => {
    if (cfdVaultBalanceFormatted && parseFloat(cfdVaultBalanceFormatted) > 0) {
      setCfdAmount(parseFloat(cfdVaultBalanceFormatted).toString());
    }
  }, [cfdVaultBalanceFormatted]);

  const handleOpenCFD = useCallback(async () => {
    setTxError(null);
    if (!isDemoMode && liveTradingBlocked) {
      setTxError(liveTradingGateMessage(gate));
      return;
    }
    if (isDemoMode) setTxPendingDemo(true); else setTxPendingReal(true);
    const amt = cfdAmount.trim();
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) {
      setTxError('Enter a valid margin amount');
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
      return;
    }
    if (!cfdSettlementToken) {
      setTxError('Select margin token (USD/EUR)');
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
      return;
    }
    const amountNum = parseFloat(amt);
    try {
      if (isDemoMode && demo?.updateDemoAccount) {
        const current = demo.demoAccount || {};
        const vaultBalances = { ...(current.vaultBalances || {}) };
        const symbol = symbolForAddress(getCfdMarginOptions(), cfdSettlementToken);
        if (symbol) {
          const cur = parseFloat(vaultBalances[symbol] || '0');
          if (cur < amountNum) {
            setTxError('Insufficient demo balance. Use "Reset demo balance" above to get 10,000 USDT.');
            setTxPendingDemo(false);
            return;
          }
          vaultBalances[symbol] = String(Math.max(0, cur - amountNum));
        }
        const marginWei = ethers.utils.parseUnits(amt, cfdDecimals);
        const assetLabel = configuredCFDAssets.find((a) => a.id === cfdAssetId)?.label || `Asset ${cfdAssetId}`;

        // Fetch real entry price – fallback la DEMO_CFD_ENTRY_PRICES doar dacă API e down
        let entryPrice = null;
        try {
          entryPrice = await getCurrentPriceForAsset?.(cfdAssetId);
        } catch (_) {}
        if (entryPrice == null || entryPrice <= 0) {
          entryPrice = DEMO_CFD_ENTRY_PRICES[cfdAssetId] ?? 1;
        }

        const entryWei = ethers.utils.parseEther(entryPrice.toFixed(6));
        const leverageNum = Number(cfdLeverageBps) / BPS_DENOMINATOR;
        const notional = parseFloat(amt) * leverageNum;
        const tpPct = 0.02;
        const slPct = 0.01;
        const takeProfit = cfdIsLong ? entryPrice * (1 + tpPct) : entryPrice * (1 - tpPct);
        const stopLoss = cfdIsLong ? entryPrice * (1 - slPct) : entryPrice * (1 + slPct);
        const newPosition = {
          type: 'cfd',
          positionId: `demo-cfd-${Date.now()}`,
          asset: cfdAssetId,
          assetLabel,
          settlementToken: cfdSettlementToken,
          marginAmount: marginWei.toString(),
          marginAmountHuman: amt,
          leverageRatio: cfdLeverageBps.toString(),
          leverageBps: cfdLeverageBps.toString(),
          isLong: cfdIsLong,
          entryPrice: entryWei.toString(),
          entryPriceHuman: entryPrice,
          takeProfitHuman: takeProfit,
          stopLossHuman: stopLoss,
          notional,
          isActive: true,
        };
        const allPositions = [...(current.positions || []), newPosition];
        await demo.updateDemoAccount({ vaultBalances, positions: allPositions });
        emitLeverageActivity({
          scope: 'demo',
          kind: LEVERAGE_ACTIVITY_KIND.DEMO_CFD_OPEN,
          phase: 'confirmed',
          positionId: newPosition.positionId,
          side: cfdIsLong ? 'long' : 'short',
          amountLabel: amt,
          at: new Date().toISOString(),
        });
        setCfdAmount('');
      } else {
        const marginWei = ethers.utils.parseUnits(amt, cfdDecimals);
        const OPEN_CFD_TIMEOUT_MS = 120000;
        const openPromise = openCFDPosition(cfdAssetId, cfdSettlementToken, marginWei, cfdLeverageBps, cfdIsLong);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout. Confirm the transaction in your wallet (MetaMask). If you already did, check BSCScan for status.')), OPEN_CFD_TIMEOUT_MS)
        );
        await Promise.race([openPromise, timeoutPromise]);
        setCfdAmount('');
      }
    } catch (e) {
      setTxError(normalizeTxError(e).userMessage);
    } finally {
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
    }
  }, [cfdAmount, cfdSettlementToken, cfdAssetId, cfdLeverageBps, cfdIsLong, cfdDecimals, BPS_DENOMINATOR, openCFDPosition, isDemoMode, demo, configuredCFDAssets, liveTradingBlocked, gate]);

  const handleCloseCFD = useCallback(async (positionId) => {
    setTxError(null);
    if (!isDemoMode && liveTradingBlocked) {
      setTxError(liveTradingGateMessage(gate));
      return;
    }
    if (isDemoMode) setTxPendingDemo(true); else setTxPendingReal(true);
    try {
      if (isDemoMode && demo?.updateDemoAccount) {
        const current = demo.demoAccount || {};
        const pos = (current.positions || []).find((p) => p.positionId === positionId && p.type === 'cfd');
        const vaultBalances = { ...(current.vaultBalances || {}) };
        const posMarginDecimals = getTokenDecimals?.(pos?.settlementToken) ?? 18;
        const marginBack = ethers.utils.formatUnits(pos?.marginAmount || '0', posMarginDecimals);
        const marginNum = parseFloat(marginBack);
        const entryPrice = Number(pos?.entryPriceHuman ?? pos?.entryPrice ?? 0) || 1;
        let currentPrice = entryPrice;
        try {
          const fetched = await getCurrentPriceForAsset?.(pos?.asset);
          if (fetched != null && Number(fetched) > 0) currentPrice = Number(fetched);
        } catch (_) {}
        const pnlPct = entryPrice > 0 ? (currentPrice - entryPrice) / entryPrice : 0;
        // PnL = margin * leverage * price_change_pct (leverage amplifies gains AND losses)
        const posLeverageMultiplier = Number(pos?.leverageRatio ?? pos?.leverageBps ?? BPS_DENOMINATOR) / BPS_DENOMINATOR;
        const pnlNum = pos?.isLong
          ? marginNum * posLeverageMultiplier * pnlPct
          : -marginNum * posLeverageMultiplier * pnlPct;
        if (pos?.settlementToken) {
          const symbol = symbolForAddress(getCfdMarginOptions(), pos.settlementToken);
          if (symbol) {
            const cur = parseFloat(vaultBalances[symbol] || '0');
            vaultBalances[symbol] = String(cur + marginNum + pnlNum);
          }
        }
        const positions = (current.positions || []).filter((p) => p.positionId !== positionId);
        await demo.updateDemoAccount({ vaultBalances, positions });
        emitLeverageActivity({
          scope: 'demo',
          kind: LEVERAGE_ACTIVITY_KIND.DEMO_CFD_CLOSE,
          phase: 'confirmed',
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
      } else {
        await closeCFDPosition(positionId);
      }
    } catch (e) {
      setTxError(normalizeTxError(e).userMessage);
    } finally {
      if (isDemoMode) setTxPendingDemo(false); else setTxPendingReal(false);
    }
  }, [closeCFDPosition, isDemoMode, demo, getTokenDecimals, getCurrentPriceForAsset, liveTradingBlocked, gate]);

  const handleSpotAddCollateral = useCallback(
    async (positionId, amountHuman, callbacks = {}) => {
      const { onSuccess } = callbacks;
      setTxError(null);
      if (isDemoMode) return;
      if (liveTradingBlocked) {
        setTxError(liveTradingGateMessage(gate));
        return;
      }
      const pos = positions.find((p) => String(p.positionId) === String(positionId));
      if (!pos) {
        setTxError('Position not found');
        return;
      }
      setTxPendingReal(true);
      try {
        const dec = getTokenDecimals(pos.collateralToken);
        const v = validateSpotAddCollateral(amountHuman, dec, vaultBalanceMap[pos.collateralToken] || '0');
        if (!v.ok) {
          setTxError(v.error);
          return;
        }
        await addCollateral(positionId, v.amountWei);
        fetchVaultBalances?.();
        onSuccess?.();
      } catch (e) {
        setTxError(normalizeTxError(e).userMessage);
      } finally {
        setTxPendingReal(false);
      }
    },
    [isDemoMode, liveTradingBlocked, gate, positions, vaultBalanceMap, getTokenDecimals, addCollateral, fetchVaultBalances],
  );

  const handleSpotRemoveCollateral = useCallback(
    async (positionId, amountHuman, callbacks = {}) => {
      const { onSuccess } = callbacks;
      setTxError(null);
      if (isDemoMode) return;
      if (liveTradingBlocked) {
        setTxError(liveTradingGateMessage(gate));
        return;
      }
      const pos = positions.find((p) => String(p.positionId) === String(positionId));
      if (!pos) {
        setTxError('Position not found');
        return;
      }
      setTxPendingReal(true);
      try {
        const dec = getTokenDecimals(pos.collateralToken);
        const v = validateSpotRemoveCollateral(amountHuman, dec, pos.collateralAmount || '0');
        if (!v.ok) {
          setTxError(v.error);
          return;
        }
        await removeCollateral(positionId, v.amountWei);
        fetchVaultBalances?.();
        onSuccess?.();
      } catch (e) {
        setTxError(normalizeTxError(e).userMessage);
      } finally {
        setTxPendingReal(false);
      }
    },
    [isDemoMode, liveTradingBlocked, gate, positions, getTokenDecimals, removeCollateral, fetchVaultBalances],
  );

  const handleVaultBalanceChange = useCallback(() => {
    fetchVaultBalances?.();
  }, [fetchVaultBalances]);

  return {
    contractReady: contractReady || isDemoMode,
    spotAvailable: isDemoMode ? true : spotAvailable,
    activeTab,
    setActiveTab,
    collateralToken,
    setCollateralToken,
    borrowedToken,
    setBorrowedToken,
    amount,
    setAmount,
    leverageBps,
    setLeverageBps,
    txPendingDemo,
    txPendingReal,
    txError,
    cfdSettlementToken,
    setCfdSettlementToken,
    cfdAssetId,
    setCfdAssetId,
    configuredCFDAssets,
    cfdAmount,
    setCfdAmount,
    cfdLeverageBps,
    setCfdLeverageBps,
    cfdIsLong,
    setCfdIsLong,
    tokenOptions,
    cfdMarginOptions,
    vaultBalanceFormatted,
    cfdVaultBalanceFormatted,
    sameToken,
    handleMax,
    handleOpen,
    handleClose,
    handleCfdMax,
    handleOpenCFD,
    handleCloseCFD,
    handleVaultBalanceChange,
    positions,
    loading,
    cfdPositions,
    isConnected,
    connectWallet,
    BPS_DENOMINATOR,
    getTokenDecimals,
    vaultBalanceMap,
    liveTradingBlocked,
    leverageChainGate: gate,
    handleSpotAddCollateral,
    handleSpotRemoveCollateral,
  };
}
