let apiUrl = import.meta.env.VITE_API_URL;

try {
  // Vite injects import.meta.env only in browser builds
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    apiUrl = import.meta.env.VITE_API_BASE_URL;
  }
} catch {
  // ignore if import.meta is not defined (e.g., Jest, Node)
}

export const API_BASE_URL = apiUrl;