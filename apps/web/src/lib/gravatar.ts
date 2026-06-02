/**
 * Generates a Gravatar URL for a given email.
 * @param email The user's email address.
 * @param size The size of the image in pixels (default: 200).
 * @returns The Gravatar URL.
 */
export async function getGravatarUrl(email: string, size: number = 200): Promise<string> {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Use SHA-256 for Gravatar (they support MD5, but SHA-256 is preferred now)
  // Actually Gravatar traditionally uses MD5. Let's use MD5 if available.
  // If not, we'll use a simple hash or a library.
  
  // Since we are in a browser, we can use the Web Crypto API for SHA-256.
  const hash = await sha256(trimmedEmail);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
