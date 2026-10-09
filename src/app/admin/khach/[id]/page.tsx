import Link from "next/link";
import { notFound } from "next/navigation";
import { Ticket, GraduationCap, Wallet, Pencil, Printer, Phone, HeartPulse, Users } from "lucide-react";
import { canDangNhap, coQuyen, kiemTraCoSo, LoiQuyen } from "@/server/auth";
import { chiTietKhach, trangThaiTheRow } from "@/server/queries";
import { qrSvg, baseUrl } from "@/server/qr";
import { Badge, Card, CardHeader, LinkButton, Table, Th, Td, Empty, Tabs, Alert } from "@/components/ui";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { KetQuaBadge } from "@/components/checkin-badge";
import { fmtNgay, fmtNgayGio, ngayVN, tinhTuoi } from "@/lib/time";
import { fmtTien } from "@/lib/text";
import { QUAN_HE, TRANG_THAI_THE, TRANG_THAI_GD, TRANG_THAI_TT, LOAI_PHIEU, HINH_THUC, KENH, LOAI_DIEU_CHINH, LUAT_CHAN } from "@/lib/labels";
import { CheckInHoNut, DuyetTuChoi, QuanLyHoSo, ThuTienForm, HuyPhieuNut, SuaGiaNut, TotNghiepNut } from "./client";

export const metadata = { title: "Chi tiết khách" };

const toneThe: Record<string, "ok" | "warn" | "bad" | "muted" | "violet" | "brand"> = {
  HOAT_DONG: "ok",
  CHUA_KICH_HOAT: "brand",
  BAO_LUU: "violet",
  HET_LUOT: "bad",
  HET_HAN: "bad",
  HUY: "muted",
};

export default async function ChiTietKhachPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const u = await canDangNhap();
  const d = await chiTietKhach(Number(id));
  if (!d) notFound();
  try {
    await kiemTraCoSo(u, d.k.coSoId, d.k.maKh);
  } catch (e) {
    if (e instanceof LoiQuyen) return <KhongCoQuyen thongDiep={e.message} />;
    throw e;
  }
  const { k, cs, lh, the, gd, don, phieu, ci, dc, anhEm, spMuon } = d;
  const tab = sp.tab ?? "the";
  const homNay = ngayVN();
  const qrUrl = `${await baseUrl()}/q/${k.qrToken}`;
  const svg = await qrSvg(qrUrl);
  const tongNo = don.reduce((a, x) => a + x.d.conNo, 0);
  const sua = coQuyen(u, "DIEU_CHINH_THE");
  const hoatDong = k.trangThai === "HOAT_DONG";
  return (
    <>
      {sp.moi && <Alert tone="ok" className="mb-3">Đã lưu thành công.</Alert>}
      <Card className="mb-4">
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{k.hoTen}</h1>
              {k.trangThai === "HOAT_DONG" ? <Badge tone="ok">Hoạt động</Badge> : k.trangThai === "CHO_DUYET" ? <Badge tone="warn">Chờ duyệt</Badge> : <Badge>Ngừng</Badge>}
              {k.gopVaoId && <Badge tone="violet">Đã gộp</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
              <span>
                Mã: <b className="text-ink">{k.maKh}</b>
              </span>
              <span>
                {tinhTuoi(k.ngaySinh)} tuổi · {fmtNgay(k.ngaySinh)}
              </span>
              {k.sdt && (
                <a href={`tel:${k.sdt}`} className="flex items-center gap-1 text-brand">
                  <Phone className="size-3.5" /> {k.sdt}
                </a>
              )}
              <span>{cs.ten}</span>
              <span>Đăng ký {fmtNgay(k.ngayDangKy.toISOString().slice(0, 10))}{k.nguonTao === "KHACH_TU_DANG_KY" ? " (tự đăng ký)" : ""}</span>
            </div>
            {lh && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Users className="size-4 text-brand" />
                <span>
                  {QUAN_HE[lh.quanHe]}: <b>{lh.hoTen}</b> ·{" "}
                  <a className="text-brand" href={`tel:${lh.sdt}`}>
                    {lh.sdt}
                  </a>
                </span>
                {anhEm.length > 0 && (
                  <span className="text-ink-2">
                    · Cùng phụ huynh:{" "}
                    {anhEm.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && ", "}
                        <Link className="font-semibold text-brand" href={`/admin/khach/${a.id}`}>
                          {a.hoTen}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}
            {(k.ghiChu || k.ghiChuSucKhoe || spMuon) && (
              <div className="mt-2 grid gap-1 text-sm">
                {spMuon && <div className="text-ink-2">Muốn đăng ký: <b>{spMuon.ten}</b></div>}
                {k.ghiChu && <div className="whitespace-pre-line text-ink-2">{k.ghiChu}</div>}
                {k.ghiChuSucKhoe && (
                  <div className="flex items-start gap-1 text-bad">
                    <HeartPulse className="mt-0.5 size-4" /> {k.ghiChuSucKhoe}
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {k.trangThai === "CHO_DUYET" && <DuyetTuChoi id={k.id} />}
              {hoatDong && (
                <>
                  <LinkButton href={`/admin/khach/${k.id}/ban-the`}>
                    <Ticket className="size-4" /> Bán thẻ vé
                  </LinkButton>
                  <LinkButton href={`/admin/khach/${k.id}/ghi-danh`} variant="ok">
                    <GraduationCap className="size-4" /> Ghi danh
                  </LinkButton>
                  <LinkButton href={`/admin/khach/${k.id}?tab=thanh-toan`} variant="secondary">
                    <Wallet className="size-4" /> Thu tiền {tongNo > 0 && <Badge tone="bad">{fmtTien(tongNo)}</Badge>}
                  </LinkButton>
                  <CheckInHoNut khachId={k.id} lops={gd.filter((g) => ["DANG_HOC", "DU_DIEU_KIEN_TOT_NGHIEP"].includes(g.g.trangThai)).map((g) => ({ id: g.l.id, ten: g.l.ten }))} />
                </>
              )}
              <LinkButton href={`/admin/khach/${k.id}/sua`} variant="ghost">
                <Pencil className="size-4" /> Sửa
              </LinkButton>
              <QuanLyHoSo id={k.id} trangThai={k.trangThai} xoa={coQuyen(u, "XOA_KHACH")} gop={sua} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-36 rounded-xl bg-white p-1 ring-1 ring-line [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="text-xs text-ink-3">QR cá nhân (mã ngẫu nhiên)</div>
            <LinkButton size="sm" variant="secondary" href={`/admin/khach/${k.id}/the-in`}>
              <Printer className="size-4" /> In thẻ QR
            </LinkButton>
          </div>
        </div>
      </Card>

      <Tabs
        active={tab}
        items={[
          { key: "the", label: `Thẻ vé (${the.length})`, href: `?tab=the` },
          { key: "khoa", label: `Khoá học (${gd.length})`, href: `?tab=khoa` },
          { key: "checkin", label: `Check-in (${ci.length})`, href: `?tab=checkin` },
          { key: "thanh-toan", label: <>Thanh toán {tongNo > 0 && <Badge tone="bad">nợ</Badge>}</>, href: `?tab=thanh-toan` },
          { key: "lich-su", label: "Lịch sử điều chỉnh", href: `?tab=lich-su` },
        ]}
      />

      {tab === "the" && (
        <Card>
          {the.length === 0 ? (
            <Empty>Chưa có thẻ vé. {hoatDong && <Link className="font-semibold text-brand" href={`/admin/khach/${k.id}/ban-the`}>Bán thẻ vé →</Link>}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Mã thẻ</Th>
                  <Th>Loại</Th>
                  <Th>Lượt (gốc / đã dùng / còn)</Th>
                  <Th>Ngày mua</Th>
                  <Th>Hết hạn</Th>
                  <Th>Luật</Th>
                  <Th>Cơ sở bán</Th>
                  <Th>Thanh toán</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {the.map(({ t, d: dh, cs: c }) => {
                  const st = trangThaiTheRow(t, homNay);
                  return (
                    <tr key={t.id}>
                      <Td className="font-semibold">{t.maThe}</Td>
                      <Td>
                        {t.tenSanPham}
                        {t.laChuyenDoi && <div className="text-xs text-violet">Chuyển đổi từ thẻ giấy</div>}
                      </Td>
                      <Td className="tabular">
                        {t.soLuotGoc ?? "∞"} / {t.soLuotDaDung} / <b className={t.soLuotConLai != null && t.soLuotConLai <= 0 ? "text-bad" : ""}>{t.soLuotConLai ?? "∞"}</b>
                      </Td>
                      <Td>{fmtNgay(t.ngayMua)}</Td>
                      <Td>
                        {t.ngayHetHan ? fmtNgay(t.ngayHetHan) : t.hanDungNgay ? `${t.hanDungNgay} ngày từ lần đầu` : "Không hạn"}
                        {t.baoLuuTu && (
                          <div className="text-xs text-violet">
                            Bảo lưu {fmtNgay(t.baoLuuTu)}–{fmtNgay(t.baoLuuDen)}
                          </div>
                        )}
                      </Td>
                      <Td className="text-xs text-ink-2">
                        {LUAT_CHAN[t.luatChan]} · {t.hanhDongKhiViPham === "CHAN" ? "Chặn" : "Cảnh báo"} · {t.toiDaLuotMoiNgay}/ngày
                        {t.dungLienCoSo ? " · Liên cơ sở" : ""}
                      </Td>
                      <Td>{c.ten}</Td>
                      <Td>{dh ? <Badge tone={dh.conNo > 0 ? "warn" : "ok"}>{TRANG_THAI_TT[dh.trangThaiTt]}</Badge> : "—"}</Td>
                      <Td>
                        <Badge tone={toneThe[st]}>{TRANG_THAI_THE[st]}</Badge>
                      </Td>
                      <Td>
                        {sua && (
                          <div className="flex gap-1">
                            <LinkButton size="sm" variant="secondary" href={`/admin/khach/${k.id}/dieu-chinh?the=${t.id}`}>
                              Điều chỉnh
                            </LinkButton>
                            {t.choBaoLuu && t.trangThai !== "HUY" && (
                              <LinkButton size="sm" variant="ghost" href={`/admin/khach/${k.id}/bao-luu?the=${t.id}`}>
                                Bảo lưu
                              </LinkButton>
                            )}
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "khoa" && (
        <Card>
          {gd.length === 0 ? (
            <Empty>Chưa ghi danh khoá học nào.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Khoá học</Th>
                  <Th>Lớp</Th>
                  <Th>Giáo viên</Th>
                  <Th>Ngày ghi danh</Th>
                  <Th>Buổi đã học / tốt nghiệp</Th>
                  <Th>Thanh toán</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {gd.map(({ g, l, gv, d: dh }) => (
                  <tr key={g.id}>
                    <Td className="font-semibold">{g.tenKhoaHoc}</Td>
                    <Td>{l.ten}</Td>
                    <Td>{gv?.hoTen ?? "—"}</Td>
                    <Td>{fmtNgay(g.ngayGhiDanh)}</Td>
                    <Td className="tabular">
                      <b>{g.soBuoiDaHoc}</b> / {g.soBuoiTotNghiep ?? g.soBuoiHocGoc ?? "—"}
                      {g.baoLuuTu && <div className="text-xs text-violet">Bảo lưu {fmtNgay(g.baoLuuTu)}–{fmtNgay(g.baoLuuDen)}</div>}
                    </Td>
                    <Td>{dh ? <Badge tone={dh.conNo > 0 ? "warn" : "ok"}>{TRANG_THAI_TT[dh.trangThaiTt]}</Badge> : "—"}</Td>
                    <Td>
                      <Badge tone={g.trangThai === "DU_DIEU_KIEN_TOT_NGHIEP" ? "warn" : g.trangThai === "TOT_NGHIEP" ? "violet" : g.trangThai === "DANG_HOC" ? "ok" : "muted"}>{TRANG_THAI_GD[g.trangThai]}</Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        {g.trangThai === "DU_DIEU_KIEN_TOT_NGHIEP" && coQuyen(u, "XAC_NHAN_TOT_NGHIEP") && <TotNghiepNut khachId={k.id} ghiDanhId={g.id} />}
                        {sua && g.choBaoLuu && g.trangThai === "DANG_HOC" && (
                          <LinkButton size="sm" variant="ghost" href={`/admin/khach/${k.id}/bao-luu?gd=${g.id}`}>
                            Bảo lưu
                          </LinkButton>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "checkin" && (
        <Card>
          <CardHeader title="Lịch sử check-in" sub="Tra cứu khi phụ huynh hỏi bé có đến không (P4)" />
          {ci.length === 0 ? (
            <Empty>Chưa có lượt check-in.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Thời gian</Th>
                  <Th>Cơ sở</Th>
                  <Th>Lớp · GV</Th>
                  <Th>Thẻ</Th>
                  <Th>Lượt còn</Th>
                  <Th>Buổi</Th>
                  <Th>Kết quả</Th>
                  <Th>Kênh</Th>
                  <Th>Mã XN</Th>
                </tr>
              </thead>
              <tbody>
                {ci.map((r) => (
                  <tr key={r.id}>
                    <Td className="tabular">{fmtNgayGio(r.thoiGian)}</Td>
                    <Td>{r.coSo}</Td>
                    <Td>{[r.lop, r.giaoVien].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td>{r.the ?? "—"}</Td>
                    <Td className="tabular">{r.soLuotConSau ?? "—"}</Td>
                    <Td className="tabular">{r.soBuoiSau ?? "—"}</Td>
                    <Td>
                      <KetQuaBadge ketQua={r.ketQua} mau={r.mau} />
                      {r.lyDoText && <div className="text-xs text-ink-2">{r.lyDoText}</div>}
                    </Td>
                    <Td>{KENH[r.kenh]}</Td>
                    <Td className="tabular font-semibold">{r.maXacNhan}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "thanh-toan" && (
        <div className="grid gap-4">
          <Card>
            <CardHeader title="Đơn hàng" sub="Doanh số bán = giá thực thu; còn nợ = giá thực thu − phiếu thu còn hiệu lực" />
            {don.length === 0 ? (
              <Empty>Chưa có đơn hàng.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Mã đơn</Th>
                    <Th>Sản phẩm</Th>
                    <Th>Ngày bán</Th>
                    <Th>Niêm yết</Th>
                    <Th>Thực thu</Th>
                    <Th>Đã thu</Th>
                    <Th>Còn nợ</Th>
                    <Th>Trạng thái</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {don.map(({ d: dh, cs: c }) => (
                    <tr key={dh.id}>
                      <Td className="font-semibold">{dh.maDon}</Td>
                      <Td>
                        {dh.tenSanPham}
                        <div className="text-xs text-ink-3">{c.ten}</div>
                      </Td>
                      <Td>{fmtNgay(dh.ngayBan)}</Td>
                      <Td className="tabular">{fmtTien(dh.giaNiemYet)}</Td>
                      <Td className="tabular font-semibold">
                        {fmtTien(dh.giaThucThu)}
                        {dh.lyDoGiam && <div className="text-xs font-normal text-ink-2">Giảm: {dh.lyDoGiam}</div>}
                      </Td>
                      <Td className="tabular">{fmtTien(dh.daThu)}</Td>
                      <Td className={"tabular font-bold " + (dh.conNo > 0 ? "text-bad" : "text-ink-3")}>{fmtTien(dh.conNo)}</Td>
                      <Td>
                        <Badge tone={dh.trangThaiTt === "DA_THU_DU" ? "ok" : dh.trangThaiTt === "DA_HOAN" ? "violet" : "warn"}>{TRANG_THAI_TT[dh.trangThaiTt]}</Badge>
                      </Td>
                      <Td>{coQuyen(u, "HUY_PHIEU") && <SuaGiaNut khachId={k.id} donId={dh.id} gia={dh.giaThucThu} />}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          {don.length > 0 && hoatDong && (
            <ThuTienForm
              khachId={k.id}
              dons={don.map(({ d: dh }) => ({ id: dh.id, ma: dh.maDon, ten: dh.tenSanPham, conNo: dh.conNo, daThu: dh.daThu }))}
              hoan={coQuyen(u, "HUY_PHIEU")}
              chonDon={Number(sp.don) || null}
            />
          )}
          <Card>
            <CardHeader title="Phiếu thu" sub="Không xoá phiếu; chỉ huỷ có lý do (BR-20)" />
            {phieu.length === 0 ? (
              <Empty>Chưa có phiếu thu.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Số phiếu</Th>
                    <Th>Thời gian</Th>
                    <Th>Đơn</Th>
                    <Th>Loại</Th>
                    <Th>Số tiền</Th>
                    <Th>Hình thức</Th>
                    <Th>Người thu</Th>
                    <Th>Trạng thái</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {phieu.map(({ p, nd, maDon }) => (
                    <tr key={p.id} className={p.trangThai === "DA_HUY" ? "text-ink-3 line-through decoration-ink-3/40" : ""}>
                      <Td className="font-semibold">{p.maPhieu}</Td>
                      <Td className="tabular">{fmtNgayGio(p.thoiGian)}</Td>
                      <Td>{maDon}</Td>
                      <Td>
                        <Badge tone={p.loai === "HOAN_TIEN" ? "violet" : p.loai === "COC" ? "warn" : "ok"}>{LOAI_PHIEU[p.loai]}</Badge>
                      </Td>
                      <Td className="tabular font-semibold">{(p.loai === "HOAN_TIEN" ? "−" : "") + fmtTien(p.soTien)}</Td>
                      <Td>{HINH_THUC[p.hinhThuc]}</Td>
                      <Td>{nd ?? "—"}</Td>
                      <Td>
                        {p.trangThai === "DA_HUY" ? (
                          <span className="text-xs no-underline">Đã huỷ: {p.lyDoHuy}</span>
                        ) : (
                          <Badge tone="ok">Hiệu lực</Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <LinkButton size="sm" variant="ghost" href={`/admin/phieu/${p.id}`}>
                            In
                          </LinkButton>
                          {p.trangThai === "HIEU_LUC" && coQuyen(u, "HUY_PHIEU") && <HuyPhieuNut khachId={k.id} phieuId={p.id} ma={p.maPhieu} />}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {tab === "lich-su" && (
        <Card>
          <CardHeader title="Lịch sử điều chỉnh" sub="Cộng/trừ/chuyển lượt, gia hạn, bảo lưu, mở khoá, tốt nghiệp" />
          {dc.length === 0 ? (
            <Empty>Chưa có điều chỉnh.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Thời gian</Th>
                  <Th>Đối tượng</Th>
                  <Th>Loại</Th>
                  <Th>Số lượng</Th>
                  <Th>Trước → Sau</Th>
                  <Th>Lý do</Th>
                  <Th>Người làm</Th>
                </tr>
              </thead>
              <tbody>
                {dc.map((x) => {
                  const cu = (x.gia_tri_cu ?? {}) as Record<string, unknown>;
                  const moi = (x.gia_tri_moi ?? {}) as Record<string, unknown>;
                  const khac = Object.keys({ ...cu, ...moi }).filter((key) => JSON.stringify(cu[key]) !== JSON.stringify(moi[key]));
                  return (
                    <tr key={String(x.id)}>
                      <Td className="tabular">{fmtNgayGio(x.thoi_gian as string)}</Td>
                      <Td>{(x.ma_the as string) ?? (x.ten_khoa_hoc as string)}{x.ma_the_dich ? ` → ${x.ma_the_dich}` : ""}</Td>
                      <Td>{LOAI_DIEU_CHINH[x.loai as string] ?? String(x.loai)}</Td>
                      <Td className="tabular">{(x.so_luong as number) ?? "—"}</Td>
                      <Td className="text-xs">
                        {khac.map((key) => (
                          <div key={key}>
                            {key}: {String(cu[key] ?? "—")} → <b>{String(moi[key] ?? "—")}</b>
                          </div>
                        ))}
                      </Td>
                      <Td className="max-w-64">{x.ly_do as string}</Td>
                      <Td>{x.nguoi as string}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
