import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { tokenNgauNhien } from "@/lib/text";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

/** Mã thiết bị ẩn danh (cookie) + IP — dùng cho giới hạn tra cứu. */
export async function khoaThietBi() {
  const c = await cookies();
  let dev = c.get("cts_dev")?.value;
  if (!dev) {
    dev = tokenNgauNhien(16);
    c.set("cts_dev", dev, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400 });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  return { dev, ip };
}
