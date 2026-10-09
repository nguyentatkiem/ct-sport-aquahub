"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Làm mới dữ liệu máy chủ định kỳ khi tab đang mở. */
export function LiveRefresh({ giay = 15 }: { giay?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, giay * 1000);
    return () => clearInterval(t);
  }, [router, giay]);
  return null;
}
