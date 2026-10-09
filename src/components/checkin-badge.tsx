import { Badge } from "./ui";

export function KetQuaBadge({ ketQua, mau }: { ketQua: string; mau: string }) {
  if (ketQua === "HOP_LE") return <Badge tone="ok">Hợp lệ</Badge>;
  if (ketQua === "CANH_BAO") return <Badge tone="warn">Cảnh báo</Badge>;
  if (ketQua === "VUOT_CHAN") return <Badge tone="violet">Vượt chặn</Badge>;
  return <Badge tone={mau === "VANG" ? "warn" : "bad"}>{mau === "VANG" ? "Gặp lễ tân" : "Bị chặn"}</Badge>;
}
