/**
 * Centralized ApplyAI Backend Configuration
 * Single source of truth for backend URL resolution and fallback.
 */

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';

/**
 * Normalizes and validates a backend URL:
 * - Ensures a fallback if empty or invalid
 * - Strips trailing slashes
 * - Forbids chrome-extension:// origins
 */
export function sanitizeBackendUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_BACKEND_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('chrome-extension://')) {
    return DEFAULT_BACKEND_URL;
  }

  // Remove trailing slashes
  return trimmed.replace(/\/+$/, '');
}
