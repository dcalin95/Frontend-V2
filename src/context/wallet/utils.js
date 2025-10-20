/**
 * Displays a custom confirmation modal with "Confirm" and "Cancel" buttons.
 * @param {string} message - The message to display in the modal.
 * @returns {Promise<boolean>} - Resolves to true if the user clicks "Confirm", false otherwise.
 */
export const showCustomConfirm = (message) => {
  return new Promise((resolve) => {
    // Create the modal container
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";
    modal.style.backdropFilter = "blur(5px)";

    // Create the modal content with space theme
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 2px solid #3b99fc;
        position: relative;
        overflow: hidden;">
        
        <!-- Animated background -->
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 153, 252, 0.1) 0%, transparent 70%);
          animation: rotate 10s linear infinite;
          z-index: -1;"></div>
        
        <div style="
          position: relative;
          z-index: 1;">
          
          <!-- Icon -->
          <div style="
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background: linear-gradient(45deg, #3b99fc, #0052ff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 15px rgba(59, 153, 252, 0.3);">
            🔗
          </div>
          
          <!-- Message -->
          <p style="
            margin-bottom: 25px; 
            font-size: 16px; 
            color: #ffffff;
            line-height: 1.5;
            font-family: 'Arial', sans-serif;">${message}</p>
          
          <!-- Buttons -->
          <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="confirm-yes" style="
              background: linear-gradient(45deg, #3b99fc, #0052ff);
              color: white;
              padding: 12px 25px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              font-size: 14px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(59, 153, 252, 0.3);">Install Wallet</button>
            <button id="confirm-no" style="
              background: transparent;
              color: #ffffff;
              padding: 12px 25px;
              border: 2px solid #666;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              font-size: 14px;
              transition: all 0.3s ease;">Cancel</button>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        #confirm-yes:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 153, 252, 0.4);
        }
        
        #confirm-no:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #3b99fc;
        }
      </style>
    `;

    // Append the modal to the document body
    document.body.appendChild(modal);

    // Event listeners for the buttons
    document.getElementById("confirm-yes").addEventListener("click", () => {
      resolve(true);
      document.body.removeChild(modal);
    });

    document.getElementById("confirm-no").addEventListener("click", () => {
      resolve(false);
      document.body.removeChild(modal);
    });
  });
};

/**
 * Utility function to check if a wallet is installed.
 * @param {string} walletName - The name of the wallet to check (e.g., "MetaMask", "Phantom").
 * @returns {boolean} - Returns true if the wallet is installed, false otherwise.
 */
export const isWalletInstalled = (walletName) => {
  switch (walletName) {
    case "MetaMask":
      return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
    case "Phantom":
      return typeof window.solana !== "undefined" && window.solana.isPhantom;
    default:
      return false;
  }
};

/**
 * Utility function to format wallet addresses.
 * @param {string} address - The wallet address to format.
 * @param {number} [chars=6] - Number of characters to show at the start and end of the address.
 * @returns {string} - Formatted wallet address (e.g., "0x123...789").
 */
export const formatWalletAddress = (address, chars = 6) => {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Opens a URL in a new browser tab.
 * @param {string} url - The URL to open.
 */
export const openExternalLink = (url) => {
  window.open(url, "_blank");
};

