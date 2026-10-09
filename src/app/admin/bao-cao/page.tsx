import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lopHoc, giaoVien, nguoiDung } from "@/db/schema";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { bc01, bc02, bc03, bc04, bc05, bc06, bc07 } from "@/server/reports";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, Table, Th, Td, Empty, Tabs, Input, Button, Select, LinkButton, Stat } from "@/components/ui";
import { congNgay, fmtNgay, ngayVN } from "@/lib/time";
import { fmtTien } from "@/lib/text";

export const metadata = { title: "Báo cáo" };

const BC = [
  { key: "bc01", label: "BC-01 Lượt đến" },
  { key: "bc02", label: "BC-02 Bán thẻ vé" },
  { key: "bc03", label: "BC-03 Ghi danh" },
  { key: "bc04", label: "BC-04 Doanh thu" },
  { key: "bc05", label: "BC-05 Sắp hết & gia hạn" },
  { key: "bc06", label: "BC-06 Chốt ca" },
  { key: "bc07", label: "BC-07 Giờ cao điểm" },
];

function kyMacDinh(ky: string | undefined, tu?: string, den?: string) {
  const hn = ngayVN();
  if (tu && den) return { tu, den };
  switch (ky) {
    case "hom-nay":
      return { tu: hn, den: hn };
    case "7-ngay":
      return { tu: congNgay(hn, -6), den: hn };
    case "thang-truoc": {
      const dau = hn.slice(0, 8) + "01";
      const cuoiTruoc = congNgay(dau, -1);
      return { tu: cuoiTruoc.slice(0, 8) + "01", den: cuoiTruoc };
    }
    default:
      return { tu: hn.slice(0, 8) + "01", den: hn };
  }
}

const n = (x: string | number) => Number(x) || 0;

export default async function BaoCaoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  if (!coQuyen(u, "XEM_BAO_CAO")) return <KhongCoQuyen thongDiep="Lễ tân không xem báo cáo và doanh thu (mục 3.1)." />;
  const cs = await phamViCoSo(u);
  const bc = sp.bc ?? "bc01";
  const { tu, den } = kyMacDinh(sp.ky, sp.tu, sp.den);
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ bc, tu, den, ...o }).toString();
  const k = { tu, den, coSoId: cs };
  return (
    <>
      <PageHeader
        title="Báo cáo"
        sub={`${fmtNgay(tu)} – ${fmtNgay(den)} · ${cs ? "1 cơ sở" : "So sánh tất cả cơ sở"}`}
        action={coQuyen(u, "XUAT_EXCEL") && <LinkButton variant="secondary" href={`/api/export/bao-cao${qs({})}`}>Xuất Excel</LinkButton>}
      />
      <Tabs active={bc} items={BC.map((b) => ({ ...b, href: `?bc=${b.key}&tu=${tu}&den=${den}` }))} />
      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-2 p-3">
          <input type="hidden" name="bc" value={bc} />
          {bc === "bc06" ? (
            <label className="text-sm font-semibold">
              Ngày
              <Input type="date" name="den" defaultValue={den} className="mt-1" />
              <input type="hidden" name="tu" value={den} />
            </label>
          ) : (
            <>
              <label className="text-sm font-semibold">
                Từ ngày
                <Input type="date" name="tu" defaultValue={tu} className="mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Đến ngày
                <Input type="date" name="den" defaultValue={den} className="mt-1" />
              </label>
            </>
          )}
          {bc === "bc01" && <LocLopGv cs={cs} sp={sp} />}
          {bc === "bc04" && <LocNhanVien cs={cs} sp={sp} />}
          <Button variant="secondary">Xem</Button>
          <div className="ml-auto flex flex-wrap gap-1 text-sm">
            {[
              ["hom-nay", "Hôm nay"],
              ["7-ngay", "7 ngày"],
              ["thang-nay", "Tháng này"],
              ["thang-truoc", "Tháng trước"],
            ].map(([key, label]) => (
              <a key={key} href={`?bc=${bc}&ky=${key}`} className="rounded-lg px-2.5 py-1.5 font-semibold text-brand hover:bg-brand-soft">
                {label}
              </a>
            ))}
          </div>
        </form>
      </Card>
      {bc === "bc01" && <BC01 k={{ ...k, lopId: Number(sp.lop) || null, gvId: Number(sp.gv) || null }} />}
      {bc === "bc02" && <BC02 k={k} />}
      {bc === "bc03" && <BC03 k={k} />}
      {bc === "bc04" && <BC04 k={{ ...k, nguoiThuId: Number(sp.nv) || null }} />}
      {bc === "bc05" && <BC05 k={k} />}
      {bc === "bc06" && <BC06 ngay={den} cs={cs} />}
      {bc === "bc07" && <BC07 k={k} />}
    </>
  );
}

async function LocLopGv({ cs, sp }: { cs: number | null; sp: Record<string, string | undefined> }) {
  const [lops, gvs] = await Promise.all([
    db.select({ id: lopHoc.id, ten: lopHoc.ten }).from(lopHoc).where(cs ? eq(lopHoc.coSoId, cs) : undefined).orderBy(asc(lopHoc.ten)),
    db.select({ id: giaoVien.id, ten: giaoVien.hoTen }).from(giaoVien).orderBy(asc(giaoVien.hoTen)),
  ]);
  return (
    <>
      <Select name="lop" defaultValue={sp.lop ?? ""} className="w-48">
        <option value="">Mọi lớp</option>
        {lops.map((l) => (
          <option key={l.id} value={l.id}>
            {l.ten}
          </option>
        ))}
      </Select>
      <Select name="gv" defaultValue={sp.gv ?? ""} className="w-44">
        <option value="">Mọi giáo viên</option>
        {gvs.map((g) => (
          <option key={g.id} value={g.id}>
            {g.ten}
          </option>
        ))}
      </Select>
    </>
  );
}

async function LocNhanVien({ cs, sp }: { cs: number | null; sp: Record<string, string | undefined> }) {
  const nvs = await db.select({ id: nguoiDung.id, ten: nguoiDung.hoTen }).from(nguoiDung).where(cs ? eq(nguoiDung.coSoId, cs) : undefined);
  return (
    <Select name="nv" defaultValue={sp.nv ?? ""} className="w-48">
      <option value="">Mọi nhân viên thu</option>
      {nvs.map((x) => (
        <option key={x.id} value={x.id}>
          {x.ten}
        </option>
      ))}
    </Select>
  );
}

function TongDong({ cols, nhan = "Tổng" }: { cols: (string | number)[]; nhan?: string }) {
  return (
    <tr className="bg-surface-2 font-bold">
      <Td>{nhan}</Td>
      {cols.map((c, i) => (
        <Td key={i} className="tabular">
          {c}
        </Td>
      ))}
    </tr>
  );
}

async function BC01({ k }: { k: Parameters<typeof bc01>[0] }) {
  const d = await bc01(k);
  const sum = (f: keyof (typeof d.theoCoSo)[number]) => d.theoCoSo.reduce((a, r) => a + n(r[f] as number), 0);
  const max = Math.max(1, ...d.theoNgay.map((x) => x.vao));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Lượt vào" value={sum("vao")} />
        <Stat label="Khách mới" value={sum("moi")} tone="ok" sub="Lượt vào đầu tiên trong đời" />
        <Stat label="Khách cũ" value={sum("cu")} tone="brand" />
        <Stat label="Bị chặn" value={sum("chan")} tone="bad" />
        <Stat label="Vượt chặn" value={sum("vuot")} tone="violet" />
      </div>
      <Card>
        <CardHeader title="Theo cơ sở" />
        <Table>
          <thead>
            <tr>
              <Th>Cơ sở</Th>
              <Th>Lượt vào</Th>
              <Th>Hợp lệ</Th>
              <Th>Cảnh báo</Th>
              <Th>Khách mới</Th>
              <Th>Khách cũ</Th>
              <Th>Bị chặn</Th>
              <Th>Vượt chặn</Th>
            </tr>
          </thead>
          <tbody>
            {d.theoCoSo.map((r) => (
              <tr key={r.co_so}>
                <Td className="font-semibold">{r.co_so}</Td>
                <Td className="tabular font-bold">{r.vao}</Td>
                <Td className="tabular">{r.hop_le}</Td>
                <Td className="tabular">{r.canh_bao}</Td>
                <Td className="tabular">{r.moi}</Td>
                <Td className="tabular">{r.cu}</Td>
                <Td className="tabular">{r.chan}</Td>
                <Td className="tabular">{r.vuot}</Td>
              </tr>
            ))}
            {d.theoCoSo.length > 1 && <TongDong cols={[sum("vao"), sum("hop_le"), sum("canh_bao"), sum("moi"), sum("cu"), sum("chan"), sum("vuot")]} />}
          </tbody>
        </Table>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Theo ngày" />
          {d.theoNgay.length === 0 ? (
            <Empty>Không có dữ liệu.</Empty>
          ) : (
            <div className="grid gap-1 p-4">
              {d.theoNgay.map((x) => (
                <div key={x.ngay} className="flex items-center gap-2 text-sm">
                  <span className="tabular w-12 text-ink-2">{fmtNgay(x.ngay).slice(0, 5)}</span>
                  <div className="h-5 flex-1 rounded bg-surface-2">
                    <div className="h-5 rounded bg-gradient-to-r from-brand-2 to-brand" style={{ width: `${(x.vao / max) * 100}%` }} />
                  </div>
                  <span className="tabular w-10 text-right font-semibold">{x.vao}</span>
                  <span className="tabular w-14 text-right text-xs text-ok">+{x.moi} mới</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Theo lớp và giáo viên" />
          <Table>
            <thead>
              <tr>
                <Th>Lớp</Th>
                <Th>Giáo viên</Th>
                <Th>Lượt vào</Th>
              </tr>
            </thead>
            <tbody>
              {d.theoLop.map((r, i) => (
                <tr key={i}>
                  <Td>{r.lop}</Td>
                  <Td>{r.giao_vien ?? "—"}</Td>
                  <Td className="tabular font-semibold">{r.vao}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

async function BC02({ k }: { k: Parameters<typeof bc02>[0] }) {
  const d = await bc02(k);
  const tongThe = d.reduce((a, r) => a + r.so_the, 0);
  const tongDs = d.reduce((a, r) => a + n(r.doanh_so), 0);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Số mã thẻ xuất" value={tongThe} sub="Không tính thẻ chuyển đổi" />
        <Stat label="Doanh số thẻ vé" value={fmtTien(tongDs)} tone="ok" />
      </div>
      <Card>
        <CardHeader title="Theo loại thẻ và cơ sở" />
        {d.length === 0 ? (
          <Empty>Không bán thẻ trong kỳ.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Cơ sở</Th>
                <Th>Loại thẻ</Th>
                <Th>Số thẻ</Th>
                <Th>Doanh số</Th>
              </tr>
            </thead>
            <tbody>
              {d.map((r, i) => (
                <tr key={i}>
                  <Td>{r.co_so}</Td>
                  <Td className="font-semibold">{r.loai}</Td>
                  <Td className="tabular">{r.so_the}</Td>
                  <Td className="tabular">{fmtTien(n(r.doanh_so))}</Td>
                </tr>
              ))}
              <TongDong cols={["", tongThe, fmtTien(tongDs)]} />
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

async function BC03({ k }: { k: Parameters<typeof bc03>[0] }) {
  const d = await bc03(k);
  const tong = d.theoKhoa.reduce((a, r) => a + r.so_gd, 0);
  const tongDs = d.theoKhoa.reduce((a, r) => a + n(r.doanh_so), 0);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Lượt ghi danh trong kỳ" value={tong} />
        <Stat label="Doanh số khoá học" value={fmtTien(tongDs)} tone="ok" />
        <Stat label="Đủ điều kiện tốt nghiệp (hiện tại)" value={d.totNghiep.reduce((a, r) => a + r.du_dk, 0)} tone="warn" />
        <Stat label="Đang học (hiện tại)" value={d.totNghiep.reduce((a, r) => a + r.dang_hoc, 0)} tone="brand" />
      </div>
      <Card>
        <CardHeader title="Theo khoá học và giáo viên" />
        {d.theoKhoa.length === 0 ? (
          <Empty>Không có ghi danh trong kỳ.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Cơ sở</Th>
                <Th>Khoá học</Th>
                <Th>Giáo viên</Th>
                <Th>Ghi danh</Th>
                <Th>Doanh số</Th>
              </tr>
            </thead>
            <tbody>
              {d.theoKhoa.map((r, i) => (
                <tr key={i}>
                  <Td>{r.co_so}</Td>
                  <Td className="font-semibold">{r.khoa}</Td>
                  <Td>{r.giao_vien ?? "—"}</Td>
                  <Td className="tabular">{r.so_gd}</Td>
                  <Td className="tabular">{fmtTien(n(r.doanh_so))}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Card>
        <CardHeader title="Tình trạng tốt nghiệp theo cơ sở" />
        <Table>
          <thead>
            <tr>
              <Th>Cơ sở</Th>
              <Th>Đang học</Th>
              <Th>Đủ ĐK tốt nghiệp</Th>
              <Th>Đã tốt nghiệp</Th>
            </tr>
          </thead>
          <tbody>
            {d.totNghiep.map((r) => (
              <tr key={r.co_so}>
                <Td>{r.co_so}</Td>
                <Td className="tabular">{r.dang_hoc}</Td>
                <Td className="tabular font-bold text-warn">{r.du_dk}</Td>
                <Td className="tabular">{r.tot_nghiep}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

async function BC04({ k }: { k: Parameters<typeof bc04>[0] }) {
  const d = await bc04(k);
  const s = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, x) => a + f(x), 0);
  const ds = s(d.doanhSo, (r) => n(r.ds_khoa) + n(r.ds_the));
  const tt = s(d.thucThu, (r) => n(r.tien_mat) + n(r.chuyen_khoan));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Doanh số bán" value={fmtTien(ds)} sub="Giá thực thu của đơn, theo ngày bán" />
        <Stat label="Tiền thực thu" value={fmtTien(tt)} tone="ok" sub="Tổng phiếu thu gồm cọc, trừ hoàn, theo ngày thu" />
        <Stat label="Trong đó cọc" value={fmtTien(s(d.thucThu, (r) => n(r.coc)))} tone="warn" />
        <Stat label="Còn nợ (đơn bán trong kỳ)" value={fmtTien(s(d.doanhSo, (r) => n(r.con_no)))} tone="bad" />
      </div>
      <Card>
        <CardHeader title="So sánh cơ sở" sub="Doanh thu tính cho cơ sở bán thẻ (mục 3.2)" />
        <Table>
          <thead>
            <tr>
              <Th>Cơ sở</Th>
              <Th>DS khoá học</Th>
              <Th>DS thẻ vé</Th>
              <Th>Doanh số</Th>
              <Th>Thu tiền mặt</Th>
              <Th>Thu chuyển khoản</Th>
              <Th>Thu khoá học</Th>
              <Th>Thu thẻ vé</Th>
              <Th>Cọc</Th>
              <Th>Hoàn tiền</Th>
              <Th>Còn nợ</Th>
            </tr>
          </thead>
          <tbody>
            {d.doanhSo.map((r) => {
              const t = d.thucThu.find((x) => x.co_so === r.co_so)!;
              return (
                <tr key={r.co_so}>
                  <Td className="font-semibold">{r.co_so}</Td>
                  <Td className="tabular">{fmtTien(n(r.ds_khoa))}</Td>
                  <Td className="tabular">{fmtTien(n(r.ds_the))}</Td>
                  <Td className="tabular font-bold">{fmtTien(n(r.ds_khoa) + n(r.ds_the))}</Td>
                  <Td className="tabular">{fmtTien(n(t.tien_mat))}</Td>
                  <Td className="tabular">{fmtTien(n(t.chuyen_khoan))}</Td>
                  <Td className="tabular">{fmtTien(n(t.thu_khoa))}</Td>
                  <Td className="tabular">{fmtTien(n(t.thu_the))}</Td>
                  <Td className="tabular">{fmtTien(n(t.coc))}</Td>
                  <Td className="tabular">{fmtTien(n(t.hoan))}</Td>
                  <Td className="tabular text-bad">{fmtTien(n(r.con_no))}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <Card>
        <CardHeader title="Theo nhân viên thu" />
        {d.theoNhanVien.length === 0 ? (
          <Empty>Không có phiếu thu.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nhân viên</Th>
                <Th>Cơ sở</Th>
                <Th>Số phiếu</Th>
                <Th>Tiền mặt</Th>
                <Th>Chuyển khoản</Th>
              </tr>
            </thead>
            <tbody>
              {d.theoNhanVien.map((r, i) => (
                <tr key={i}>
                  <Td className="font-semibold">{r.nhan_vien}</Td>
                  <Td>{r.co_so}</Td>
                  <Td className="tabular">{r.so_phieu}</Td>
                  <Td className="tabular">{fmtTien(n(r.tien_mat))}</Td>
                  <Td className="tabular">{fmtTien(n(r.chuyen_khoan))}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

async function BC05({ k }: { k: Parameters<typeof bc05>[0] }) {
  const d = await bc05(k);
  const kt = d.reduce((a, r) => a + r.ket_thuc, 0);
  const gh = d.reduce((a, r) => a + r.gia_han, 0);
  const goi = d.reduce((a, r) => a + r.da_goi, 0);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Thẻ kết thúc trong kỳ" value={kt} sub="Hết hạn hoặc hết lượt" />
        <Stat label="Đã gọi" value={goi} tone="brand" />
        <Stat label="Đã gia hạn" value={gh} tone="ok" sub="Mua thẻ mới từ 14 ngày trước đến 30 ngày sau" />
        <Stat label="Tỷ lệ gia hạn" value={pct(gh, kt)} tone="violet" />
      </div>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Cơ sở</Th>
              <Th>Thẻ kết thúc</Th>
              <Th>Đã gọi</Th>
              <Th>Đã gia hạn</Th>
              <Th>Tỷ lệ gia hạn</Th>
            </tr>
          </thead>
          <tbody>
            {d.map((r) => (
              <tr key={r.co_so}>
                <Td className="font-semibold">{r.co_so}</Td>
                <Td className="tabular">{r.ket_thuc}</Td>
                <Td className="tabular">{r.da_goi}</Td>
                <Td className="tabular">{r.gia_han}</Td>
                <Td className="tabular font-bold">{pct(r.gia_han, r.ket_thuc)}</Td>
              </tr>
            ))}
            {d.length > 1 && <TongDong cols={[kt, goi, gh, pct(gh, kt)]} />}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

async function BC06({ ngay, cs }: { ngay: string; cs: number | null }) {
  const d = await bc06(ngay, cs);
  return (
    <Card>
      <CardHeader title={`Chốt ca ngày ${fmtNgay(ngay)}`} sub="Tiền mặt phải nộp = tiền mặt thu − tiền mặt hoàn. Chuyển khoản chỉ để đối chiếu." />
      {d.length === 0 ? (
        <Empty>Không có phiếu thu trong ngày.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nhân viên</Th>
              <Th>Cơ sở</Th>
              <Th>Số phiếu</Th>
              <Th>Tiền mặt thu</Th>
              <Th>Tiền mặt hoàn</Th>
              <Th>Tiền mặt phải nộp</Th>
              <Th>Chuyển khoản</Th>
            </tr>
          </thead>
          <tbody>
            {d.map((r, i) => (
              <tr key={i}>
                <Td className="font-semibold">{r.nhan_vien}</Td>
                <Td>{r.co_so}</Td>
                <Td className="tabular">{r.so_phieu}</Td>
                <Td className="tabular">{fmtTien(n(r.tm_thu))}</Td>
                <Td className="tabular">{fmtTien(n(r.tm_hoan))}</Td>
                <Td className="tabular font-bold">{fmtTien(n(r.tm_thu) - n(r.tm_hoan))}</Td>
                <Td className="tabular">{fmtTien(n(r.ck))}</Td>
              </tr>
            ))}
            <TongDong
              cols={[
                "",
                d.reduce((a, r) => a + r.so_phieu, 0),
                fmtTien(d.reduce((a, r) => a + n(r.tm_thu), 0)),
                fmtTien(d.reduce((a, r) => a + n(r.tm_hoan), 0)),
                fmtTien(d.reduce((a, r) => a + n(r.tm_thu) - n(r.tm_hoan), 0)),
                fmtTien(d.reduce((a, r) => a + n(r.ck), 0)),
              ]}
            />
          </tbody>
        </Table>
      )}
    </Card>
  );
}

async function BC07({ k }: { k: Parameters<typeof bc07>[0] }) {
  const d = await bc07(k);
  const max = Math.max(1, ...d.map((x) => x.n));
  const gios = Array.from({ length: 17 }, (_, i) => i + 5);
  const thus = [1, 2, 3, 4, 5, 6, 0];
  const ten = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return (
    <Card>
      <CardHeader title="Lượt vào theo khung giờ và thứ" sub="Màu càng đậm càng đông" />
      <div className="overflow-x-auto p-4">
        <table className="text-xs">
          <thead>
            <tr>
              <th />
              {gios.map((g) => (
                <th key={g} className="w-9 pb-1 text-center font-semibold text-ink-3">
                  {g}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {thus.map((t) => (
              <tr key={t}>
                <td className="pr-2 font-semibold text-ink-2">{ten[t]}</td>
                {gios.map((g) => {
                  const v = d.find((x) => x.thu === t && x.gio === g)?.n ?? 0;
                  return (
                    <td key={g} className="p-0.5">
                      <div className="tabular grid h-8 place-items-center rounded-md text-[11px] font-semibold" style={{ background: v ? `rgba(11,132,243,${0.12 + (v / max) * 0.88})` : "#f2f8fd", color: v / max > 0.5 ? "#fff" : "#0f2a5f" }}>
                        {v || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
