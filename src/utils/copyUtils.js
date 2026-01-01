/**
 * Utility functions for copying text to clipboard
 */

/**
 * Copy text to clipboard with user feedback
 * @param {string} text - Text to copy
 * @param {Function} onSuccess - Optional success callback
 * @param {Function} onError - Optional error callback
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text, onSuccess, onError) => {
  if (!text) {
    if (onError) onError("No text to copy");
    return false;
  }

  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (onSuccess) onSuccess(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        if (onSuccess) onSuccess(text);
        return true;
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      document.body.removeChild(textArea);
      throw err;
    }
  } catch (error) {
    console.warn("Failed to copy to clipboard:", error);
    if (onError) onError(error.message || "Failed to copy");
    return false;
  }
};

/**
 * Copy wallet address with toast notification
 * @param {string} address - Wallet address to copy
 * @param {Function} showToast - Optional toast notification function
 */
export const copyWalletAddress = async (address, showToast) => {
  if (!address) {
    if (showToast) showToast("No wallet address to copy", "error");
    return false;
  }

  const success = await copyToClipboard(
    address,
    (copiedText) => {
      if (showToast) {
        showToast(`Copied: ${copiedText.slice(0, 6)}...${copiedText.slice(-4)}`, "success");
      } else {
        // Fallback: simple alert if no toast function provided
        if (process.env.NODE_ENV !== 'production') {
          console.log("Copied:", copiedText);
        }
      }
    },
    (error) => {
      if (showToast) {
        showToast("Failed to copy address", "error");
      }
    }
  );

  return success;
};

