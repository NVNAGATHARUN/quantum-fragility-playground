const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

/**
 * Resolve every backend request through one deployment-aware origin.
 *
 * Local development and Docker use same-origin `/api` requests. Split hosting
 * (for example, a static frontend with a Render backend) sets
 * `VITE_API_BASE_URL=https://api.example.org` at build time.
 */
export const API_BASE_URL = configuredBase.replace(/\/$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
