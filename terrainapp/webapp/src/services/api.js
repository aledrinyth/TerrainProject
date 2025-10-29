// src/services/apiRequest.js 
import { auth } from '../../firebase';

// NOTE:swap this to read from env if desired
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Try to get Firebase ID token
  let authHeaders = {};
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      authHeaders.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn("Could not get auth token:", error);
    }
  }

  // Spread options first so our merged headers (set after) don't get overwritten
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // If server returns no content, avoid json() error
    const contentType = response.headers?.get?.('Content-Type') || '';
    if (response.status === 204 || !contentType.includes('application/json')) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

export default API_BASE_URL;