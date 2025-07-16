// Resolve the API base URL either from the Vite environment variable
// or fall back to the current origin. This avoids hardcoding a port
// when the frontend is served behind a proxy (e.g. Nginx or Vite).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');
