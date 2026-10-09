import { SignJWT, jwtVerify } from "jose";

function khoaBiMat() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("Thiếu AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function kyToken(payload: Record<string, unknown>, het: string | number = "12h") {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(het).sign(khoaBiMat());
}

export async function docToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, khoaBiMat());
    return payload as T;
  } catch {
    return null;
  }
}
