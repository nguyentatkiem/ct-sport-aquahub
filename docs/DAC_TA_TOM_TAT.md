# Tóm tắt đặc tả (nguồn chuẩn để đối chiếu mockup)

Nguồn: "Đặc tả phần mềm quản lý khách trung tâm bơi.docx" v1.0, 08/10/2026.

## Quyết định đã chốt
- D1: 1 lượt check-in trừ 1 lượt THẺ VÉ. Khoá học KHÔNG bị trừ buổi khi check-in, không chặn vào cửa.
- D2: Luật chặn cấu hình theo từng sản phẩm trong admin.
- D3: Mã khách hệ thống tự sinh (khách/nhân viên không tự nhập).
- D4: Quản lý cơ sở chỉ thấy dữ liệu cơ sở mình. Chỉ Chủ thấy 3 cơ sở.
- Không code cứng sản phẩm; giá trong khảo sát chỉ là ví dụ.

## Ngoài phạm vi v1
Kế toán, hoá đơn điện tử, cổng thanh toán online, xếp lịch lớp, tính lương GV, Zalo/SMS tự động, app cài đặt. Giáo viên KHÔNG có tài khoản ở v1.

## Vai trò & ma trận quyền
- Chủ trung tâm: tất cả cơ sở, mọi quyền, xoá mềm khách, tài khoản NV, nhật ký.
- Quản lý cơ sở: chỉ cơ sở mình; huỷ phiếu thu/sửa giá thực thu sau khi lưu (phải ghi lý do); cộng/trừ lượt, bảo lưu, mở khoá (phải ghi lý do); vượt chặn 1 lần; xem doanh thu & báo cáo & xuất Excel cơ sở mình; lớp/GV/QR cơ sở mình; sản phẩm CHỈ XEM; KHÔNG quản lý tài khoản NV; KHÔNG xem nhật ký.
- Lễ tân: cơ sở mình; tạo/sửa khách, bán thẻ, ghi danh, thu tiền/cọc, check-in hộ. KHÔNG: xoá khách, huỷ phiếu, điều chỉnh lượt, bảo lưu, vượt chặn, xem doanh thu, báo cáo, xuất Excel, lớp/GV/QR, tài khoản, nhật ký. Sản phẩm chỉ xem.
- Khách: không đăng nhập.
- Khách cơ sở A check-in ở B: quản lý B chỉ thấy lượt đó (tên, mã, lượt còn), không mở hồ sơ/thanh toán. Doanh thu thuộc cơ sở bán.

## Mã tự sinh
- Mã KH: [mã cơ sở 2 chữ][5 số], VD LT00125. Không đổi khi chuyển cơ sở.
- Mã thẻ: TV[yy][5 số], VD TV2600341. Mã đơn: DH[yy][5 số], VD DH2600877.
- QR cá nhân dùng qr_token ngẫu nhiên, KHÔNG in mã KH vào QR. Cấp lại QR → QR cũ hết hiệu lực.

## Trường dữ liệu
- KhachHang: ma_kh (tự sinh), ho_ten, ngay_sinh (tuổi tự tính), sdt (bắt buộc người lớn), nguoi_lien_he (bắt buộc <18: tên, SĐT, quan hệ bố/mẹ/ông/bà/khác), co_so, ngay_dang_ky, nguon_tao (NV_NHAP/KHACH_TU_DANG_KY), trang_thai (CHO_DUYET/HOAT_DONG/NGUNG), ghi_chu, ghi_chu_suc_khoe (chưa chốt), qr_token.
- SanPham: loai (KHOA_HOC/THE_VE), ten, ten_en, gia_niem_yet, co_so_ap_dung, trang_thai (DANG_BAN/NGUNG_BAN). Thẻ vé: so_luot (trống=không giới hạn), han_dung_ngay (trống=không hạn), moc_tinh_han (NGAY_MUA/LAN_DAU_CHECKIN), luat_chan (HET_LUOT_HOAC_HET_HAN/CHI_HET_LUOT/CHI_HET_HAN), hanh_dong_khi_vi_pham (CHAN/CANH_BAO), dung_lien_co_so, toi_da_luot_moi_ngay (1), nguong_canh_bao_luot (3), nguong_canh_bao_ngay (7), cho_bao_luu + bao_luu_toi_da_ngay. Khoá học: so_buoi_hoc, so_buoi_tot_nghiep, the_ve_kem_theo.
- TheVe trạng thái: HOAT_DONG, BAO_LUU, HET_LUOT, HET_HAN, HUY. Luật chụp từ sản phẩm lúc bán.
- GhiDanh trạng thái: DANG_HOC, BAO_LUU, DU_DIEU_KIEN_TOT_NGHIEP, TOT_NGHIEP, HUY.
- CheckIn ket_qua: HOP_LE, BI_CHAN, CANH_BAO, VUOT_CHAN; kenh: KHACH_TU_QUET, LE_TAN; ma_xac_nhan 4 ký tự; khách MỚI/CŨ.
- DonHang: gia_niem_yet, giam_gia, ly_do_giam, gia_thuc_thu, da_thu, con_no, trang_thai_tt (CHUA_THU, DA_COC, DA_THU_DU, DA_HOAN).
- PhieuThu: loai (COC/THANH_TOAN/HOAN_TIEN), hinh_thuc (TIEN_MAT/CHUYEN_KHOAN), trang_thai (HIEU_LUC/DA_HUY + lý do). Không xoá, chỉ huỷ.

## Luật nghiệp vụ
- BR-01 trừ 1 lượt thẻ; khoá học không trừ. BR-02 quét QR lớp + có ghi danh lớp đó → buổi học +1 (chỉ đếm). Quét QR quầy không cộng buổi.
- BR-03 nhiều thẻ: trừ thẻ dùng được ở cơ sở này, hết hạn sớm nhất, rồi mua trước.
- BR-04 tối đa N lượt/ngày (mặc định 1); quét thêm: "Đã check-in lúc hh:mm", không trừ.
- BR-05 quét lại trong 5 phút trả kết quả cũ.
- BR-06..09 hết lượt/hết hạn (sau 23:59 ngày hết hạn); luật chặn; CHAN = màn đỏ, không trừ, "Mời gặp lễ tân"; CANH_BAO = màn vàng, vẫn cho vào, lượt có thể âm. NGAY_MUA: hết hạn = ngày mua + hạn − 1.
- BR-10 thẻ khác cơ sở: đỏ "Thẻ không dùng được ở cơ sở này".
- BR-11 Quản lý/Chủ cho vào 1 lần: bắt buộc lý do, ghi VUOT_CHAN, nhật ký. Lễ tân KHÔNG được.
- BR-12/13 sắp hết: ≤3 lượt hoặc ≤7 ngày; màn vẫn xanh + dòng vàng "Thẻ còn 2 lượt, hết hạn 20/10". Đã có thẻ mới thì rời danh sách.
- BR-14 màn kết quả: "Check-in thành công ngày dd/mm/yyyy lúc hh:mm", đồng hồ giây chạy, nền chuyển động, mã xác nhận 4 ký tự; cùng mã hiện trên danh sách lễ tân.
- BR-15 QR quầy chỉ mở trang; QR gắn 1 cơ sở; đổi mã được.
- BR-16 không sửa tay số lượt, chỉ qua Điều chỉnh có lý do (Chủ, Quản lý).
- BR-17 giảm giá: sửa giá thực thu, thấp hơn niêm yết thì bắt buộc lý do. Không có luật giảm giá tự động.
- BR-18 còn nợ = thực thu − tổng phiếu hiệu lực.
- BR-19 cấu hình "Thẻ được dùng khi": đã thu đủ / đã cọc (mặc định) / ngay khi tạo.
- BR-20 phiếu thu chỉ huỷ có lý do; hoàn tiền là phiếu HOAN_TIEN.
- BR-21 gia hạn = bán thẻ mới, không cộng dồn.
- BR-22 sửa sản phẩm không ảnh hưởng thẻ đã bán.
- BR-23 khách tự đăng ký = CHO_DUYET, không check-in được, màn vàng "Mời gặp lễ tân".
- BR-24 trùng họ tên + ngày sinh + SĐT liên hệ → cảnh báo, cho gộp.
- BR-25 1 SĐT nhiều khách; mã KH là khoá.
- BR-26 bảo lưu chỉ khi sản phẩm cho phép, tối đa X ngày; trong bảo lưu không check-in; hết bảo lưu dời hạn đúng số ngày.
- BR-27 đủ buổi → DU_DIEU_KIEN_TOT_NGHIEP; quản lý xác nhận TOT_NGHIEP.
- BR-28 khách mới = check-in hợp lệ đầu tiên trong đời.
- BR-29 không xoá cứng; xoá = NGUNG.

## Màn hình khách (mobile)
- M1 Nhận diện: logo, tên cơ sở, tên lớp (nếu QR lớp), nút VI/EN, danh sách khách đã lưu trên máy, ô "SĐT hoặc mã khách", nút Check-in, link "Khách mới? Đăng ký". KHÔNG hiện số buổi/khoá/GV ở bước này. Nhập mã KH thì hỏi thêm 4 số cuối SĐT. Có nút "Không phải tôi".
- M1b Chọn khách: tên đã che (VD "Ng**** Minh A.") + năm sinh, tick chọn nhiều.
- M2 Đăng ký: họ tên, ngày sinh, SĐT; <18: tên + SĐT phụ huynh, quan hệ; "Khoá học muốn đăng ký" (sản phẩm đang bán); ô đồng ý xử lý dữ liệu. Sau gửi: hiện mã KH + "Mời gặp lễ tân". Khách KHÔNG tự điền mã.
- M3 Kết quả: nền xanh/vàng/đỏ toàn màn, ngày giờ, đồng hồ giây, mã xác nhận, tên, mã KH, loại thẻ, lượt còn, ngày hết hạn, ngày mua, khoá học, lớp, GV, buổi thứ mấy/tổng.
- M4 Kiosk (P2): màn chờ "Đưa mã QR vào camera", bàn phím số gõ mã, kết quả 5 giây rồi về màn chờ, không lộ trang quản lý.
- Trang khách không hiện SĐT đầy đủ, không hiện tên đầy đủ trước khi xác nhận.

## Màn quản lý
- Q1 Tổng quan: lọc cơ sở (Chủ "Tất cả", Quản lý khoá cơ sở mình). Hôm nay: lượt check-in, khách mới, khách cũ, số mã thẻ xuất theo loại, số ghi danh theo khoá, khách sắp hết, doanh thu ngày (tách khoá học / thẻ vé). 20 lượt check-in mới nhất tự cập nhật.
- Q2 Danh sách check-in: giờ, mã xác nhận, tên, mã KH, loại thẻ, lượt còn, khoá, lớp, GV, cơ sở, kết quả, kênh. Lọc ngày/lớp/GV/kết quả. Dòng đỏ nổi lên đầu.
- Q3 Danh sách khách: mã, tên, tuổi, SĐT liên hệ, thẻ đang dùng, lượt còn, hạn, khoá, GV, còn nợ, trạng thái. Tìm kiếm, Thêm khách, tab "Chờ duyệt".
- Q4 Chi tiết khách: tên, mã, tuổi, SĐT, phụ huynh, QR cá nhân, ghi chú. Tab Thẻ vé / Khoá học / Check-in / Thanh toán. Nút: Bán thẻ vé, Ghi danh, Thu tiền, Check-in hộ, Bảo lưu, Điều chỉnh.
- Q5 Sắp hết: tên, mã, SĐT (bấm gọi), loại thẻ, còn lượt, còn ngày, khoá, GV, đã gọi chưa, nút Gia hạn. "Đã gọi" + ghi chú, ghi người gọi + thời điểm.
- Q6 Báo cáo; Q7 Cài đặt (tab Sản phẩm, Lớp học, Giáo viên, Mã QR, Cơ sở, Nhân viên, Cấu hình chung, Nhật ký).
- Lễ tân mobile: thanh dưới 4 nút Check-in, Tìm khách, Sắp hết, Thêm.
- FR-SP-03 xem trước luật bằng câu chữ. FR-SP-02 form đổi theo loại.
- FR-LH-03 QR lớp/quầy tải PDF A5 có logo + hướng dẫn 2 ngôn ngữ. FR-LH-04 đổi mã QR.
- FR-HT-01 đăng nhập SĐT/email + mật khẩu; quên mật khẩu do Chủ đặt lại (không tự reset qua email/SMS); sai 5 lần khoá 15 phút.
- FR-HT-04 Cài đặt: logo, tên trung tâm, cơ sở, mã cơ sở, BR-19, bật tắt khách tự đăng ký.
- FR-HT-06 nhập Excel mẫu, báo dòng lỗi, không nhập nửa chừng.

## Báo cáo
- Doanh thu phải hiện cả: doanh số bán (theo ngày bán) VÀ tiền thực thu (phiếu thu gồm cọc, theo ngày thu).
- BC-01 Lượt đến: hợp lệ, mới, cũ, bị chặn, vượt chặn; ngày/tuần/tháng; cơ sở, lớp, GV.
- BC-02 Bán thẻ: số mã thẻ xuất theo loại, doanh số. Thẻ chuyển đổi không tính.
- BC-03 Ghi danh: theo khoá, GV, doanh số, số đủ điều kiện tốt nghiệp.
- BC-04 Doanh thu: doanh số & thực thu, tách khoá/thẻ, tiền mặt/CK, cọc, còn nợ, hoàn tiền; theo cơ sở, nhân viên thu.
- BC-05 Sắp hết & gia hạn: số sắp hết, đã gọi, đã gia hạn, tỷ lệ gia hạn.
- BC-06 Chốt ca (P2): tiền mặt từng NV thu. BC-07 giờ cao điểm (P2).
- Chủ có cột so sánh 3 cơ sở. Mọi lần xuất Excel ghi nhật ký.
- FR-CB-04 (P2): khách hết thẻ chưa mua lại trong 30 ngày.
