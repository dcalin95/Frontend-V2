import {
  FIAT_BNB_DESTINATION,
  FIAT_CONVERT_WALLET_VS_VAULT,
  FIAT_CONVERT_UI_COPY,
} from '../fiatConvertExecutionModel';

describe('fiatConvertExecutionModel (wallet vs vault SSOT)', () => {
  test('destinația BNB este wallet user, nu vault implicit', () => {
    expect(FIAT_BNB_DESTINATION).toBe('user_bsc_wallet');
    expect(FIAT_CONVERT_WALLET_VS_VAULT.bnbGoesToUserWallet).toBe(true);
    expect(FIAT_CONVERT_WALLET_VS_VAULT.usdtGoesToUserWallet).toBe(true);
    expect(FIAT_CONVERT_WALLET_VS_VAULT.vaultRequiresSeparateDeposit).toBe(true);
  });

  test('copy UI nu pretinde UserVault ca destinație directă', () => {
    const h = FIAT_CONVERT_UI_COPY.headline.toLowerCase();
    expect(h.includes('uservault') && h.includes('not')).toBe(true);
    expect(FIAT_CONVERT_UI_COPY.depositCtaPath).toBe('/dex-edu/leverage?tab=deposit');
    expect(FIAT_CONVERT_UI_COPY.walletArrivalLine.toLowerCase()).toContain('wallet');
    expect(FIAT_CONVERT_UI_COPY.notInVaultYetLine.toLowerCase()).toContain('not');
    expect(FIAT_CONVERT_UI_COPY.depositCtaLabel.toLowerCase()).toContain('deposit');
    expect(FIAT_CONVERT_UI_COPY.submitSuccessToast.toLowerCase()).toContain('wallet');
    expect(FIAT_CONVERT_UI_COPY.submitSuccessToast.toLowerCase()).toContain('not');
    expect(FIAT_CONVERT_UI_COPY.submitSuccessToastUsdt.toLowerCase()).toContain('usdt');
    expect(FIAT_CONVERT_UI_COPY.completedUsdtWalletLine.toLowerCase()).toContain('not into uservault');
  });
});
