import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { ethers } from "ethers";

const clientId = "BES8kujJeBgfBvVa1a9TLtNGuKUqVFTIXGfgOlEyB4sJv51AxncNougD4ImDK6qYVWVjGYtrrRBO5MKteOzmdA8";

let web3auth = null;

export const loginWithWeb3Auth = async () => {
  if (!web3auth) {
    web3auth = new Web3Auth({
      clientId,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x61", // BSC Testnet
        rpcTarget: "https://bsc-dataseed.binance.org/",
      },
    });

    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        uxMode: "popup",
        whiteLabel: {
          name: "BITS",
          logoLight: "https://bits-ai.io/logo512.png", // dacă ai un logo
          logoDark: "https://bits-ai.io/logo512.png",
          defaultLanguage: "en",
        },
      },
    });

    web3auth.configureAdapter(openloginAdapter);
    await web3auth.initModal();
  }

  if (!web3auth.connected) {
    await web3auth.connect();
  }

  const provider = new ethers.providers.Web3Provider(web3auth.provider);
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  const userInfo = await web3auth.getUserInfo();

  return { provider, address, signer, userInfo };
};

export const logoutWeb3Auth = async () => {
  if (web3auth && web3auth.connected) {
    await web3auth.logout();
  }
  web3auth = null;
};

