# KinKey: kế hoạch 4 giờ

Mỗi mốc có điểm kiểm tra **ĐẠT / DỪNG**. Không sang bước sau khi bước trước chưa đạt.

## 0:00–0:40 · Dựng TideCloak và đăng nhập được
1. Chạy Docker TideCloak (README, bước 1).
2. `npm init @tidecloak/nextjs@latest tc-setup` để tạo realm, client, admin và bật QEA. Copy `tc-setup/tidecloak.json` vào thư mục gốc của KinKey.
3. Thêm redirect URI `http://localhost:3000/*` và web origin, rồi duyệt trong QEA Approvals.
4. `npm install && npm run dev`, bấm **Sign in with Tide**, tạo tài khoản `mom`.

**ĐẠT:** đăng nhập xong, quay lại app thấy tên `mom`.
**DỪNG:** sau 40 phút vẫn chưa đăng nhập được → hỏi trên Discord của Tide, đồng thời chạy thử `tc-setup` gốc để tách lỗi ra khỏi KinKey.

## 0:40–1:15 · Tạo role và kiểm tra hai người (giả định quan trọng nhất)
1. Tạo 4 role `_tide_medical.*` và `_tide_finance.*`, rồi duyệt.
2. Gán cả 4 role cho `mom`. Tạo tài khoản `lan`, gán `_tide_medical.selfdecrypt`. Duyệt từng thay đổi.
3. Vào trang **Two-person check**: `mom` mã hóa một giá trị `medical` → đăng xuất → `lan` giải mã.

**ĐẠT:** dòng `PASS` hiện ra → đi tiếp.
**DỪNG:** `lan` có role mà vẫn bị từ chối, nghĩa là `selfdecrypt` chỉ giải mã được dữ liệu của chính mình. Chụp lại thông báo lỗi và chuyển sang phương án B:
- mỗi người tự lưu ngăn Y tế của riêng mình;
- câu chuyện demo đổi thành "mỗi thành viên tự giữ, cả nhà cùng duyệt quyền";
- ghi rõ điều này trong README.

## 1:15–2:00 · Biến cả gia đình thành quorum
1. Tạo `minh` và `uncle`, gán `_tide_medical.selfdecrypt`.
2. Biến cả 4 người thành Tide realm admin (theo docs "Set up QEA").
3. Thử nghiệm quorum:
   - Đăng nhập `lan`, tạo yêu cầu gán `_tide_finance.selfdecrypt` cho `lan`.
   - Chỉ `lan` duyệt → kiểm tra chưa commit.
   - `minh` duyệt → kiểm tra có commit chưa.
   - `uncle` duyệt → phải commit.
4. Ghi lại **chính xác** cần bao nhiêu chữ ký thì commit. Con số này sẽ dùng trong README và video.

**ĐẠT:** có ngưỡng rõ ràng, và 1 chữ ký là chưa đủ. Ghi vào `docs/VERIFICATION.md` (V5, V10).
**DỪNG:** 1 chữ ký đã commit → video không được nói "cần đa số". Sửa README theo đúng kết quả quan sát được.

Sau khi test xong: **thu hồi** `_tide_finance.selfdecrypt` của `lan` (cũng cần duyệt) để quay demo từ trạng thái khóa.

## 2:00–2:30 · Dữ liệu demo và tập chạy
1. `mom` → **Empty the safe** → **Load demo contents**.
2. Chạy lại toàn bộ kịch bản trong README hai lần, bấm giờ.
3. Mở **What a thief sees** để chắc chắn chỉ thấy ciphertext.

## 2:30–3:20 · Quay video (≤ 2 phút)
Theo đúng 4 phần của đề: Possibility → Constraint → Prototype → What changes.
- Màn hình chia đôi: cửa sổ ẩn danh cho `lan`, cửa sổ thường cho tide-console.
- Quay **cảnh 1 chữ ký chưa đủ**. Đây là bằng chứng mạnh nhất.
- Kết video bằng lá thư của mẹ, câu cuối: *"KinKey. Opened together, or not at all."*

## 3:20–3:45 · Nén và đưa video vào repo
```bash
ffmpeg -i raw.mov -vcodec libx264 -crf 28 -preset slow -acodec aac docs/kinkey-demo.mp4
ls -lh docs/kinkey-demo.mp4   # phải < 100 MB
```
Thêm dòng `Demo video: docs/kinkey-demo.mp4` vào README, ngay dưới overview.

## 3:45–4:00 · Nộp bài
- [ ] Cập nhật bảng "Status" trong README theo kết quả thật (PASS hoặc phương án B, số chữ ký thực tế).
- [ ] `tidecloak.json` **không** commit (đã có trong `.gitignore`).
- [ ] Repo để public, MP4 nằm trong repo.
- [ ] Clone repo về máy khác, làm theo README thử một lần nếu còn thời gian.

## Lưu ý về mô hình
KinKey dùng **Model A**: quorum duyệt việc *cấp chìa*, không duyệt từng lần mở. Video không được nói "mỗi lần mở đều được ký". Hãy nói "chìa vào ngăn tài chính chỉ được cấp khi cả nhà duyệt".

## Nguyên tắc khi quay
Không nói điều gì chưa thấy tận mắt. Nếu một bước không đạt, đổi lời thoại chứ không làm giả giao diện.
