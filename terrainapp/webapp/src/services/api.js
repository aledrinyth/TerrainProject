//const logger = require("../logger.js")

//const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:6969/api"; // no .env file yet, but needed later after local dev
const API_BASE_URL = "http://localhost:6969/api";

export const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
};

export default API_BASE_URL;