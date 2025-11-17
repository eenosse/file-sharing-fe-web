# File Sharing Frontend Project

## Tổng Quan Dự Án

Đây là repository chứa mã nguồn **Front-end** (Next.js App Router) cho hệ thống chia sẻ file bảo mật. Hệ thống cho phép người dùng upload file tạm thời, chia sẻ qua link, bảo vệ bằng mật khẩu/TOTP và quản lý thời gian hiệu lực linh hoạt.

Frontend sẽ tương tác chặt chẽ với Backend API để xử lý các nghiệp vụ: Authentication, File Management, Access Control và System Administration.

### Tech Stack

  * **Framework:** Next.js 14+ (App Router)
  * **Language:** TypeScript
  * **Styling:** Tailwind CSS
  * **State Management:** React Hooks / Context API
  * **HTTP Client:** Axios (Khuyên dùng để xử lý Interceptor dễ dàng hơn)

-----

## Phân Chia Công Việc (Team Assignments)

Công việc được chia theo các module chức năng chính. Mỗi thành viên chịu trách nhiệm từ giao diện (UI) đến logic gọi API (Integration) cho phần của mình.

| STT | Module | Người Phụ Trách | Chi Tiết Nhiệm Vụ & Logic Frontend | API Endpoints |
| :-- | :--- | :--- | :--- | :--- |
| **1** | **Auth & TOTP** | **Bảo Minh** | - **Login:** Xử lý flow đăng nhập thường & đăng nhập 2 bước (khi server trả về `requireTOTP: true`).<br>- **Register:** Form đăng ký validation.<br>- **TOTP Setup:** Hiển thị QR Code (base64 từ API), xác thực mã OTP để kích hoạt 2FA.<br>- **Lưu trữ:** Quản lý Token (JWT) trong LocalStorage/Cookies. | `/api/auth/register`<br>`/api/auth/login`<br>`/api/auth/login/totp`<br>`/api/auth/totp/setup`<br>`/api/auth/totp/verify` |
| **2** | **User Dashboard** | **Minh Quan** | - **Danh sách file:** Hiển thị dạng bảng/grid, tích hợp phân trang (`page`, `limit`).<br>- **Bộ lọc:** Filter theo trạng thái (`active`, `expired`, `pending`).<br>- **Xử lý UI:** Hiển thị thời gian còn lại (hoursRemaining), nút Copy Link, nút Xóa file.<br>- **Error handling:** Xử lý khi token hết hạn (logout user). | `/api/files/my`<br>`/api/files/:id` (DELETE) |
| **3** | **Upload File** | **Khánh** | - **Form Upload:** Xử lý Multipart/form-data.<br>- **Cấu hình nâng cao:**<br>  + Toggle Password input.<br>  + Date Picker cho `AvailableFrom` & `AvailableTo` (Validate logic: From \< To).<br>  + Nhập danh sách email (`sharedWith`).<br>  + Checkbox `EnableTOTP`.<br>- **Validation:** Check file size, extension trước khi gửi. | `/api/files/upload` |
| **4** | **Access & Download** | **Minh Thức** | - **Trang Download (`/f/:token`):** Gọi API lấy metadata file.<br>- **Xử lý trạng thái File:**<br>  + 🟢 Active: Hiện nút download.<br>  + 🟡 Pending (423): Hiện đồng hồ đếm ngược/thông báo chưa đến giờ.<br>  + 🔴 Expired (410): Hiện thông báo file đã bị xóa.<br>- **Bảo mật:** Popup nhập Password hoặc TOTP code nếu file yêu cầu.<br>- **Download:** Gọi API download với headers/params phù hợp. | `/api/files/:shareToken`<br>`/api/files/:shareToken/download` |
| **5** | **Admin System** | **Trung Kiên** | - **Admin Dashboard:** Trang riêng cho Admin (cần check Role).<br>- **System Policy:** Xem và chỉnh sửa cấu hình hệ thống (Max file size, Max validity days...).<br>- **Cleanup:** UI để trigger thủ công lệnh dọn dẹp file rác (nếu cần demo).<br>- **Interceptor:** Cấu hình Axios Interceptor chung cho toàn team (xử lý đính kèm Bearer Token tự động). | `/api/admin/policy`<br>`/api/admin/cleanup` |

-----

## 📂 Cấu Trúc Thư Mục (App Router)

Để đảm bảo code gọn gàng và dễ merge, thống nhất cấu trúc như sau:

```bash
app/
├── (auth)/                 # Route Group cho Authentication (Bảo Minh)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── totp-setup/page.tsx
├── (dashboard)/            # Route Group cho User đã login (Minh Quan)
│   ├── dashboard/page.tsx
│   └── my-files/page.tsx
├── (public)/               # Public Access (Minh Thức)
│   └── f/
│       └── [shareToken]/page.tsx
├── admin/                  # Admin Routes (Trung Kiên)
│   └── settings/page.tsx
├── upload/                 # Upload Page (Khánh)
│   └── page.tsx
├── layout.tsx              # Root Layout
└── page.tsx                # Homepage
```

-----

## Quy Tắc Phát Triển (Development Rules)

### 1\. Xử lý API Response & HTTP Codes

Mọi người **BẮT BUỘC** phải xử lý các mã lỗi HTTP đặc thù từ Backend, không chỉ check `status === 200`.

  * **401 Unauthorized:** Redirect về trang Login ngay lập tức.
  * **403 Forbidden:**
      * *Module Download:* Hiển thị input nhập Password hoặc thông báo "Bạn không có quyền".
      * *Module Khác:* Thông báo lỗi toast "Access Denied".
  * **423 Locked (Module Download):** Hiển thị UI "File chưa đến giờ mở" ( kèm thời gian `availableFrom`).
  * **410 Gone (Module Download):** Hiển thị UI "File đã hết hạn hoặc bị xóa".

### 2\. Components & Hooks

  * **API Call:** Không gọi `fetch/axios` trực tiếp trong Component. Hãy tạo file trong `src/services/` (ví dụ: `authService.ts`, `fileService.ts`).
  * **UI Components:** Sử dụng lại các component chung trong `src/components/ui` (Button, Input, Modal...) để đồng bộ giao diện.

### 3\. Git Workflow & Commit Convention

Sử dụng prefix rõ ràng để biết commit thuộc về  module nào:

  * `auth: ...` (Bảo Minh)
  * `dash: ...` (Minh Quan)
  * `upload: ...` (Khánh)
  * `access: ...` (Minh Thức)
  * `admin: ...` (Trung Kiên)

Ví dụ:

> `upload: add validation for availableFrom date`
> `access: handle 410 gone error ui`

-----

## Getting Started

1.  **Clone repository:**
    ```bash
    git clone <repo-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Setup Environment:** (Setup later)
    Tạo file `.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080/api
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## Notes
- Should factor to components
- MUST create pull request for the commit