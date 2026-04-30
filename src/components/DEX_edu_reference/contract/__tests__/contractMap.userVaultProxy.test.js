/**
 * UserVault proxy vs implementation — istoric / getLogs pe proxy.
 */
import { ethers } from 'ethers';

describe('getUserVaultProxyAddressForHistory', () => {
  it('dacă REACT_APP_USER_VAULT_ADDRESS indică implementation, returnează proxy canonic', () => {
    jest.resetModules();
    process.env.REACT_APP_USER_VAULT_ADDRESS = '0x1ea23e21eb33204fd0df3437107573939dca5cfa';
    const mod = require('../contractMap.js');
    const addr = mod.getUserVaultProxyAddressForHistory();
    expect(addr).toBe(ethers.utils.getAddress(mod.USER_VAULT_PROXY_DEFAULT_BSC));
    expect(addr.toLowerCase()).not.toBe(
      ethers.utils.getAddress('0x1ea23e21eb33204fd0df3437107573939dca5cfa').toLowerCase()
    );
  });
});
