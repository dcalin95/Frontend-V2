// === Importuri necesare ===
const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-eu.onrender.com"; // Preluăm URL-ul din variabilele de mediu
console.log(`ℹ️ API_URL set to: ${API_URL}`); // Log pentru debugging

// === Rutele API centralizate ===
const API_ROUTES = {
  generateReferral: "/api/referral/generate",
  getReferralStats: (wallet) => `/api/referral/stats/${wallet}`,
  getTransactions: (wallet) => `/api/staking/transactions/${wallet}`,
  verifyCode: "/api/telegram/verify",
  saveWallet: "/api/referral/save-wallet",
  getOrGenerateCode: "/api/telegram/get-code",
};

// === Helper pentru log ===
const log = (...args) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
};

// === Helper pentru cereri API cu timeout ===
const fetchWithTimeout = (url, options, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    ),
  ]);
};

// === Helper pentru cereri API ===
const fetchApi = async (url, method, body = null, timeout = 5000) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  log(`🔗 Sending API request: ${method} ${API_URL}${url}`, body);

  try {
    const response = await fetchWithTimeout(`${API_URL}${url}`, options, timeout);

    log(`ℹ️ Response status: ${response.status} (${response.statusText})`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response: ${errorText}`);
      throw new Error(errorText);
    }

    const data = await response.json();
    log(`✅ API Response:`, data);

    return data;
  } catch (error) {
    console.error(`❌ API Error (${method} ${url}):`, error.message);
    throw error;
  }
};

// === Helper pentru apeluri API cu mesaje ===
const apiRequest = async (
  url,
  method,
  body = null,
  successMessage = "",
  errorMessage = "",
  timeout = 5000
) => {
  try {
    const result = await fetchApi(url, method, body, timeout);

    if (successMessage) {
      log(`✅ ${successMessage}`, result);
    }

    return result;
  } catch (error) {
    if (errorMessage) {
      console.error(`❌ ${errorMessage}:`, error.message);
    }

    throw error;
  }
};

// === Validare input ===
const validateInput = (input, name) => {
  if (!input || typeof input !== "string") {
    throw new Error(`Invalid ${name} provided`);
  }
};

// === Funcție: Generarea linkului de invitație ===
export const generateReferralLink = async (walletAddress) => {
  // Validăm input-ul
  validateInput(walletAddress, "walletAddress");
  log(`ℹ️ Generating referral link for walletAddress: ${walletAddress}`);

  // Facem cererea către API
  log(`📤 Sending request to ${API_ROUTES.generateReferral} with payload:`, { walletAddress });
  
  return apiRequest(
    API_ROUTES.generateReferral,
    "POST",
    { walletAddress },
    "Referral link generated successfully!",
    "Failed to generate referral link"
  )
    .then((data) => {
      // Validăm răspunsul de la server
      if (!data || !data.referralLink) {
        throw new Error("Server response is missing the referralLink field.");
      }
      log(`🔗 Referral link received: ${data.referralLink}`);
      return data.referralLink;
    })
    .catch((error) => {
      // Gestionăm erorile
      console.error("❌ Error generating referral link:", error.message);
      throw error; // Propagăm eroarea pentru a fi gestionată la nivelul superior
    });
};


// === Funcție: Obținerea statisticilor utilizatorului ===
export const getReferralStats = async (walletAddress) => {
  validateInput(walletAddress, "walletAddress");
  log(`ℹ️ Fetching referral stats for walletAddress: ${walletAddress}`);
  return apiRequest(
    API_ROUTES.getReferralStats(walletAddress),
    "GET",
    null,
    "Referral stats fetched successfully!",
    "Failed to fetch referral stats"
  );
};

// === Funcție: Obținerea tranzacțiilor utilizatorului ===
export const getUserTransactions = async (walletAddress) => {
  validateInput(walletAddress, "walletAddress");
  log(`ℹ️ Fetching transactions for walletAddress: ${walletAddress}`);
  return apiRequest(
    API_ROUTES.getTransactions(walletAddress),
    "GET",
    null,
    "Transactions fetched successfully!",
    "Failed to fetch transactions"
  );
};

// === Funcție: Validarea codului de verificare ===
export const verifyCode = async (walletAddress, verificationCode) => {
  validateInput(walletAddress, "walletAddress");
  validateInput(verificationCode, "verificationCode");
  log(`ℹ️ Verifying code for walletAddress: ${walletAddress}`);
  return apiRequest(
    API_ROUTES.verifyCode,
    "POST",
    { walletAddress, verificationCode },
    "Verification successful!",
    "Failed to verify code"
  );
};

// === Funcție: Salvarea adresei wallet ===
export const saveWalletAddress = async (walletAddress, verificationCode) => {
  validateInput(walletAddress, "walletAddress");
  validateInput(verificationCode, "verificationCode");
  log(`ℹ️ Saving walletAddress: ${walletAddress} with verificationCode: ${verificationCode}`);
  return apiRequest(
    API_ROUTES.saveWallet,
    "POST",
    { walletAddress, verificationCode },
    "Wallet address saved successfully!",
    "Failed to save wallet address"
  ).then(() => true);
};

// === Funcție: Obține sau generează un cod de verificare pentru un wallet ===
export const getOrGenerateCode = async (walletAddress) => {
  validateInput(walletAddress, "walletAddress");
  log(`ℹ️ Fetching or generating code for walletAddress: ${walletAddress}`);
  return apiRequest(
    API_ROUTES.getOrGenerateCode,
    "POST",
    { walletAddress },
    "Verification code fetched or generated successfully!",
    "Failed to fetch or generate verification code"
  ).then((data) => {
    log(`🔑 Verification code received: ${data.verificationCode}`);
    return data.verificationCode;
  });
};
