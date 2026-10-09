import QRCode from "qrcode";
import { headers } from "next/headers";

export async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function qrSvg(text: string, margin = 1) {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin, color: { dark: "#0f2a5fff", light: "#ffffffff" } });
}
