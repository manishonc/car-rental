import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TokenData {
  access_token: string;
  expires_at: number;
}

// Try to find token file in current directory or parent directory
// (Next.js runs from client/, but token cache is in project root)
function getTokenFilePath(): string {
  const currentDir = process.cwd();
  const currentPath = join(currentDir, '.token-cache.json');
  const parentPath = join(currentDir, '..', '.token-cache.json');
  
  // Check current directory first (for flexibility)
  if (existsSync(currentPath)) {
    return currentPath;
  }
  // Check parent directory (project root)
  if (existsSync(parentPath)) {
    return parentPath;
  }
  // Default to parent directory for new files
  return parentPath;
}

export function getStoredToken(): TokenData | null {
  try {
    const tokenFile = getTokenFilePath();
    if (!existsSync(tokenFile)) {
      console.log('[TokenStore] Token file not found at:', tokenFile);
      return null;
    }
    const data = readFileSync(tokenFile, 'utf-8');
    const token: TokenData = JSON.parse(data);

    // Check if token is still valid (with 1 minute buffer)
    if (token.expires_at) {
      // Handle both seconds (legacy) and milliseconds formats
      // If expires_at is less than 1e12, it's likely in seconds, convert to milliseconds
      const expiresAtMs = token.expires_at < 1e12 
        ? token.expires_at * 1000 
        : token.expires_at;
      
      const now = Date.now();
      const isValid = now < expiresAtMs;
      
      if (isValid) {
        console.log('[TokenStore] Token is valid, expires at:', new Date(expiresAtMs).toISOString());
        // Normalize to milliseconds format for consistency
        return {
          ...token,
          expires_at: expiresAtMs
        };
      } else {
        console.log('[TokenStore] Token expired. Now:', new Date(now).toISOString(), 'Expires:', new Date(expiresAtMs).toISOString());
      }
    }
    return null;
  } catch (error) {
    console.error('[TokenStore] Error reading token:', error);
    return null;
  }
}

export function storeToken(accessToken: string, expiresIn: number): void {
  try {
    const tokenFile = getTokenFilePath();
    const tokenData: TokenData = {
      access_token: accessToken,
      // Store expiry with 1 minute buffer
      expires_at: Date.now() + (expiresIn * 1000) - 60000,
    };
    writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
    console.log('[TokenStore] Token stored successfully, expires at:', new Date(tokenData.expires_at).toISOString());
  } catch (error) {
    console.error('[TokenStore] Error storing token:', error);
  }
}

export function getFallbackToken(): string | null {
  return process.env.RENTSYST_FALLBACK_TOKEN || null;
}
