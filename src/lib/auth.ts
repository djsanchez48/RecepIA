async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let _cachedToken: string | null = null;

async function getExpectedToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;
  const password = process.env.ACCESS_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) throw new Error("ACCESS_PASSWORD y AUTH_SECRET son requeridos");
  _cachedToken = await hmacSha256(secret, password);
  return _cachedToken;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const expected = await getExpectedToken();
    return token === expected;
  } catch {
    return false;
  }
}

export async function createSessionToken(): Promise<string> {
  return getExpectedToken();
}

export function getAuthCookie(): string {
  return "recepia_session";
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
