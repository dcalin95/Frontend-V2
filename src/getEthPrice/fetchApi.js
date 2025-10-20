// Configurare pentru URL-ul backend-ului
const API_URL = "https://backend-server-f82y.onrender.com"; // Backend Render URL

/**
 * Funcție generică pentru cereri API
 * @param {string} url - Endpoint-ul (ex: "/api/referral/generate-code")
 * @param {string} method - Metoda HTTP (ex: "GET", "POST", "PUT", "DELETE")
 * @param {Object} [body] - Corpul cererii (pentru metode precum POST sau PUT)
 * @returns {Promise<Object>} - Răspunsul parsat în format JSON
 */
const fetchApi = async (url, method, body = null) => {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body); // Adaugă corpul cererii dacă există
    }

    try {
        const response = await fetch(`${API_URL}${url}`, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Eroare necunoscută la API");
        }

        return await response.json(); // Parsează răspunsul în format JSON
    } catch (error) {
        console.error(`❌ Eroare la cererea API (${method} ${url}):`, error.message);
        throw error; // Propagă eroarea pentru a putea fi gestionată mai sus
    }
};

export default fetchApi;

