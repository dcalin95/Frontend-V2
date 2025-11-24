import React, { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Lock, Wallet, Coins, Timer, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import './DEX.css';
import './StakeVault.css';
import './StakeVault.css';
import bitsLogo from '../../assets/logo.png';
import WalletContext from '../../context/WalletContext';
import { useStakingData } from '../../Staking/useStakingData';
import { CONTRACT_MAP } from '../../contract/contractMap';
import stakingABI from '../../abi/stakingABI';

const StakeVault = ({ layout = 'desktop' }) => {
  const { signer, walletAddress, bitsBalance } = useContext(WalletContext);
  const { stakes, totalStaked, totalReward } = useStakingData(signer, walletAddress);

  console.log('🔍 [StakeVault] Render Debug:');
  console.log('  - signer:', signer);
  console.log('  - walletAddress:', walletAddress);
  console.log('  - bitsBalance:', bitsBalance);
  console.log('  - stakes:', stakes);
  console.log('  - totalStaked:', totalStaked);
  console.log('  - totalReward:', totalReward);

  // State pentru staking form
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [apr, setApr] = useState('0');
  const [loading, setLoading] = useState(false);

  // ✅ Sync balance from Context (instant display)
  useEffect(() => {
    if (bitsBalance) {
      console.log('✅ Balance synced from Context:', bitsBalance);
      setBalance(bitsBalance);
    }
  }, [bitsBalance]);

  const formatBits = (valueBN) => {
    try {
      return parseFloat(ethers.utils.formatUnits(valueBN || 0, 18));
    } catch (_) {
      return 0;
    }
  };

  const totalStakedBits = formatBits(totalStaked);
  const totalRewardBits = formatBits(totalReward);

  // ✅ Fetch APR (Robust Fallback)
  useEffect(() => {
    const fetchAPR = async () => {
      try {
        let provider = signer;
        if (!provider) {
            // Fallback to public RPC if wallet not connected
            provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
        }
        const contract = new ethers.Contract(CONTRACT_MAP.STAKING.address, stakingABI, provider);
        const rawApr = await contract.currentAPR();
        setApr(rawApr.toString());
        console.log('✅ APR fetched:', rawApr.toString());
      } catch (err) {
        console.error('Error fetching APR:', err);
        setApr('0'); // Reset on error
      }
    };
    fetchAPR();
  }, [signer]); // Re-fetch when signer becomes available

  // ✅ Handle Stake
  const handleStake = async () => {
    if (!signer || !walletAddress || !amount) {
      toast.error('Please enter an amount and connect wallet');
      return;
    }

    setLoading(true);
    try {
      const amtWei = ethers.utils.parseUnits(amount, 18);
      const contract = new ethers.Contract(CONTRACT_MAP.STAKING.address, stakingABI, signer);
      const token = new ethers.Contract(CONTRACT_MAP.BITS_TOKEN.address, CONTRACT_MAP.BITS_TOKEN.abi, signer);

      // Check allowance
      const allowance = await token.allowance(walletAddress, contract.address);
      if (allowance.lt(amtWei)) {
        toast.info('Approving token...');
        const txApprove = await token.approve(contract.address, amtWei);
        await txApprove.wait();
        toast.success('Approved!');
      }

      toast.info('Staking...');
      const txStake = await contract.stake(amtWei);
      await txStake.wait();
      toast.success('Staked successfully!');
      setAmount('');

      // Refresh balance
      const raw = await token.balanceOf(walletAddress);
      setBalance(ethers.utils.formatUnits(raw, 18));
    } catch (err) {
      toast.error(err.message || 'Staking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`dex-stake-container ${layout === 'mobile' ? 'stake-mobile' : 'stake-desktop'}`}>
        {console.log('🎨 [StakeVault] Rendering JSX...')}
        <div className="dex-stake-header">
            <h2 className="section-title">
                <img
                    src={bitsLogo}
                    alt="BITS"
                    style={{ width: 28, height: 28, marginRight: 8 }}
                />
                <span className="solana-gradient-text">BITS</span> Staking Vault
            </h2>
            <p className="section-subtitle">
                Lock your <span className="solana-gradient-text">$BITS</span> to earn ecosystem rewards. Powered by the live staking smart contract from <a href="/staking" style={{color:'#00FFA3', textDecoration:'none'}}>Staking Hub</a>.
            </p>
        </div>

        <div className="dex-stake-card">
            <div className="dex-stake-card-head">
                <span className="dex-stake-label">Vault Status</span>
                <div className="dex-stake-apy">85.4%</div>
                <span className="dex-stake-card-subtitle">Dynamic APY • Auto-Compounding</span>
            </div>

            <ul className="dex-stake-meta-list">
                <li className="dex-stake-meta-item">
                    <span className="dex-stake-meta-label">
                        <Wallet size={14} style={{color: '#00FFA3', flexShrink: 0}} />
                        <span>Connected Wallet</span>
                    </span>
                    <span className="dex-stake-meta-value">
                        {walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                    </span>
                </li>
                <li className="dex-stake-meta-item">
                    <span className="dex-stake-meta-label">
                        <Lock size={14} style={{color: '#00FFA3', flexShrink: 0}} />
                        <span>Total Staked</span>
                    </span>
                    <span className="dex-stake-meta-value">
                        {totalStakedBits.toLocaleString(undefined,{maximumFractionDigits:2})}
                        {' '}
                        <span className="solana-gradient-text">BITS</span>
                    </span>
                </li>
                <li className="dex-stake-meta-item">
                    <span className="dex-stake-meta-label">
                        <Coins size={14} style={{color: '#00FFA3', flexShrink: 0}} />
                        <span>Rewards Accrued</span>
                    </span>
                    <span className="dex-stake-meta-value">
                        {totalRewardBits.toLocaleString(undefined,{maximumFractionDigits:2})}
                        {' '}
                        <span className="solana-gradient-text">BITS</span>
                    </span>
                </li>
                <li className="dex-stake-meta-item">
                    <span className="dex-stake-meta-label">
                        <Timer size={14} style={{color: '#00FFA3', flexShrink: 0}} />
                        <span>Unlock Period</span>
                    </span>
                    <span className="dex-stake-meta-value">Up to 7 Days</span>
                </li>
            </ul>
        </div>

        {!walletAddress && (
          <div className="dex-stake-alert">
              Connect your wallet to manage staking positions.
          </div>
        )}

        {/* Custom Staking Form - NO IMPORTS */}
        <div className="dex-stake-card">
            <div className="dex-stake-card-head">
                <span className="dex-stake-label">
                    <TrendingUp size={16} style={{color: '#00FFA3'}} /> Stake Tokens
                </span>
            </div>

            <div className="dex-stake-card-body">
                <div className="dex-stake-form-group">
                    <label className="dex-stake-form-label">
                        Amount to Stake
                    </label>
                    <div className="dex-stake-input-wrapper">
                        <input
                            type="number"
                            className="dex-stake-input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            disabled={loading}
                        />
                        <button
                            onClick={() => setAmount(balance)}
                            className="dex-stake-btn-max"
                        >
                            MAX
                        </button>
                    </div>
                    <div className="dex-stake-input-hint">
                        Available: {parseFloat(balance).toFixed(2)} BITS
                    </div>
                </div>

                <button
                    onClick={handleStake}
                    disabled={loading || !amount}
                    className="dex-stake-btn-primary"
                >
                    {loading ? 'Processing...' : `Stake ${amount || '0'} BITS`}
                </button>

                <div className="dex-stake-apr-box">
                    <div className="dex-stake-apr-label">Current APR</div>
                    <div className="dex-stake-apr-value">
                        {apr !== '0' ? `${parseFloat(ethers.utils.formatUnits(apr, 16)).toFixed(2)}%` : 'Loading...'}
                    </div>
                </div>
            </div>
        </div>

        {/* Active Stakes - Custom UI */}
        {stakes && stakes.length > 0 && (
            <div className="dex-stake-card" style={{marginTop: '24px'}}>
                <div className="dex-stake-card-head">
                    <span className="dex-stake-label">
                        <Clock size={16} style={{color: '#00FFA3'}} /> Your Active Stakes
                    </span>
                </div>

                <div className="dex-stake-positions-container">
                    {stakes.map((stake, index) => (
                        <div key={index} className="dex-stake-position-card">
                            <div className="dex-stake-position-header">
                                <span className="dex-stake-position-number">Position #{index + 1}</span>
                                <span className={stake.withdrawn ? 'dex-stake-badge dex-stake-badge-closed' : 'dex-stake-badge dex-stake-badge-active'}>
                                    {stake.withdrawn ? 'CLOSED' : 'ACTIVE'}
                                </span>
                            </div>
                            <div className="dex-stake-position-stats">
                                <div className="dex-stake-stat-item">
                                    <div className="dex-stake-stat-label">Staked</div>
                                    <div className="dex-stake-stat-value">
                                        {formatBits(stake.locked).toLocaleString()} BITS
                                    </div>
                                </div>
                                <div className="dex-stake-stat-item">
                                    <div className="dex-stake-stat-label">Rewards</div>
                                    <div className="dex-stake-stat-value dex-stake-stat-value-reward">
                                        {formatBits(stake.reward).toFixed(4)} BITS
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default StakeVault;

