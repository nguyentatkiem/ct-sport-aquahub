# Phương án phát triển: Phần mềm quản lý khách trung tâm bơi (CT SPORT / AquaHub)

Ngày lập: 09/10/2026
Đầu vào (Google Drive `SLIDE/CT SPORT`):
- `Đặc tả phần mềm quản lý khách trung tâm bơi.docx` (v1.0, 08/10/2026), đã đọc toàn bộ
- `AquaHub_50_Anh_Chon_Loc/`: 50 ảnh mockup PNG + `DANH_MUC_ANH.csv` + `DOC_TRUOC_KHI_DUNG.txt`

> **Về ảnh:** Đã xem từng ảnh trong 50 ảnh và đối chiếu với đặc tả, chi tiết ở [docs/RA_SOAT_50_ANH.md](docs/RA_SOAT_50_ANH.md). Tóm tắt:
> - Ảnh dùng tốt làm **chuẩn bố cục và design system**.
> - Có **20 lỗi mức Cao** cần sửa theo đặc tả khi code: định dạng mã, màn "sắp hết" sai màu, khoá học bị coi như thẻ, thanh toán ví điện tử, gửi Zalo/SMS, đăng nhập cho khách, giáo viên thao tác…
> - **Thiếu 12 màn P1**: Q3 Danh sách khách, bản điện thoại cho lễ tân, nhập/xuất Excel, các nhánh M3…
> - Ảnh 49 không phải Kiosk mà là màn **Check-in hộ** (P1).
>
> **Nguyên tắc: đặc tả là chuẩn về luật và dữ liệu, ảnh là chuẩn về giao diện.**

---

## 1. Tóm tắt sản phẩm

Web app (không cài app) thay sổ giấy và thẻ giấy cho trung tâm bơi có 3 cơ sở, khoảng 1.100 đến 1.500 khách/tháng.

- Khách quét QR ở quầy hoặc ở lớp → tự check-in → hệ thống tự trừ lượt thẻ vé → hiện màn xanh, vàng hoặc đỏ có chống gian lận.
- Lễ tân và quản lý bán thẻ, ghi danh khoá học, thu tiền và cọc, gia hạn, bảo lưu.
- Sản phẩm (khoá học, thẻ vé) và luật chặn **cấu hình trong admin**, không viết cứng trong code.
- Mỗi cơ sở chỉ thấy dữ liệu của mình. Chủ trung tâm thấy cả 3 cơ sở.

Quy mô: 44 yêu cầu chức năng (P1 + P2), 7 báo cáo, 29 luật nghiệp vụ, 18 ca kiểm thử bắt buộc, 13 yêu cầu phi chức năng.

---

## 2. Kiến trúc và công nghệ đề xuất

| Lớp | Lựa chọn | Lý do gắn với đặc tả |
|---|---|---|
| Frontend + Backend | **Next.js 15 (App Router) + TypeScript**, một khối duy nhất | Đội nhỏ, một codebase. Trang khách SSR nhẹ, dưới 300 KB (NFR-01) |
| CSDL | **PostgreSQL 16** | Khoá dòng `SELECT … FOR UPDATE` để trừ lượt đúng (NFR-03, TC-07). Extension `unaccent` + `pg_trgm` cho tìm không dấu (FR-KH-02) |
| ORM | Prisma hoặc Drizzle | Migration rõ ràng. Phần trừ lượt viết SQL thuần trong transaction |
| Realtime | Server-Sent Events, hoặc Postgres `LISTEN/NOTIFY` + SSE | Đẩy check-in lên màn lễ tân dưới 3 giây (FR-CI-06), đơn giản hơn WebSocket |
| UI | Tailwind + shadcn/ui, mobile-first | Nút ≥ 44 px, chữ ≥ 16 px (NFR-12). Màu xanh nước theo logo |
| Đa ngôn ngữ | next-intl, file JSON `vi`/`en` | Thêm ngôn ngữ không sửa code (NFR-11, FR-HT-05) |
| Xác thực | Auth.js (Credentials) + bcrypt/argon2, session cookie | Đăng nhập SĐT/email, khoá 15 phút sau 5 lần sai (FR-HT-01) |
| Phân quyền | Middleware RBAC + lọc `co_so_id` bắt buộc ở tầng truy vấn | Cách ly cơ sở phía máy chủ (mục 3.2, TC-15) |
| QR / PDF / Excel | `qrcode`, `@react-pdf/renderer` (A5), `exceljs` | FR-LH-03, mục 9.1, FR-HT-06 |
| Hạ tầng | VPS hoặc cloud tại Singapore/Việt Nam, Docker, Postgres có backup tự động hằng ngày giữ 30 bản | NFR-09, NFR-10 |
| Giám sát | Sentry + uptime check | 99,5% trong khung 5:00 đến 22:00 |

Múi giờ: lưu `timestamptz`, mọi phép tính "ngày" theo `Asia/Ho_Chi_Minh` và lấy giờ máy chủ (NFR-13, BR-06).

### 2.1 Cấu trúc thư mục dự kiến

```
ct-sport-aquahub/
├─ apps/web/                  # Next.js
│  ├─ app/(guest)/c/[token]/  # Trang khách check-in M1–M4 (VI/EN)
│  ├─ app/(admin)/            # Q1–Q7
│  ├─ app/api/                # Route handlers, SSE stream
│  └─ lib/
│     ├─ checkin/engine.ts    # Lõi luật BR-01..BR-15 (thuần, test được)
│     ├─ billing/             # Đơn hàng, phiếu thu, công nợ BR-16..22
│     ├─ authz/               # RBAC + scope cơ sở
│     └─ codes/               # Sinh mã KH/TV/DH (D3)
├─ packages/db/               # Schema, migration, seed
├─ tests/
│  ├─ rules/                  # Unit test luật, ánh xạ TC-01..TC-18
│  └─ e2e/                    # Playwright: luồng L1–L5
└─ docs/                      # Đặc tả, ảnh tham chiếu, quyết định
```

---

## 3. Thiết kế lõi kỹ thuật (phần rủi ro cao nhất)

### 3.1 Bộ máy check-in (`checkin/engine`)
Viết thành **hàm thuần**: nhận khách, các thẻ, ghi danh, cấu hình, thời điểm hiện tại → trả về quyết định (thẻ nào, XANH/VÀNG/ĐỎ, lý do, có trừ lượt hay không). Không gọi CSDL bên trong, nên 18 ca kiểm thử chạy thành unit test.

Thứ tự kiểm tra:
1. Trạng thái khách: CHO_DUYET → vàng (BR-23)
2. Chống bấm đúp 5 phút → trả kết quả cũ (BR-05)
3. Chọn thẻ: dùng được tại cơ sở này, sắp hết hạn trước, mua trước (BR-03, BR-10)
4. Thẻ đang bảo lưu → chặn (BR-26)
5. Điều kiện thanh toán theo cấu hình BR-19 → vàng
6. Giới hạn lượt mỗi ngày → "Đã check-in lúc hh:mm" (BR-04)
7. Luật chặn và hành động khi vi phạm (BR-06..BR-09): CHAN → đỏ, CANH_BAO → vàng, cho phép nợ lượt
8. Hợp lệ → trừ 1 lượt, cộng buổi học nếu quét QR lớp (BR-01, BR-02), cảnh báo sắp hết (BR-12, BR-13)

Bước ghi: một transaction, `SELECT … FOR UPDATE` trên dòng `the_ve`, kiểm tra lại rồi mới trừ. Thêm unique index `(the_ve_id, ngay_vn)` cho lượt HOP_LE khi `toi_da_luot_moi_ngay = 1`.

### 3.2 Chụp luật khi bán (snapshot)
Khi bán, `TheVe` và `GhiDanh` copy toàn bộ trường luật từ `SanPham`. Sửa sản phẩm sau đó không ảnh hưởng thẻ đã bán (BR-22, TC-16). Số lượt chỉ thay đổi qua bảng `DieuChinh` (BR-16).

### 3.3 Sinh mã an toàn khi nhiều cơ sở cùng tạo
Dùng bảng `ma_counter(prefix, year, value)` cập nhật bằng `UPDATE … RETURNING` trong transaction, hoặc Postgres sequence riêng cho từng tiền tố. Đáp ứng yêu cầu "không trùng khi 3 cơ sở cùng tạo" (FR-KH-01). QR cá nhân dùng `qr_token` ngẫu nhiên, cấp lại thì token cũ mất hiệu lực (FR-KH-06).

### 3.4 Chống gian lận màn kết quả (BR-14)
Ngày giờ lấy từ máy chủ, đồng hồ chạy từng giây, nền chuyển động bằng CSS, mã xác nhận 4 ký tự lưu vào `CheckIn` và hiện song song trên màn lễ tân.

### 3.5 Bảo mật trang khách
Giới hạn 10 lần tra SĐT mỗi phút cho mỗi thiết bị (NFR-06). Che tên và SĐT (NFR-07). Mã khách phải kèm 4 số cuối SĐT. QR quầy chỉ mở trang, không mang quyền check-in (BR-15).

---

## 4. Ánh xạ 50 ảnh mockup → màn hình và yêu cầu

| Nhóm | Ảnh | Màn (đặc tả) | Yêu cầu | Ưu tiên |
|---|---|---|---|---|
| **Khách (mobile)** | 01 Nhận diện QR | M1 | FR-CI-01, 02, 09 | P1 |
| | 02 Chọn học viên | M1b | FR-CI-03 | P1 |
| | 03 Đăng ký, 04 Đăng ký chờ duyệt | M2 | FR-KH-05 | P1 |
| | 05 Thành công, 06 Cảnh báo, 07 Bị chặn | M3 | FR-CI-04, 05 | P1 |
| | 48 Kiosk | M4 (phương án duy nhất có ảnh) | FR-CI-08 | P2 |
| **Khách hàng** | 08 Thêm hồ sơ | Q3/Q4 | FR-KH-01, 03 | P1 |
| | 09 Duyệt đăng ký | Q3 tab Chờ duyệt | FR-KH-05 | P1 |
| | 10 QR cá nhân | Q4 | FR-KH-06 | P1 |
| | ~~23~~ **chưa có ảnh**, cần thiết kế | Q3 Danh sách khách | FR-KH-02 | P1 |
| | 24 Chi tiết khách (**ảnh chuẩn Q4**) | Q4 | FR-KH-07 | P1 |
| **Bán hàng** | 11 Bán thẻ vé | L3 | FR-BH-01 | P1 |
| | 12 Gia hạn / bán thẻ mới | L4 | BR-21 | P1 |
| | 13 Ghi danh khoá học | L3 | FR-BH-02 | P1 |
| | 14 Thu tiền và đặt cọc | L3/L4 | FR-BH-03, 04 | P1 |
| | 50 Điều chỉnh thẻ (**chuẩn, 5 loại**); 15 là bản cũ, bỏ | Q4 | FR-BH-06 | P1 |
| | 16 Bảo lưu thẻ | Q4 | BR-26 | P1 |
| | 34 Công nợ | — | FR-BH-05 | P1 |
| | 35 Phiếu thu | — | FR-BH-07 | P2 |
| **Vận hành quầy** | 17 Xử lý check-in bị chặn | L5 | BR-11 | P1 |
| | 21 Dashboard tổng quan | Q1 | — | P1 |
| | 22 Danh sách check-in, 40 Check-in thời gian thực | Q2 | FR-CI-06 | P1 |
| | 49 **Check-in hộ** (README ghi nhầm là Kiosk) | Q2 | FR-CI-07 | P1 |
| | 25 Khách sắp hết hạn (chuẩn), 23 (tham khảo tab) | Q5 | FR-CB-01..03 | P1 |
| | 41 Khách hết thẻ chưa mua lại (*ảnh 307×512, độ phân giải thấp*) | — | FR-CB-04 | P2 |
| | 42 Chốt ca | BC-06 | — | P2 |
| **Cấu hình (Q7)** | 19 Cấu hình luật thẻ, 27 Danh mục sản phẩm | Sản phẩm | FR-SP-01..04 | P1 |
| | 28 Quản lý lớp, 31 Thêm lớp | Lớp học | FR-LH-02 | P1 |
| | 29 Quản lý giáo viên, 32 Thêm giáo viên | Giáo viên | FR-LH-01 | P1 |
| | 30 Quản lý mã QR, 33 Tạo QR lớp | Mã QR | FR-LH-03, 04 | P1 |
| | 18 Nhân viên & phân quyền | Nhân viên | FR-HT-02 | P1 |
| | 44 Quản lý cơ sở, 45 Cài đặt trung tâm | Cơ sở, Cấu hình | FR-HT-04 | P1 |
| | 46 Nhật ký thao tác | Nhật ký | FR-HT-03 | P1 |
| | 47 Nhập Excel (*ảnh 307×512*) | — | FR-HT-06 | P1 |
| | 43 Đăng nhập | — | FR-HT-01 | P1 |
| **Báo cáo (Q6)** | 36 BC-01, 37 BC-02, 38 BC-03, 20 BC-04, 39 BC-05 | Báo cáo | mục 9 | P1 |
| | 26 Báo cáo tổng hợp | Q6 | so sánh 3 cơ sở | P1 |

BC-07 Giờ cao điểm đã có dạng heatmap trong ảnh 36.

**Màn P1 chưa có ảnh** (danh sách đầy đủ ở RA_SOAT mục 5):
- Q3 Danh sách khách
- Bản điện thoại cho lễ tân
- M1 có bước 4 số cuối SĐT và nút "Không phải tôi"
- Các nhánh M3: đã check-in hôm nay, sai cơ sở, chờ duyệt/chưa cọc, nhiều người
- QR hết hiệu lực
- Trang khách bản tiếng Anh
- Nhập Excel, xuất Excel
- Khách hôm nay khi mất mạng
- Cài đặt "Thẻ được dùng khi"
- Thẻ chuyển đổi
- Xác nhận tốt nghiệp

---

## 5. Kế hoạch triển khai theo sprint (sprint 2 tuần)

Nhân sự đề xuất: 1 tech lead/backend, 1 fullstack/frontend, 0,5 QA, 0,25 BA/PO (chủ dự án). **Thời lượng là ước lượng ban đầu**, cần chốt lại sau GĐ0.

| Sprint | Mục tiêu | Hạng mục | Ảnh liên quan | Đầu ra kiểm chứng |
|---|---|---|---|---|
| **D0** (song song S0–S1, designer) | Sửa thiết kế | Sửa 20 lỗi mức Cao trong ảnh; vẽ 12 màn P1 còn thiếu; thống nhất 1 kiểu sidebar; thêm menu Thu tiền; xuất design token | — | Bộ ảnh v2 được chủ dự án duyệt trước S2 |
| **S0** (1 tuần) | Nền móng | Repo, CI, Docker, Postgres, schema 14 thực thể, seed, auth, RBAC + scope cơ sở, layout admin mobile/desktop, i18n | 43, 18, 44 | Đăng nhập 3 vai trò, TC-15 qua ở tầng API |
| **S1** | Danh mục và cấu hình | SanPham (form đổi theo loại, xem trước luật bằng câu chữ), cơ sở, giáo viên, lớp, QR lớp/quầy + PDF A5, cài đặt | 19, 27–33, 45 | Nhập toàn bộ bảng giá khảo sát không cần dev (FR-SP-01) |
| **S2** | Khách hàng | CRUD khách + người liên hệ, sinh mã, tìm không dấu, kiểm trùng, QR cá nhân, tab Chờ duyệt | 08–10, 23, 24 | FR-KH-01/02 với 20.000 bản ghi giả dưới 1 giây |
| **S3** | Bán hàng và thu tiền | Bán thẻ (snapshot), ghi danh + bán kèm, giá thực thu + lý do, phiếu thu, cọc, hoàn, công nợ, điều chỉnh, bảo lưu | 11–16, 34, 50 | TC-14, 16, 17 |
| **S4** | **Lõi check-in** | Engine luật, transaction khoá dòng, trang khách M1/M1b/M2/M3 VI/EN, nhớ khách trên máy, rate limit, mã xác nhận | 01–07 | TC-01..13, 18; test tải 100 lượt/5 phút (NFR-02) |
| **S5** | Vận hành quầy | Q1 dashboard, Q2 realtime SSE, check-in hộ, xử lý bị chặn / vượt chặn, Q5 sắp hết + "Đã gọi", nhật ký | 17, 21, 22, 25, 40, 46 | Hiện trên màn lễ tân dưới 3 giây (FR-CI-06) |
| **S6** | Báo cáo và dữ liệu | BC-01..05, so sánh 3 cơ sở, xuất Excel có ghi nhật ký, nhập Excel khách/thẻ cũ, thẻ chuyển đổi | 20, 26, 36–39, 47 | Đối chiếu số liệu với dữ liệu mẫu |
| **S7** (1 tuần) | Cứng hoá | Chạy đủ 18 TC, Playwright E2E L1–L5, kiểm tra trên iOS Safari/Android Chrome, backup/restore, bảo mật, hướng dẫn 15 phút cho lễ tân | — | **Cổng GĐ1: 18/18 TC đạt** |

Tổng P1: khoảng **13 đến 14 tuần** (S0 đến S7).

Sau P1, theo đúng mục 11 của đặc tả:
- **GĐ2 Nhập dữ liệu** (khoảng 1 tuần, trung tâm làm, dev hỗ trợ)
- **GĐ3 Chạy thử cơ sở 2**: chạy song song sổ giấy, cổng là 7 ngày liên tiếp không lệch lượt
- **GĐ4 Mở cơ sở 1 và 3**
- **GĐ5 P2** (khoảng 3 đến 4 tuần): Kiosk M4 (ảnh 48/49), gộp hồ sơ, in phiếu thu 80 mm/PNG, BC-06 chốt ca (42), BC-07, FR-CB-04 (41), nhân bản sản phẩm

---

## 6. Chiến lược kiểm thử

- **Unit**: mỗi TC-01..TC-18 là một test của `checkin/engine` hoặc `billing`, đặt tên theo mã TC để đối chiếu nghiệm thu.
- **Đồng thời**: test 2 request song song cùng một thẻ (TC-07) và 3 cơ sở tạo mã khách cùng lúc.
- **Phân quyền**: gọi thẳng API chéo cơ sở cho mọi endpoint (TC-15).
- **Thời gian**: giả lập đồng hồ (fake clock) cho hết hạn, bảo lưu và qua nửa đêm giờ Việt Nam.
- **E2E**: Playwright chạy viewport iPhone/Android cho trang khách, desktop cho admin.
- **Tải**: k6, 100 check-in trong 5 phút mỗi cơ sở; dữ liệu 20.000 khách và 1 triệu lượt check-in.

---

## 7. Rủi ro và việc cần chốt trước khi code

| # | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R1 | **Đã xác nhận**: mockup có 20 lỗi mức Cao so với đặc tả | Dev làm theo ảnh sai | Đặc tả là chuẩn luật/dữ liệu; checklist trong RA_SOAT mục 3 gắn vào từng ticket; sprint D0 sửa thiết kế |
| R2 | Ảnh 49 thực chất là màn Check-in hộ (P1); Kiosk chỉ còn ảnh 48 | Hiểu nhầm phạm vi | Dùng 48 cho M4 (P2). Chốt Q14 về mã kiosk dạng số |
| R3 | 2 bộ thiết kế (AquaHub / AquaCenter); ảnh 41, 47 nhỏ và khác bộ | Lệch giao diện | Chọn bộ AquaHub, vẽ lại 41, 47 |
| R3b | Ảnh gợi ý tính năng **ngoài đặc tả**: thẻ gia đình dùng chung, luật khung giờ, học phí tháng / hạn nợ, sĩ số lớp, CCCD giáo viên, ví điện tử | Phình phạm vi | Chủ dự án trả lời Q8–Q15; mặc định **không làm** ở v1 |
| R4 | Tên thương hiệu: "AquaHub" trong ảnh, "CT SPORT" trên Drive, pháp nhân chưa có (Q1) | Logo, QR, mã cơ sở | Chốt Q1 trong GĐ0 |
| R5 | 8 giả định A1–A8 và 7 câu hỏi mở Q1–Q7 chưa trả lời | Luật có thể đổi | Trung tâm tick xác nhận. Phần lớn luật đã cấu hình được nên ít rủi ro sửa code |
| R6 | Ghi chú sức khoẻ (Q2) và dữ liệu trẻ em (NFR-08) | Pháp lý | Cần người phụ trách pháp lý xác nhận; mã hoá cột nếu lưu |
| R7 | Giờ cao điểm là giả định (Q6) | Có thể thiếu tài nguyên | Test tải dư ×3 |
| R8 | Ngân sách, ngày chạy thật, ai đứng tên máy chủ và tên miền (Q3, Q7) | Tiến độ, quyền dữ liệu | Chốt trong GĐ0 |

---

## 8. Bước tiếp theo

1. Chủ trung tâm xác nhận đặc tả, A1–A8, Q1–Q7 (GĐ0).
2. Rà 50 ảnh mockup so với đặc tả, đánh dấu ảnh sai hoặc lệch.
3. Khởi tạo repo theo mục 2.1, bắt đầu S0.
