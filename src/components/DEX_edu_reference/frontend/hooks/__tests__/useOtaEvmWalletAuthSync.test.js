/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useOtaEvmWalletAuthSync } from '../useOtaEvmWalletAuthSync';
import { useWallet } from '../../../context/WalletContext.jsx';
import {
  ensureOtaWalletForApiIfNeeded,
  clearOtaWalletSession,
} from '../../utils/otaWalletSession';

jest.mock('../../../context/WalletContext.jsx', () => ({
  useWallet: jest.fn(),
}));

jest.mock('../../utils/otaWalletSession', () => ({
  ensureOtaWalletForApiIfNeeded: jest.fn().mockResolvedValue(undefined),
  clearOtaWalletSession: jest.fn(),
}));

const BASE_WALLET = {
  isConnected: true,
  walletAddress: '0x1111111111111111111111111111111111111111',
  walletType: 'EVM',
  signer: { provider: 'mock' },
};

describe('useOtaEvmWalletAuthSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWallet.mockReturnValue(BASE_WALLET);
  });

  it('ensure o singură dată pe mount pentru wallet EVM conectat', async () => {
    renderHook(() => useOtaEvmWalletAuthSync());

    await waitFor(() => {
      expect(ensureOtaWalletForApiIfNeeded).toHaveBeenCalledTimes(1);
    });

    expect(ensureOtaWalletForApiIfNeeded).toHaveBeenCalledWith(
      BASE_WALLET.signer,
      BASE_WALLET.walletAddress.toLowerCase(),
    );
  });

  it('invalidarea OTA din fundal nu relansează automat MetaMask ensure', async () => {
    renderHook(() => useOtaEvmWalletAuthSync());

    await waitFor(() => {
      expect(ensureOtaWalletForApiIfNeeded).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new CustomEvent('bits:ota-wallet-session-invalid'));

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(ensureOtaWalletForApiIfNeeded).toHaveBeenCalledTimes(1);
    expect(clearOtaWalletSession).not.toHaveBeenCalled();
  });

  it('curăță sesiunea când wallet-ul se deconectează după ce fusese activ', async () => {
    const { rerender } = renderHook(() => useOtaEvmWalletAuthSync());

    await waitFor(() => {
      expect(ensureOtaWalletForApiIfNeeded).toHaveBeenCalledTimes(1);
    });

    useWallet.mockReturnValue({
      ...BASE_WALLET,
      isConnected: false,
      walletAddress: null,
      signer: null,
    });

    rerender();

    expect(clearOtaWalletSession).toHaveBeenCalledTimes(1);
  });
});
