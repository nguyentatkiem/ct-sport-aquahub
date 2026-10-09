import ExcelJS from "exceljs";

export type Cot = { key: string; header: string; width?: number; money?: boolean };

export async function taoFile(sheets: { ten: string; cot: Cot[]; dong: Record<string, unknown>[] }[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CT Sport";
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.ten.slice(0, 31));
    ws.columns = s.cot.map((c) => ({ key: c.key, header: c.header, width: c.width ?? Math.max(12, c.header.length + 4) }));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B84F3" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    for (const d of s.dong) ws.addRow(d);
    s.cot.forEach((c, i) => {
      if (c.money) ws.getColumn(i + 1).numFmt = "#,##0";
    });
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function traFile(buf: Buffer, ten: string) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(ten)}`,
      "cache-control": "no-store",
    },
  });
}
