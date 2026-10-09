# Phần mềm quản lý khách trung tâm bơi (CT Sport)

Web app thay sổ giấy và thẻ giấy cho trung tâm bơi 3 cơ sở. Khách quét QR → tự check-in → hệ thống tự trừ lượt thẻ vé, chặn khách hết lượt và hiện màn xanh/vàng/đỏ chống chụp màn hình. Lễ tân và quản lý bán thẻ, ghi danh khoá học, thu tiền, cọc, gia hạn, bảo lưu. Chủ trung tâm xem báo cáo so sánh 3 cơ sở.

Căn cứ: `docs/` (đặc tả tóm tắt, phương án dev, rà soát 50 ảnh mockup).

## Công nghệ

| Phần | Dùng |
|---|---|
| Ứng dụng | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| CSDL | PostgreSQL 16 (Neon trên Vercel), Drizzle ORM, migration SQL trong `drizzle/` |
| Giao diện | Tailwind CSS 4, font Be Vietnam Pro, icon lucide |
| Khác | jose (phiên đăng nhập), bcryptjs, qrcode, exceljs |
| Test | Vitest: 53 ca, gồm toàn bộ bộ ca 11.3 của đặc tả, chạy trên Postgres thật |

## Chạy trên máy

```bash
cp .env.example .env            # sửa DATABASE_URL, AUTH_SECRET
npm install
npm run db:migrate              # tạo bảng
npm run db:seed                 # dữ liệu nền: cài đặt, 3 cơ sở, tài khoản Chủ, sản phẩm "Thẻ chuyển đổi"
npm run db:seed -- --demo       # (tuỳ chọn) dữ liệu demo: nhân viên, sản phẩm mẫu, lớp, QR, 60+ khách, 30 ngày check-in
npm run dev
```

Tài khoản Chủ tạo ở bước seed: nếu không đặt `SEED_OWNER_PASSWORD`, mật khẩu ngẫu nhiên được ghi vào `.seed-credentials.txt` (đã nằm trong `.gitignore`). Đổi mật khẩu ngay ở mục **Đổi mật khẩu**.

Kiểm tra:

```bash
npm test          # cần Postgres: TEST_DATABASE_URL (mặc định postgres://localhost:5432/ctsport_test)
npm run typecheck
npm run build
```

## Triển khai Vercel

1. Tạo CSDL Postgres (Neon, vùng Singapore theo NFR-09) và gắn vào project: biến `DATABASE_URL`.
2. Đặt biến môi trường `AUTH_SECRET` (chuỗi ngẫu nhiên ≥ 32 ký tự), tuỳ chọn `APP_URL` (VD `https://ten-mien.vn`, dùng để in QR).
3. Chạy migration và seed với `DATABASE_URL` của production:
   ```bash
   DATABASE_URL=... npm run db:migrate
   DATABASE_URL=... SEED_OWNER_EMAIL=... SEED_OWNER_PASSWORD=... npm run db:seed
   ```
4. Deploy: `vercel --prod` hoặc push lên nhánh chính (đã nối GitHub).

## Bản đồ màn hình

| Đường dẫn | Màn | Ai dùng |
|---|---|---|
| `/c/<token>` | M1 nhận diện → M1b chọn khách → M3 kết quả; M2 đăng ký; VI/EN | Khách (không đăng nhập) |
| `/q/<token>` | Trang trung tính khi quét QR cá nhân bằng điện thoại | Khách |
| `/kiosk` | M4 ki-ốt máy tính bảng: camera/máy quét QR cá nhân, gõ mã khách | Quầy (đăng nhập nhân viên) |
| `/admin` | Q1 tổng quan hôm nay | Tất cả |
| `/admin/checkin` | Q2 danh sách check-in thời gian thực, check-in hộ, vượt chặn | Tất cả (vượt chặn: Chủ, Quản lý) |
| `/admin/khach` | Q3 danh sách khách, tab Chờ duyệt | Tất cả |
| `/admin/khach/<id>` | Q4 chi tiết: thẻ vé, khoá học, check-in, thanh toán, lịch sử điều chỉnh | Tất cả (theo cơ sở) |
| `/admin/sap-het` | Q5 sắp hết hạn, đã gọi, khách hết thẻ chưa mua lại | Tất cả |
| `/admin/thu-tien` | Công nợ, phiếu thu | Tất cả |
| `/admin/hom-nay` | Danh sách khách hôm nay để in sẵn khi mất mạng (NFR-05) | Tất cả |
| `/admin/bao-cao` | BC-01 → BC-07, so sánh cơ sở | Chủ, Quản lý |
| `/admin/san-pham` | Danh mục khoá học, thẻ vé, xem trước luật | Chủ sửa, còn lại xem |
| `/admin/lop`, `/admin/giao-vien`, `/admin/qr` | Lớp, giáo viên, mã QR in A5 | Chủ, Quản lý |
| `/admin/nhap-excel` | Nhập khách cũ + thẻ giấy | Chủ, Quản lý |
| `/admin/nhan-vien`, `/admin/cai-dat`, `/admin/nhat-ky` | Tài khoản, cài đặt, nhật ký | Chủ |

## Đối chiếu yêu cầu chính

| Yêu cầu | Cách làm | Kiểm chứng |
|---|---|---|
| BR-01 → BR-13, BR-19, BR-23, BR-26 | `src/lib/checkin-engine.ts`: hàm thuần, không gọi CSDL | `tests/engine.test.ts` |
| NFR-03 đúng số lượt | Giao dịch khoá dòng theo khách (`SELECT … FOR UPDATE`), quét lại trong 5 phút trả kết quả cũ | TC-07: 5 lượt quét đồng thời chỉ trừ 1 |
| BR-22 chụp luật khi bán | Thẻ vé lưu bản sao toàn bộ luật sản phẩm | TC-16 |
| BR-14 chống ảnh chụp màn hình | Ngày giờ máy chủ, đồng hồ chạy theo giờ máy chủ, hiệu ứng chuyển động, mã xác nhận 4 ký tự hiện cả ở màn lễ tân | Màn `/c/...`, `/admin/checkin` |
| D3 mã tự sinh | Bộ đếm nguyên tử trong CSDL: `LT00125`, `TV2600341`, `DH2600877`, `PT2600001` | Test 12 khách tạo đồng thời |
| D4 cách ly cơ sở | Kiểm tra ở máy chủ cho mọi trang/hành động; truy cập chéo bị từ chối và ghi nhật ký | TC-15 |
| FR-CI-06 dưới 3 giây | Màn lễ tân hỏi mốc mới mỗi 2 giây, có lượt mới thì tải lại | `/api/admin/checkins` |
| NFR-06 chống dò SĐT | 10 lần tra/phút/thiết bị, 60/phút/IP; trang khách che tên và SĐT | Kiểm thử thủ công: lần thứ 11 trả 429 |
| NFR-13 giờ Việt Nam | Mọi ngày tính theo UTC+7 từ giờ máy chủ | `src/lib/time.ts` |
| FR-HT-06 nhập Excel | Kiểm tra toàn file, báo dòng lỗi, nhập trong 1 giao dịch | `tests/import-guest.test.ts` |

## Quyết định tạm (chờ trung tâm xác nhận)

Theo giả định A1–A8 trong đặc tả, cộng thêm:

- **Màn kết quả với lượt quét thứ 2 trong ngày** (BR-04): hiện màu vàng "Đã check-in hôm nay lúc hh:mm", không tạo lượt mới.
- **Vượt chặn**: cho vào 1 lần, không trừ lượt, ghi `VUOT_CHAN` kèm lý do.
- **Bảo lưu**: hạn thẻ được dời ngay khi tạo kỳ bảo lưu. "Mở khoá" kết thúc bảo lưu sớm và trả lại số ngày chưa dùng.
- **Mã phiếu thu**: dạng `PT[yy][5 số]` (đặc tả chưa quy định).
- **Hồ sơ tự đăng ký bị từ chối**: chuyển trạng thái Ngừng và ghi lý do vào ghi chú (câu hỏi Q13).
- **Ghi chú sức khoẻ**: đã có trường lưu nhưng không bắt buộc nhập (chờ câu hỏi Q2).
- **Ngoài phạm vi v1, không làm**: thẻ gia đình dùng chung, luật theo khung giờ, học phí tháng, sĩ số lớp, ví điện tử, gửi Zalo/SMS (xem `docs/RA_SOAT_50_ANH.md`).
- **PDF**: QR A5 và phiếu thu 80 mm dùng hộp thoại In của trình duyệt (In / Lưu PDF). Phiếu thu tải được ảnh PNG.
