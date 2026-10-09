import Link from "next/link";
import { Phone } from "lucide-react";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsSapHet, dsHetTheChuaMua } from "@/server/queries";
import { Card, PageHeader, Table, Th, Td, Empty, Tabs, Badge, LinkButton } from "@/components/ui";
import { fmtNgay, fmtNgayGio } from "@/lib/time";
import { KET_QUA_GOI } from "@/lib/labels";
import { GhiLienHe } from "./client";

export const metadata = { title: "Khách sắp hết hạn" };

export default async function SapHetPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const tab = sp.tab ?? "sap-het";
  return (
    <>
      <PageHeader
        title="Khách sắp hết hạn"
        sub="Thẻ còn ≤ ngưỡng lượt hoặc ≤ ngưỡng ngày (BR-12). Khách đã có thẻ mới tự rời danh sách (BR-13)."
        action={coQuyen(u, "XUAT_EXCEL") ? <LinkButton variant="secondary" href="/api/export/sap-het">Xuất Excel</LinkButton> : null}
      />
      <Tabs
        active={tab}
        items={[
          { key: "sap-het", label: "Sắp hết", href: "?tab=sap-het" },
          { key: "het-the", label: "Hết thẻ chưa mua lại (30 ngày)", href: "?tab=het-the" },
        ]}
      />
      {tab === "sap-het" ? <SapHet cs={cs} /> : <HetThe cs={cs} />}
    </>
  );
}

async function SapHet({ cs }: { cs: number | null }) {
  const rows = await dsSapHet({ coSoId: cs });
  const daGoi = rows.filter((r) => r.lien_he_ket_qua).length;
  return (
    <Card>
      <div className="flex flex-wrap gap-2 border-b border-line p-3 text-sm">
        <Badge tone="warn">{rows.length} thẻ sắp hết</Badge>
        <Badge tone="ok">{daGoi} đã gọi</Badge>
        <Badge>{rows.length - daGoi} chưa gọi</Badge>
      </div>
      {rows.length === 0 ? (
        <Empty>Không có khách sắp hết.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Khách</Th>
              <Th>SĐT</Th>
              <Th>Thẻ</Th>
              <Th>Còn lượt</Th>
              <Th>Còn ngày</Th>
              <Th>Khoá · GV</Th>
              {!cs && <Th>Cơ sở</Th>}
              <Th>Đã gọi</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.the_id}>
                <Td>
                  <Link href={`/admin/khach/${r.khach_id}`} className="font-semibold hover:text-brand">
                    {r.ho_ten}
                  </Link>
                  <div className="text-xs text-ink-3">{r.ma_kh}</div>
                </Td>
                <Td>
                  {r.sdt ? (
                    <a href={`tel:${r.sdt}`} className="inline-flex items-center gap-1 font-semibold text-brand">
                      <Phone className="size-4" />
                      {r.sdt}
                    </a>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {r.ten_san_pham}
                  <div className="text-xs text-ink-3">{r.ma_the}</div>
                </Td>
                <Td className={"tabular font-bold " + (r.so_luot_con_lai != null && r.so_luot_con_lai <= 1 ? "text-bad" : "text-warn")}>{r.so_luot_con_lai ?? "∞"}</Td>
                <Td className="tabular">{r.ngay_het_han ? `${r.con_ngay} ngày (${fmtNgay(r.ngay_het_han)})` : "Không hạn"}</Td>
                <Td className="max-w-56 text-ink-2">{[r.khoa_hoc, r.giao_vien].filter(Boolean).join(" · ") || "—"}</Td>
                {!cs && <Td>{r.co_so}</Td>}
                <Td>
                  {r.lien_he_ket_qua ? (
                    <div>
                      <Badge tone="ok">{KET_QUA_GOI[r.lien_he_ket_qua]}</Badge>
                      <div className="mt-0.5 text-xs text-ink-3">
                        {r.nguoi_goi} · {fmtNgayGio(r.lien_he_luc)}
                      </div>
                      {r.lien_he_ghi_chu && <div className="text-xs text-ink-2">{r.lien_he_ghi_chu}</div>}
                    </div>
                  ) : (
                    <Badge>Chưa gọi</Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <GhiLienHe theId={r.the_id} ten={r.ho_ten} />
                    <LinkButton size="sm" href={`/admin/khach/${r.khach_id}/ban-the`}>
                      Gia hạn
                    </LinkButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

async function HetThe({ cs }: { cs: number | null }) {
  const rows = await dsHetTheChuaMua(cs, 30);
  return (
    <Card>
      {rows.length === 0 ? (
        <Empty>Không có khách hết thẻ quá 30 ngày chưa mua lại.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Khách</Th>
              <Th>SĐT</Th>
              <Th>Lần vào cuối</Th>
              <Th>Mua lần cuối</Th>
              {!cs && <Th>Cơ sở</Th>}
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.khach_id}>
                <Td>
                  <Link href={`/admin/khach/${r.khach_id}`} className="font-semibold hover:text-brand">
                    {r.ho_ten}
                  </Link>
                  <div className="text-xs text-ink-3">{r.ma_kh}</div>
                </Td>
                <Td>{r.sdt ? <a href={`tel:${r.sdt}`} className="font-semibold text-brand">{r.sdt}</a> : "—"}</Td>
                <Td>{r.lan_cuoi ? fmtNgayGio(r.lan_cuoi) : "—"}</Td>
                <Td>{r.mua_cuoi ? fmtNgay(String(r.mua_cuoi).slice(0, 10)) : "—"}</Td>
                {!cs && <Td>{r.co_so}</Td>}
                <Td>
                  <LinkButton size="sm" href={`/admin/khach/${r.khach_id}/ban-the`}>
                    Bán thẻ mới
                  </LinkButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
