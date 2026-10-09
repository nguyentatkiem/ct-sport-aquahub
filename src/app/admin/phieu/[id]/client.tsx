"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

/** Vẽ phiếu ra ảnh PNG bằng canvas (dùng font hệ thống, hiển thị đúng tiếng Việt). */
function taiPng(tieuDe: string, dong: [string, string][], huy: boolean, ma: string) {
  const W = 640;
  const lh = 34;
  const H = 150 + dong.length * lh + 60;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#0f2a5f";
  g.textAlign = "center";
  g.font = "bold 30px system-ui, sans-serif";
  g.fillText(tieuDe, W / 2, 56);
  g.font = "600 24px system-ui, sans-serif";
  g.fillText("PHIẾU THU" + (huy ? " (ĐÃ HUỶ)" : ""), W / 2, 96);
  let y = 150;
  for (const [k, v] of dong) {
    g.textAlign = "left";
    g.font = "22px system-ui, sans-serif";
    g.fillStyle = "#4a5f80";
    g.fillText(k, 32, y);
    g.textAlign = "right";
    g.font = "bold 22px system-ui, sans-serif";
    g.fillStyle = "#0f2a5f";
    g.fillText(v.length > 34 ? v.slice(0, 33) + "…" : v, W - 32, y);
    g.strokeStyle = "#dfe9f3";
    g.beginPath();
    g.moveTo(32, y + 12);
    g.lineTo(W - 32, y + 12);
    g.stroke();
    y += lh;
  }
  g.textAlign = "center";
  g.font = "18px system-ui, sans-serif";
  g.fillStyle = "#7d8fa9";
  g.fillText("Phiếu thu nội bộ, không phải hoá đơn GTGT.", W / 2, y + 30);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `${ma}.png`;
  a.click();
}

export function PhieuActions({ tieuDe, dong, huy, ma }: { tieuDe: string; dong: [string, string][]; huy: boolean; ma: string }) {
  return (
    <div className="no-print flex gap-2">
      <PrintButton label="In khổ 80mm" />
      <Button variant="secondary" onClick={() => taiPng(tieuDe, dong, huy, ma)}>
        <Download className="size-4" /> Tải ảnh PNG
      </Button>
    </div>
  );
}
