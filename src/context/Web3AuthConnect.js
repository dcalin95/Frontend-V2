// src/context/Web3AuthConnect.js
import { Web3Auth } from "@web3auth/web3auth";
import { ethers } from "ethers";

// 🔑 Client ID Web3Auth (produs de tine)
const clientId = "BES8kujJeBgfBvVa1a9TLtNGuKUqVFTIXGfgOlEyB4sJv51AxncNougD4ImDK6qYVWVjGYtrrRBO5MKteOzmdA8";

// Web3Auth singleton
let web3auth = null;

export const initWeb3Auth = async () => {
  if (web3auth) return;

  web3auth = new Web3Auth({
    clientId,
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x61", // BSC Testnet
      rpcTarget: "https://data-seed-prebsc-1-s1.binance.org:8545/", // BSC TESTNET endpoint
    },
  });

  await web3auth.initModal();
};

export const loginWithWeb3Auth = async () => {
  try {
    await initWeb3Auth();
    const provider = await web3auth.connect();

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      signer,
      provider,
      web3auth,
    };
  } catch (err) {
    console.error("Web3Auth login error:", err);
    throw err;
  }
};

export const logoutWeb3Auth = async () => {
  if (web3auth) {
    await web3auth.logout();
    web3auth = null;
  }
};

