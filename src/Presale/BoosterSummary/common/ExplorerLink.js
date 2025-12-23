import { useEffect, useState } from "react";
import { ethers } from "ethers";

const ExplorerLink = ({ walletAddress }) => {
  const [explorerUrl, setExplorerUrl] = useState("");

  useEffect(() => {
    const detectExplorer = async () => {
      if (!walletAddress) return;
      // 🛑 READ-ONLY: do not touch window.ethereum; default to BSC explorer for this app
      const chainId = 56;

      let baseUrl;

      switch (chainId) {
        case 1:
          baseUrl = "https://etherscan.io"; break;
        case 56:
          baseUrl = "https://bscscan.com"; break;
        case 137:
          baseUrl = "https://polygonscan.com"; break;
        case 42161:
          baseUrl = "https://arbiscan.io"; break;
        case 43114:
          baseUrl = "https://snowtrace.io"; break;
        case 97:
          baseUrl = "https://testnet.bscscan.com"; break;
        case 5:
          baseUrl = "https://goerli.etherscan.io"; break;
        default:
          baseUrl = ""; break;
      }

      if (baseUrl) {
        setExplorerUrl(`${baseUrl}/address/${walletAddress}`);
      }
    };

    detectExplorer();
  }, [walletAddress]);

  if (!explorerUrl) return null;

  return (
    <div style={{ fontSize: "11px", marginTop: "4px" }}>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#00ffff",
          textDecoration: "underline",
          fontSize: "10px",
        }}
      >
        🔗 View Wallet on Explorer
      </a>
    </div>
  );
};

export default ExplorerLink;
