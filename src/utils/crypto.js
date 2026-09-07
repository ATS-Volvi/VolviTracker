/**
 * SHA-256 password hashing utility using Web Crypto API.
 * Works seamlessly in both browser and modern JavaScript runtime environments.
 */
export async function hashPassword(password) {
  if (!password) return '';
  try {
    const subtle = (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) ||
                   (typeof window !== 'undefined' && window.crypto?.subtle);

    if (subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if subtle crypto is unavailable
  }

  // Simple deterministic fallback for legacy environments
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

// Pre-computed SHA-256 for default demo password 'password123'
export const DEFAULT_DEMO_PASSWORD = 'password123';
export const DEFAULT_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
