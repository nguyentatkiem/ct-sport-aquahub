import { layNguoiDung } from "@/server/auth";
import { COT_MAU } from "@/server/import";
import { taoFile, traFile } from "@/server/excel";
import { json } from "@/server/http";

export async function GET() {
  if (!(await layNguoiDung())) return json({ loi: "Chưa đăng nhập" }, 401);
  const keys = COT_MAU.map((_, i) => "c" + i);
  const buf = await taoFile([
    {
      ten: "Khách",
      cot: COT_MAU.map((h, i) => ({ key: keys[i], header: h, width: 22 })),
      dong: [
        { c0: "Nguyễn Minh Anh", c1: "15/03/2016", c2: "", c3: "Trần Thị Hoa", c4: "0912345678", c5: "Mẹ", c6: "LT", c7: "Khách cũ sổ giấy", c8: 7, c9: "31/12/2026" },
        { c0: "Lê Văn Bình", c1: "02/09/1985", c2: "0987654321", c3: "", c4: "", c5: "", c6: "LT", c7: "", c8: "", c9: "" },
      ],
    },
  ]);
  return traFile(buf, "mau-nhap-khach.xlsx");
}
