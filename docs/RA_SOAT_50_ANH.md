# Rà soát 50 ảnh mockup AquaHub so với đặc tả

Ngày rà: 09/10/2026. Nguồn: `~/Desktop/AquaHub_50_Anh_Chon_Loc/` (50 PNG), đối chiếu với `Đặc tả phần mềm quản lý khách trung tâm bơi.docx` v1.0.
Mức lỗi: **C** = Cao (sai luật nghiệp vụ, phân quyền, bảo mật hoặc thiếu màn P1), **TB** = Trung bình, **T** = Thấp (dữ liệu mẫu, chữ).

---

## 1. Kết luận nhanh

1. **Bố cục và độ phủ tốt.** 46/50 ảnh là thiết kế hoàn chỉnh, độ phân giải cao, phủ gần hết P1. Dùng được làm chuẩn giao diện.
2. **Có 2 bộ thiết kế khác nhau:**
   - **Bộ A "AquaHub"** (48 ảnh): ví dụ ở TP.HCM (Quận 1, Quận 7, Thủ Đức, có ảnh thêm Bình Thạnh), dữ liệu năm 2024/2025, 2 kiểu sidebar.
   - **Bộ B "AquaCenter"** (ảnh 41, 47; 307×512): cơ sở La Thành, năm 2026, mã `KH000125`. Bộ B khớp bối cảnh đặc tả hơn nhưng chỉ còn 2 ảnh nhỏ.
3. **Mockup không theo đặc tả ở các điểm lõi** (chi tiết mục 3):
   - Định dạng mã: dùng `KH001268`, `TV001256`, `DH000458`, mã xác nhận `#842718` (6 số), trong khi đặc tả là `LT00125`, `TV2600341`, `DH2600877` và 4 ký tự.
   - Màn khách "sắp hết lượt" dùng **nền vàng** (ảnh 06); theo BR-13 phải là **nền xanh + dòng vàng**.
   - Nhiều chỗ lẫn **khoá học với thẻ vé**, vi phạm D1: khoá học có luật chặn, bị chặn vì "hết lượt học", khoá học mang mã thẻ.
   - Có **thanh toán "Ví điện tử"**, **"Gửi Zalo/SMS"**, tab **đăng nhập cho Khách hàng**, kênh check-in **"App"**, **giáo viên thao tác hệ thống**. Tất cả trái phạm vi v1.
   - Mọi màn quản trị chỉ có **bản desktop**; thiếu bản điện thoại cho lễ tân (thanh dưới 4 nút, mục 8.3).
4. **Dữ liệu mẫu mâu thuẫn chéo nhiều** (tên phụ huynh, ngày sinh, giáo viên lớp, số cơ sở 3 hay 4). Không ảnh hưởng code, nhưng **không dùng số liệu trong ảnh làm dữ liệu test**.
5. **Kiosk:** README nói 48 và 49 là 2 phương án Kiosk, nhưng thực tế **49 là màn "Check-in hộ" của lễ tân** (FR-CI-07, P1). Chỉ 48 là Kiosk (M4, P2).

---

## 2. Hệ thống thiết kế quan sát được (để dựng design token)

| Thành phần | Quan sát |
|---|---|
| Màu chính | Xanh nước gradient (khoảng `#0EA5E9` → `#1D6FF2`), chữ tiêu đề navy (khoảng `#0F2A5F`) |
| Màu trạng thái | Xanh lá (thành công), cam/vàng (cảnh báo), đỏ (chặn/nợ), tím (hoàn tiền/khác) |
| Nền | Xanh rất nhạt; card trắng bo góc khoảng 12–16 px, bóng nhẹ; sóng nước ở chân trang |
| Font | Sans-serif hỗ trợ tiếng Việt tốt (giống Be Vietnam Pro / Inter) |
| Trang khách | Header logo + nút VI/EN dạng pill; nút chính full-width bo tròn; nhãn màn ở góc (M41–M47) |
| Trang quản trị | Sidebar trái 11 mục: Tổng quan, Check-in, Khách hàng, Chi tiết khách, Sắp hết hạn, Báo cáo, Sản phẩm, Lớp học, Giáo viên, Mã QR, Cài đặt. Topbar: ô tìm kiếm toàn cục, bộ chọn cơ sở, chuông, avatar + vai trò |
| Mẫu màn lặp lại | Hàng KPI 4–7 ô có % so kỳ trước; bảng có badge trạng thái; panel chi tiết trượt bên phải; header khách (ảnh, mã, tuổi, phụ huynh, SĐT) dùng chung cho mọi màn giao dịch |

**Không nhất quán cần chốt:**
- 2 kiểu sidebar: nền trắng (đa số) và nền xanh đậm (ảnh 11–20). Đề xuất dùng **nền trắng**.
- Thiếu mục menu **Thu tiền / Công nợ / Phiếu thu**, dù ảnh 34 và 35 có breadcrumb "Thu tiền".
- Mục **"Chi tiết khách"** trên menu là thừa (chỉ mở từ danh sách).
- Đang ở trang Check-in hoặc Sản phẩm nhưng menu lại sáng mục khác (ảnh 11, 16, 22, 27).

---

## 3. Lỗi nghiêm trọng (mức C), gom theo chủ đề

| # | Lỗi | Ảnh | Đặc tả | Xử lý khi code |
|---|---|---|---|---|
| C1 | Mã sai định dạng: `KH001268`, `HV001268`, `#KH02168`, `TV001256`, `DH000458`, `PT001568`; mã xác nhận 6 số `#842718` | hầu hết | 4.3, BR-14 | Theo đặc tả: `LT00125`, `TV2600341`, `DH2600877`, mã xác nhận 4 ký tự. Thêm quy tắc mã phiếu thu (đặc tả chưa có) |
| C2 | "Sắp hết" hiện **nền vàng toàn màn** "Check-in có cảnh báo" | 06 | BR-13 | Nền **xanh** + dòng vàng "Thẻ còn 2 lượt, hết hạn…". Màn vàng chỉ dành cho CANH_BAO hoặc "Mời gặp lễ tân" |
| C3 | Màn kết quả thiếu **đồng hồ giây** và **mã xác nhận** | 06, 07, 48 | BR-14 | Cả 3 màu đều phải có ngày giờ máy chủ, đồng hồ chạy, mã 4 ký tự |
| C4 | Khoá học bị coi như thẻ: loại thẻ "Khóa học Bơi Trẻ Em" bị chặn; lý do "Hết lượt học"; sản phẩm khoá học có cột luật chặn / hành động "Không cho check-in"; khoá học mang mã `KH001328` | 07, 22, 27, 50 | D1, BR-01 | Khoá học **không bao giờ chặn**. Form và bảng khoá học ẩn luật chặn. Ghi danh hiển thị riêng, không trong danh sách thẻ |
| C5 | Danh sách realtime **thiếu cột mã xác nhận**; cập nhật "mỗi 5 giây" | 40 | FR-CI-06, BR-14 | Thêm cột mã; đẩy SSE dưới 3 giây |
| C6 | Tab **"Khách hàng"** trên màn đăng nhập | 43 | Mục 3 (khách không đăng nhập) | Bỏ tab |
| C7 | Thanh toán **"Ví điện tử"**, **"Khác"** | 26, 34, 35 | PhieuThu.hinh_thuc | Chỉ TIỀN MẶT / CHUYỂN KHOẢN (thêm giá trị phải sửa đặc tả) |
| C8 | Nút **"Gửi Zalo/SMS"** phiếu thu; tab "Thông báo"; "Dịch vụ thanh toán" | 35, 45 | Ngoài phạm vi | Thay bằng "Tải ảnh PNG" (FR-BH-07) |
| C9 | **Giáo viên** là người thu tiền / thao tác trong nhật ký; vai trò "Nhân viên/Quản trị/Giáo viên" | 42, 46 | Mục 3 | Chỉ 3 vai trò Chủ / Quản lý / Lễ tân |
| C10 | Kênh check-in **"App"**, "App - iOS/Android"; "Máy quét QR quầy" | 21, 22, 40, 46 | Kênh: KHACH_TU_QUET / LE_TAN | Đổi nhãn theo đặc tả. Không có app, không có máy quét cứng ở v1 |
| C11 | "Người thực hiện", "Thời gian", "Ngày bán", "Số phiếu", "Người thu" **cho sửa tay** | 11, 15, 34, 50 | NFR-13, FR-HT-03 | Lấy từ phiên đăng nhập và giờ máy chủ, chỉ hiển thị |
| C12 | Trang khách lộ thông tin: tên **đầy đủ của phụ huynh** ở bước chọn học viên; **SĐT đầy đủ** trên màn đăng ký thành công | 02, 04 | NFR-07 | Che tên phụ huynh, che SĐT `0901 *** 567` |
| C13 | Không có màn **Danh sách khách hàng (Q3)**: file `23_Danh_sach_khach_hang` thực chất là màn "Khách sắp hết lượt/hết hạn" | 23 | Q3, FR-KH-02 | Thiết kế bổ sung Q3 (cột: mã, tên, tuổi, SĐT liên hệ, thẻ, lượt, hạn, khoá, GV, nợ, trạng thái, tab Chờ duyệt) |
| C14 | Không có **bản điện thoại cho lễ tân** (thanh dưới 4 nút) | toàn bộ | 8.3, NFR-12 | Thiết kế responsive cho Q1, Q2, tìm khách, Q5, bán thẻ |
| C15 | Chốt ca: cột "Số tiền phải nộp" **cộng cả chuyển khoản**; tổng cột không khớp (tiền mặt cộng ra 5,6 tr nhưng ghi 5,25 tr; phải nộp 11,5 tr nhưng ghi 11,85 tr) | 42 | BC-06 | Phải nộp = tiền mặt thu − tiền mặt hoàn. (P2) |
| C16 | **Doanh thu thực thu không gồm cọc** (tách thành cột riêng) | 14, 20 | Mục 9 | Thực thu = tổng phiếu thu **gồm cọc**; cọc là chỉ số con |
| C17 | Thu tiền: KPI sai. Lịch sử thu 250k + cọc 200k + 500k − hoàn 50k = 900k, nhưng "Đã thanh toán 450k, còn nợ 700k" (1,2 tr − 450k = 750k) | 14 | BR-18 | Tính từ phiếu hiệu lực |
| C18 | Cột "Mã đơn" trong phiếu thu chứa mã thẻ / mã khách (`TV001256`, `KH001328`, `HD001902`) | 35 | DonHang | Luôn là mã đơn `DH…` |
| C19 | Sản phẩm có nút **"Xóa"** | 19 | BR-22 | Chỉ "Ngừng bán" (ảnh 27 đúng) |
| C20 | Form thẻ vé hiển thị **"Thẻ vé kèm theo"** (trường của khoá học) | 27 | FR-SP-02 | Form đổi theo loại |

---

## 4. Chi tiết từng ảnh

### 4.1 Màn khách trên điện thoại (M1–M4)

| Ảnh | Màn | Khớp đặc tả | Lệch / lỗi |
|---|---|---|---|
| 01 Nhận diện QR (M41) | M1 | Logo, VI/EN, tên cơ sở + lớp, khách đã lưu (tên che, mã), ô "SĐT hoặc mã khách", link Đăng ký | **TB:** thiếu nút "Không phải tôi" (FR-CI-09), thiếu bước nhập 4 số cuối SĐT khi gõ mã. **T:** địa chỉ "Nguyễn Thị Minh Khai" khác ảnh 44 "Nguyễn Huệ" |
| 02 Chọn học viên (M42) | M1b | Chọn nhiều, "Chọn tất cả", năm sinh + tuổi, nút "Tiếp tục (1 học viên)" | **C12:** hiện tên đầy đủ phụ huynh. **T:** sinh 2016 ghi 8 tuổi (năm 2026 phải là 10) |
| 03 Đăng ký (M43) | M2 | Học viên, phụ huynh, quan hệ Bố/Mẹ/Ông/Bà/Khác, khoá học muốn đăng ký, ô đồng ý dữ liệu | **TB:** phụ huynh luôn bắt buộc (\*), phải chỉ bắt buộc khi dưới 18 tuổi; "Chọn khóa học \*" nên tuỳ chọn |
| 04 Chờ duyệt (M44) | M2 sau gửi | Mã khách, badge "Chờ duyệt", "Mời gặp lễ tân" | **C12:** SĐT đầy đủ. **T:** thời gian gửi 19/08/2024; ngày sinh 10/06/2018 mâu thuẫn ảnh 02; "Khoá học muốn đăng ký" lại hiện tên lớp |
| 05 Thành công (M45) | M3 xanh | Ngày giờ, đồng hồ 17:42:15, mã A7K3 (4 ký tự, đúng), loại thẻ, lượt 12/30, ngày mua, hết hạn, khoá, lớp, GV, buổi 6/20 | **TB:** thiếu tên cơ sở. **Mẫu tốt nhất cho M3** |
| 06 Cảnh báo (M46) | M3 | Dòng "Thẻ còn 2 lượt, hết hạn 12/10/2026" | **C2, C3.** **T:** GV lớp TE12 là "Trần Thị Mai" trong khi ảnh 05 là "Trần Minh Khoa" |
| 07 Bị chặn (M47) | M3 đỏ | Lý do liệt kê, "Mời gặp lễ tân" | **C3, C4** (loại thẻ = khoá học). **T:** ngày 20/02/2025 |
| 48 Kiosk | M4 (P2) | Camera QR + bàn phím số, kết quả xanh, "Cần hỗ trợ? Gặp lễ tân" | **C3.** **TB:** bàn phím chỉ có số nhưng mã khách có chữ (`LT00125`), cần quyết định mã kiosk dạng số hoặc thêm bàn phím chữ; không thấy đếm 5 giây về màn chờ; khung camera và kết quả cùng hiện một lúc, nên tách 2 trạng thái |

### 4.2 Khách hàng và vận hành quầy

| Ảnh | Màn | Khớp | Lệch / lỗi |
|---|---|---|---|
| 08 Thêm hồ sơ | Q3/L2 | Tuổi tự tính, cơ sở, trạng thái, ghi chú sức khoẻ, kiểm trùng bên phải, QR sinh sau khi lưu | **TB:** kiểm trùng theo "SĐT hoặc họ tên", đặc tả là họ tên + ngày sinh + SĐT liên hệ (BR-24); phụ huynh luôn có \* |
| 09 Duyệt đăng ký | Q3 tab Chờ duyệt | KPI chờ/duyệt/từ chối, cảnh báo trùng có link khách cũ, Phê duyệt / Từ chối | **TB:** trạng thái "Từ chối" chưa có trong đặc tả (thêm vào enum hoặc dùng NGUNG). Mã `HV…` (C1). Menu con "Nhóm khách hàng" ngoài đặc tả |
| 10 QR cá nhân | Q4 tab | Token ẩn một phần, In, Tải, Cấp lại QR, lịch sử cấp lại có lý do | **TB:** tab Q4 thành "Gói học, Lịch học, Điểm danh, Tiến độ", lệch đặc tả; "Lịch học" thuộc phần xếp lịch, ngoài phạm vi |
| 24 Chi tiết khách | Q4 | **Mẫu Q4 tốt:** 6 nút (Bán thẻ, Ghi danh, Thu tiền, Check-in hộ, Bảo lưu, Điều chỉnh), 4 tab đúng, QR, công nợ, thẻ đang hoạt động | **TB:** luật chặn "Không giới hạn", "Chỉ buổi sáng" không có trong enum (đặc tả không có luật theo khung giờ); loại điều chỉnh "Điều chỉnh luật" và lý do "quên check-out" không tồn tại |
| 23 "Danh sách khách hàng" | thực chất Q5 | Tab sắp hết lượt / hết hạn / đã liên hệ, nút Gọi, đã liên hệ | **C13.** **T:** "còn 3 lượt trong 7 ngày tới" diễn đạt sai ngưỡng |
| 25 Khách sắp hết hạn | Q5 | Đủ cột Q5 + nhân viên gọi, ghi chú, ưu tiên gọi, thống kê 42/96 (khớp) | **T:** có khách "còn 0 lượt" trong danh sách sắp hết; mã `#KH…` |
| 21 Dashboard | Q1 | Bộ lọc cơ sở, 7 KPI (128 = 24 mới + 104 cũ, khớp), 20 lượt mới nhất có mã xác nhận, doanh thu theo cơ sở (cộng khớp) | **TB:** thiếu "số mã thẻ xuất **theo loại**", "ghi danh **theo khoá**", doanh thu **tách khoá học / thẻ vé**. "Lớp sắp đủ sĩ số" ngoài phạm vi. 4 cơ sở. C1, C10 |
| 22 Danh sách check-in | Q2 | Dòng đỏ lên đầu, đủ cột + lý do, lọc lớp/GV/kết quả/kênh, Xuất Excel | **TB:** "Cảnh báo – Gần hết lượt" phải là HOP_LE (BR-13); lý do vượt chặn "Đi muộn > 15 phút" không có luật. C1, C4, C10 |
| 40 Check-in thời gian thực | Q2 realtime | KPI 112 + 8 + 8 = 128 khớp, đồng hồ hiện tại | **C5, C10.** "Thẻ buổi sáng" = luật khung giờ chưa có |
| 49 Check-in hộ | FR-CI-07 (P1) | Tìm theo tên/SĐT, mã khách, mã thẻ; panel kết quả kiểm 1 lượt/ngày, đúng cơ sở, còn hạn; nhật ký người thực hiện | **Không phải Kiosk.** **TB:** "Mã check-in #842718" (C1); email cho trẻ 8 tuổi; lý do chặn "Nợ phí tháng 10" (đặc tả không có học phí tháng); 3 panel xanh/vàng/đỏ hiện cùng lúc, chỉ nên hiện 1 |
| 17 Xử lý check-in bị chặn | L5 / BR-11 | Lý do chặn, câu "Lễ tân không có quyền vượt chặn", kiểm quyền, lý do + ghi chú bắt buộc, 2 ô xác nhận, lịch sử vượt chặn | **TB:** thiếu nhánh **"Bán thẻ mới → Check-in lại"** (L5). **T:** header là "Chủ trung tâm" nhưng panel quyền lại ghi "Quản lý cơ sở" |
| 41 Khách hết thẻ chưa mua lại | FR-CB-04 (P2) | Tab quá 7/30/60 ngày, cơ sở La Thành | Bộ B, 307×512, phải vẽ lại theo bộ A |

### 4.3 Bán hàng, thu tiền, điều chỉnh

| Ảnh | Màn | Khớp | Lệch / lỗi |
|---|---|---|---|
| 11 Bán thẻ vé | L3 | Thẻ sản phẩm có lượt / hạn / tối đa mỗi ngày, giá niêm yết − giảm = thực thu, lý do giảm bắt buộc, thu lần này, còn nợ, toggle "Chưa thu", thông báo "sao chép quy định khi bán" | **TB:** thiếu **ngày hết hạn dự kiến**; "Hết lượt/hết hạn: Tự động khoá thẻ" không phản ánh luật thật của sản phẩm; menu sáng sai "Sản phẩm". C11 (ngày bán, nhân viên sửa được). Thẻ "gia đình 50 lượt, 5 lượt/ngày" → câu hỏi mở: **thẻ dùng chung nhiều người?** (đặc tả: thẻ gắn 1 khách) |
| 12 Gia hạn | L4 / BR-21 | Câu "bán thẻ mới, không cộng dồn", hiển thị 2 thẻ sau gia hạn, cọc 300k nợ 150k | **T:** thẻ "2 tháng" nhưng 12/08 → 12/11 là 3 tháng; danh mục giá khác ảnh 11 |
| 13 Ghi danh khoá học | L3 / FR-BH-02 | Câu "Khoá học không trừ lượt thẻ", thẻ bơi hiện tại, tiến độ 0/20, nút "Bán thẻ bơi" | **TB:** chưa tạo được ghi danh + thẻ **trong 1 thao tác**; GV điền là "Nguyễn Văn Minh" (chính là Chủ trung tâm); GV phải tự điền theo lớp; thiếu số buổi tốt nghiệp; sản phẩm có độ tuổi, ảnh, mô tả, cấp độ (đặc tả chưa có, cần bổ sung trường hoặc bỏ) |
| 14 Thu tiền và đặt cọc | L4 / FR-BH-04 | Tab Thu / Cọc / Hoàn, chọn nhanh số tiền, lịch sử, khu "Huỷ phiếu" bắt buộc lý do | **C16, C17.** "Chỉ dành cho quản trị viên": theo đặc tả **Quản lý** cũng được huỷ. Trạng thái "Hoàn thành" phải là HIỆU LỰC / ĐÃ HUỶ |
| 34 Công nợ và thu nốt | FR-BH-05 | Lọc cơ sở/NV/trạng thái, danh sách khách nợ, thu nốt, xem trước phiếu (đơn 3,5 tr − 1,5 tr = 2 tr, khớp) | **C7, C11.** "Tuổi nợ" / "Quá hạn" cần ngày hạn thanh toán, đặc tả chưa có. "Phụ phí in thẻ" chưa có sản phẩm tương ứng |
| 35 Phiếu thu | FR-BH-07 | Lọc, KPI tiền mặt / CK / cọc / hoàn (khớp ảnh 26), chi tiết phiếu, In phiếu, Huỷ phiếu | **C7, C8, C18.** Cột trạng thái ghi "Hoàn tiền" (nhầm loại với trạng thái) |
| 15 Điều chỉnh thẻ v1 | FR-BH-06 | Cộng / Trừ / Chuyển lượt, trước → sau, lý do bắt buộc, lịch sử | **Thay bằng ảnh 50.** C11. Lịch sử điều chỉnh có ngày trước cả ngày bắt đầu thẻ |
| 50 Điều chỉnh thẻ v2 | FR-BH-06 / BR-16 | **Đủ 5 loại:** Cộng, Trừ, Chuyển lượt, Gia hạn ngày, Mở khoá; xem trước kết quả; lịch sử giá trị cũ → mới | **C4** (khoá học trong danh sách thẻ, mã `KH001328`). C11. **Chọn bản này** |
| 16 Bảo lưu | BR-26 | Quy định bảo lưu, báo lỗi khi vượt 30 ngày, hết hạn cũ 31/08 → mới 30/09 (+30 ngày, đúng) | **TB:** ô "Có cho phép bảo lưu?" sửa được trên thẻ, phải chỉ đọc từ snapshot sản phẩm; mã `SP001` hiển thị như mã thẻ |

### 4.4 Cấu hình (Q7)

| Ảnh | Màn | Khớp | Lệch / lỗi |
|---|---|---|---|
| 19 Cấu hình luật thẻ | FR-SP-01 | Đủ luật chặn (3), hành động (Cảnh báo/Chặn), mốc tính hạn, phạm vi cơ sở, tối đa mỗi ngày, ngưỡng lượt/ngày, bảo lưu, câu "sao chép vào thẻ khi bán" | **C19.** **TB:** hạn tính theo "tháng" (đặc tả: ngày); không có lựa chọn "không giới hạn" lượt/hạn; thiếu tên tiếng Anh, xem trước luật |
| 27 Danh mục sản phẩm | FR-SP-01..04 | **Mẫu tốt nhất:** tab Thẻ vé / Khoá học, tên tiếng Anh, giá, lượt, hạn ngày, mốc, luật, hành động, dùng liên cơ sở, ngưỡng, bảo lưu, **xem trước luật bằng câu chữ**, Nhân bản, Ngừng bán | **C4, C20.** Khoá học thiếu cột số buổi / buổi tốt nghiệp. Thiếu ô ngưỡng ngày, bảo lưu tối đa. Menu sáng 2 mục |
| 28 Quản lý lớp | FR-LH-02 | Lớp, khoá, GV, cơ sở, lịch, QR lớp, Đổi mã QR, In QR, xem học viên | **TB:** sĩ số, trạng thái lớp (sắp khai giảng / tạm dừng / kết thúc) chưa có trong đặc tả. Đặc tả chỉ yêu cầu lịch dạng chữ |
| 31 Tạo lớp | FR-LH-02 | Wizard 4 bước, gắn sản phẩm, tạo QR khi lưu | **TB:** "Giá ưu đãi" trên lớp mâu thuẫn BR-17 (giảm giá nhập khi bán); lịch nhiều buổi, sĩ số, độ tuổi vượt phạm vi. Nên rút gọn còn 1 bước |
| 29 Quản lý GV | FR-LH-01 | Danh sách, cơ sở dạy, trạng thái đang làm / tạm nghỉ, Ngừng hoạt động | **TB:** lịch dạy theo giờ, chuyên môn, KPI vượt phạm vi |
| 32 Thêm GV | FR-LH-01 | Họ tên, SĐT, cơ sở, trạng thái | **C về dữ liệu cá nhân:** thu **số CCCD**, quốc tịch, địa chỉ, chứng chỉ, lịch dạy. Đặc tả chỉ cần tên, SĐT, cơ sở, trạng thái. Bỏ CCCD |
| 30 Quản lý mã QR | FR-LH-03/04 | QR lớp / quầy / mẫu cá nhân, mã hiệu lực, PDF, In, Đổi mã, xem trước A5 song ngữ, cảnh báo khi đổi mã | **T:** tên lớp ở đây ("Lớp Cá Heo 1") không có ở ảnh 28. **Đạt** |
| 33 Tạo QR | FR-LH-03 | Chọn lớp/quầy, hiệu lực từ–đến, A5, PDF, xem trước song ngữ | **T:** kích thước mặc định 10×15 cm, đặc tả là A5; lịch lớp lệch ảnh 28 và 31 |
| 18 Nhân viên & phân quyền | FR-HT-02 | **Đúng 3 vai trò**, câu "Giáo viên không có tài khoản", 1 cơ sở cho Quản lý và Lễ tân, tạm khoá | **TB:** thiếu nút "Đặt lại mật khẩu" (FR-HT-01) và ô email; quản lý CS2/CS3 mâu thuẫn ảnh 44 |
| 44 Quản lý cơ sở | FR-HT-04 | 3 cơ sở, mã cơ sở, quản lý phụ trách, bật/tắt | **TB:** mã cơ sở `CS1` (đặc tả: 2 chữ cái, VD `LT`, dùng trong mã khách); tab "Khu vực & bể bơi, Thiết bị, Quy định vận hành" ngoài phạm vi; thiếu bật/tắt khách tự đăng ký **theo cơ sở**. 86 lớp ở đây nhưng ảnh 28 ghi 24 |
| 45 Cài đặt trung tâm | FR-HT-04 | Tên, logo, múi giờ UTC+7, ngưỡng cảnh báo, sao lưu tự động hằng ngày | **C về luật:** **thiếu cấu hình "Thẻ được dùng khi"** (BR-19). "Tối đa lượt/ngày" đặt toàn cục, đặc tả để theo sản phẩm. Ô "hoá đơn", "Dịch vụ thanh toán" ngoài phạm vi |
| 46 Nhật ký thao tác | FR-HT-03 | Lọc, giá trị cũ → mới, lý do, IP / thiết bị, timeline liên quan, xuất Excel | **C9, C10.** Thiếu loại sự kiện "Xuất file" (mục 9.1) |
| 47 Nhập Excel | FR-HT-06 | Chỉ thấy tab "Nhập dữ liệu từ Excel" | **Chưa có thiết kế màn nhập** (tải mẫu, upload, báo lỗi từng dòng, xác nhận). Bộ B, độ phân giải thấp |
| 43 Đăng nhập | FR-HT-01 | SĐT/email + mật khẩu, quên mật khẩu | **C6.** "Quên mật khẩu" phải dẫn tới "Liên hệ Chủ trung tâm để đặt lại"; thêm thông báo khoá 15 phút |

### 4.5 Báo cáo

| Ảnh | Báo cáo | Khớp | Lệch / lỗi |
|---|---|---|---|
| 26 Tổng hợp | Q6 | Tab BC-01..05, lọc kỳ / cơ sở / lớp / GV / NV thu, **bảng so sánh 3 cơ sở (cộng ngang dọc đều khớp)** | C7. "Tổng doanh thu" chưa nói rõ là doanh số hay thực thu |
| 36 BC-01 | Lượt đến | Hợp lệ, mới, cũ, chặn, vượt chặn, theo lớp / GV, heatmap giờ cao điểm (= BC-07) | **T:** bảng cơ sở 684 ≠ 128 + 542; khách cũ cộng 1.516 nhưng ghi 1.530; bảng chi tiết tổng 168 khác KPI 128 |
| 37 BC-02 | Bán thẻ | Số thẻ theo loại (246 + 168 + 128 = 542, khớp), top NV bán | **T:** cột theo cơ sở cộng 142,2 tr ≠ 198 tr; 4 cơ sở; "Thẻ 10 lượt" vừa 246 (riêng CS1) vừa 62 (CS4). **TB:** thẻ chuyển đổi không được tính, cần loại trừ |
| 38 BC-03 | Ghi danh | Theo khoá, GV, **đủ điều kiện tốt nghiệp 96**, trạng thái ghi danh (cộng khớp 328) | **T:** doanh số 362,5 tr trùng tổng doanh thu cả trung tâm; GV cộng 314 ≠ 328; "Đủ điều kiện tốt nghiệp" bị dùng làm trạng thái **lớp**; sĩ số / tỷ lệ lấp đầy ngoài phạm vi |
| 20 BC-04 | Doanh thu | Doanh số bán, thực thu, cọc, công nợ, hoàn; lọc NV thu, loại SP; donut cơ sở khớp | **C16.** **TB:** thiếu tách **khoá học / thẻ vé** và **tiền mặt / CK** dạng chỉ số |
| 39 BC-05 | Sắp hết và gia hạn | **Đạt và số khớp hoàn toàn:** 118 sắp hết, 91 đã gọi, 66 gia hạn, 56%; mỗi cơ sở đều đúng | Không |
| 42 BC-06 Chốt ca | P2 | Đối chiếu từng NV, ghi chú, xác nhận chốt | **C9, C15** |

---

## 5. Màn còn thiếu (cần thiết kế thêm trước hoặc trong sprint tương ứng)

| Ưu tiên | Màn | Lý do |
|---|---|---|
| P1 | **Q3 Danh sách khách hàng** | Ảnh 23 đặt nhầm tên |
| P1 | **Bản điện thoại cho lễ tân**: Q1/Q2 gọn, tìm khách, Q5, thanh dưới 4 nút | Mục 8.3, lễ tân dùng điện thoại |
| P1 | M1: bước nhập **4 số cuối SĐT**, nút **"Không phải tôi"** | FR-CI-02, FR-CI-09 |
| P1 | M3 các nhánh: **"Đã check-in lúc hh:mm"**, **"Thẻ không dùng được ở cơ sở này"**, **"Mời gặp lễ tân"** (chờ duyệt / chưa cọc), **kết quả nhiều người** | BR-04, BR-10, BR-19/23, FR-CI-03 |
| P1 | Trang **"Mã QR đã hết hiệu lực"** | FR-LH-04 |
| P1 | Bản **tiếng Anh** của trang khách | FR-HT-05 |
| P1 | **Nhập Excel**: tải mẫu, upload, báo lỗi từng dòng, xác nhận | FR-HT-06 |
| P1 | **Xuất Excel** (chọn loại file / kỳ) + ghi nhật ký | Mục 9.1 |
| P1 | **"Danh sách khách hôm nay"** khi mất mạng | NFR-05 |
| P1 | Cài đặt **"Thẻ được dùng khi"** + **bật tắt khách tự đăng ký theo cơ sở** | BR-19, FR-HT-04 |
| P1 | Tạo **"Thẻ chuyển đổi"** từ thẻ giấy (đính ảnh thẻ giấy) | 11.2 |
| P1 | Xác nhận **tốt nghiệp** (đủ điều kiện → tốt nghiệp) | BR-27 |
| P2 | Gộp hồ sơ trùng | FR-KH-04 |
| P2 | Phiếu thu in 80 mm / PNG | FR-BH-07 |

---

## 6. Câu hỏi mới phát sinh từ ảnh (bổ sung vào đặc tả 12.2)

| # | Câu hỏi | Ảnh |
|---|---|---|
| Q8 | Có **thẻ gia đình dùng chung** nhiều thành viên không? Nếu có, mô hình TheVe phải gắn nhiều khách | 11, 19, 27 |
| Q9 | Có cần **luật theo khung giờ** ("thẻ buổi sáng") không? | 24, 40 |
| Q10 | Có **học phí theo tháng** / **hạn thanh toán** (tuổi nợ, quá hạn) không? | 34, 49 |
| Q11 | Lớp có **sĩ số tối đa** và chặn ghi danh khi đầy không? | 28, 31, 38 |
| Q12 | Sản phẩm khoá học có cần **độ tuổi, ảnh, mô tả** không? | 13 |
| Q13 | Trạng thái **"Từ chối"** khi duyệt đăng ký? | 09 |
| Q14 | **Mã kiosk** dạng số (để dùng bàn phím số) hay chữ + số? | 48 |
| Q15 | Chọn **bộ thiết kế A (AquaHub)** làm chuẩn và vẽ lại 41, 47? Tên thương hiệu cuối cùng là gì? | 41, 47 |

---

## 7. Ảnh chọn làm chuẩn giao diện cho dev

| Màn | Ảnh chuẩn | Ghi chú |
|---|---|---|
| M3 kết quả | **05** | Áp dụng cho cả vàng / đỏ: đồng hồ + mã 4 ký tự |
| Q4 chi tiết khách | **24** | Bỏ "Chỉ buổi sáng", "Điều chỉnh luật" |
| Điều chỉnh thẻ | **50** | Bỏ 15 |
| Sản phẩm | **27** | Thay 19, sửa C4/C20 |
| Q5 | **25** | 23 dùng làm tham khảo tab |
| BC-05 | **39** | Số liệu mẫu đúng |
| QR | **30**, **33** | Mặc định A5 |
| Phân quyền | **18** | Thêm đặt lại mật khẩu |
| Check-in hộ | **49** | Chỉ hiện 1 panel kết quả |
