import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";


export const WalletContext = createContext();

const clientId = "BES8kujJeBgfBvVa1a9TLtNGuKUqVFTIXGfgOlEyB4sJv51AxncNougD4ImDK6qYVWVjGYtrrRBO5MKteOzmdA8";

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState(0);
  const [bitsBalance, setBitsBalance] = useState(0);
  const [provider, setProvider] = useState(null);
  const [web3auth, setWeb3auth] = useState(null);

  useEffect(() => {
    const initWeb3Auth = async () => {
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1", // Ethereum Mainnet
        rpcTarget: "https://rpc.ankr.com/eth",
      };
  
      const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
  
      const w3a = new Web3Auth({
        clientId,
        web3AuthNetwork: "mainnet", // sau "testnet" pentru dev
        privateKeyProvider, // ⬅️ Aici legăm providerul
      });
  
      const openloginAdapter = new OpenloginAdapter({
        adapterSettings: {
          network: "mainnet", // sau "testnet"
        },
      });
  
      w3a.configureAdapter(openloginAdapter);
      await w3a.initModal();
      setWeb3auth(w3a);
    };
  
    initWeb3Auth();
  }, []);
  

  const getBalance = async (address, ethProvider) => {
    const balance = await ethProvider.getBalance(address);
    setEthBalance(ethers.utils.formatEther(balance));
    setBitsBalance(123456); // înlocuiește cu contractul real
  };

  const connectViaMetamask = async () => {
    if (!window.ethereum) {
      alert("Metamask nu este instalat!");
      return;
    }
    const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
    await ethProvider.send("eth_requestAccounts", []);
    const signer = ethProvider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);
    setProvider(ethProvider);
    getBalance(address, ethProvider);
  };

  const connectViaWeb3Auth = async () => {
    if (!web3auth) return;
    const web3authProvider = await web3auth.connect();
    const ethProvider = new ethers.providers.Web3Provider(web3authProvider);
    const signer = ethProvider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);
    setProvider(ethProvider);
    getBalance(address, ethProvider);
  };

  const disconnectWallet = async () => {
    setWalletAddress(null);
    setEthBalance(0);
    setBitsBalance(0);
    setProvider(null);
    if (web3auth) await web3auth.logout();
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        ethBalance,
        bitsBalance,
        connectViaMetamask,
        connectViaWeb3Auth,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;

