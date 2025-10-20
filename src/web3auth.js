import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

const clientId = "BES8kujJeBgfBvVa1a9TLtNGuKUqVFTIXGfgOlEyB4sJv51AxncNougD4ImDK6qYVWVjGYtrrRBO5MKteOzmdA8";

let web3auth = null;

export const initWeb3Auth = async () => {
  web3auth = new Web3Auth({
    clientId,
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x1", // Ethereum mainnet
      rpcTarget: "https://rpc.ankr.com/eth",
    },
  });

  const adapter = new OpenloginAdapter({
    adapterSettings: {
      network: "mainnet", // can also be "testnet"
      uxMode: "popup",
    },
  });

  web3auth.configureAdapter(adapter);
  await web3auth.initModal();

  return web3auth;
};

export const connectWallet = async () => {
  if (!web3auth) throw new Error("Web3Auth is not initialized!");
  const provider = await web3auth.connect();
  return provider;
};

