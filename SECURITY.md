# Bảo mật

Báo lỗ hổng: gửi riêng cho chủ dự án, không mở issue công khai.

## Kết quả rà soát 10/10/2026

| Hạng mục | Kết quả |
|---|---|
| Thư viện chạy trên production (`npm audit --omit=dev`) | 0 lỗ hổng. `postcss` (trong Next.js) và `uuid` (trong exceljs) được ép lên bản đã vá qua `overrides` |
| Thư viện chỉ dùng khi phát triển | Còn cảnh báo ở `eslint-config-next` (braces/micromatch) và `drizzle-kit` (esbuild). Không có trong bản deploy; npm chỉ đề xuất hạ xuống bản cũ nên giữ nguyên |
| Bí mật trong mã nguồn và lịch sử git | Không có. `.env*`, file mật khẩu seed, `.vercel` nằm trong `.gitignore` |
| Xác thực server action / API | 37/37 server action và mọi API kiểm tra đăng nhập + quyền trước khi chạy |
| Cách ly cơ sở (D4) | Kiểm tra ở máy chủ cho mọi trang, action, xuất file; truy cập chéo bị từ chối và ghi nhật ký (test TC-15) |
| SQL injection | Chỉ dùng truy vấn tham số hoá; `sql.raw` duy nhất nhận số đã ép kiểu `Number()` |
| XSS | React tự escape; `dangerouslySetInnerHTML` chỉ cho SVG mã QR do máy chủ sinh |
| Đăng nhập | bcrypt; khoá 15 phút sau 5 lần sai mỗi tài khoản; tối đa 20 lần/phút/IP; so mật khẩu giả khi tài khoản không tồn tại để không dò được tài khoản qua thời gian phản hồi; phiên httpOnly, Secure, SameSite=Lax, huỷ khi đổi mật khẩu/quyền |
| Trang khách | Tra SĐT tối đa 10 lần/phút/thiết bị và 60/phút/IP; che tên và SĐT trước khi xác nhận; mã khách phải kèm 4 số cuối SĐT; token chọn khách hết hạn sau 10 phút |
| Thông báo lỗi | Chỉ lỗi nghiệp vụ hiện cho người dùng; lỗi hệ thống hiện thông báo chung, chi tiết chỉ ghi log máy chủ |
| HTTP headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (chỉ cho camera cùng nguồn) |
| Dữ liệu cá nhân (NFR-08) | Xuất toàn bộ dữ liệu 1 khách (JSON) và xoá dữ liệu cá nhân bằng ẩn danh hoá, có ghi nhật ký. Mọi lần xuất Excel ghi nhật ký |
| CSRF | Server action của Next.js kiểm tra Origin; cookie SameSite=Lax |

## Việc cần làm khi chạy thật

- Đổi mật khẩu tài khoản Chủ và khoá/xoá các tài khoản nhân viên demo.
- Xoá dữ liệu demo, seed lại dữ liệu nền.
- Đặt `AUTH_SECRET` mới nếu nghi ngờ lộ (mọi phiên sẽ phải đăng nhập lại).
- Nâng gói Neon có sao lưu theo thời điểm khi dùng thật (NFR-09: sao lưu hằng ngày, giữ 30 bản).
