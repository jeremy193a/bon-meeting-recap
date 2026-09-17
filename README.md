# Bon Meeting Recap 🎙️✨

Ứng dụng tóm tắt biên bản họp tự động (Meeting Recap & Action Items) tinh gọn (Lean Stack) bằng **Gemini Multimodal Audio (Gemini 2.0 Flash)** và **Hono (TypeScript)**.

---

## ⚡ Điểm nổi bật & Triết lý thiết kế (Lean Architecture)

* **Zero Over-engineering**: Không cần Next.js cồng kềnh, không cần cài PostgreSQL/Prisma phức tạp, không cần build step frontend.
* **File-based Storage**: Dữ liệu cuộc họp được lưu trữ trực tiếp dưới dạng file `.json` và `.md` (Markdown) trong thư mục `data/meetings/` — dễ đọc, dễ backup, mở trực tiếp bằng Obsidian / VSCode / Notion.
* **Native Gemini Audio Ingestion**: Gemini tự ingest trực tiếp file audio qua File API, tự nhận biết ngữ âm tiếng Việt & thuật ngữ kỹ thuật (Vietglish), tạo ra bản recap chuẩn hóa theo JSON schema.
* **Tính năng trên Web UI**:
  * 📁 **Kéo thả upload** file audio (`.mp3`, `.wav`, `.m4a`, `.webm`, `.ogg`, `.flac`).
  * 🎙️ **Ghi âm trực tiếp từ trình duyệt** (In-browser audio recording qua mic).
  * 🔊 **Trình phát âm thanh (Audio Player)** tích hợp để nghe lại cuộc họp.
  * ✅ **Checklist Action Items tương tác**: Click tick/untick hoàn thành nhiệm vụ theo thời gian thực.
  * 📋 **1-click Copy & Download**: Xuất toàn bộ nội dung ra Markdown (`.md`) chuẩn.
  * 🔑 **Cấu hình API Key linh hoạt**: Cấu hình qua `.env` hoặc nhập trực tiếp ngay trên giao diện web (lưu trong browser).

---

## 🚀 Khởi động nhanh (Quickstart)

### 1. Cài đặt dependencies (đã cài sẵn)

```bash
pnpm install
```

### 2. Cấu hình Gemini API Key

Tạo key miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey).

Mở file `.env` và điền key:
```env
GEMINI_API_KEY=AIzaSy...
PORT=3300
GEMINI_MODEL=gemini-2.0-flash
```
*(Hoặc để trống và nhập trực tiếp trên giao diện Web khi mở lên)*

### 3. Khởi chạy Server

* Chế độ Development (tự reload khi sửa code):
  ```bash
  pnpm dev
  ```

* Hoặc chạy trực tiếp:
  ```bash
  pnpm start
  ```

Mở trình duyệt tại: **http://localhost:3300**

---

## 📂 Cấu trúc thư mục

```
bon-meeting-recap/
├── data/
│   ├── meetings/         # Lưu trữ kết quả {id}.json và {id}.md
│   └── uploads/          # Lưu trữ file âm thanh đã upload/ghi âm
├── public/
│   ├── index.html        # Giao diện SPA (Tailwind CSS CDN + Lucide icons)
│   └── app.js            # Client-side logic & Audio recorder
├── src/
│   ├── index.ts          # Hono HTTP server & API endpoints
│   ├── config.ts         # Environment configuration
│   ├── types.ts          # Strict TypeScript interfaces
│   ├── services/
│   │   ├── gemini.ts     # Google GenAI File API, auto-retry & fallback model
│   │   ├── storage.ts    # User data isolation (data/users/<uid>/)
│   │   ├── excel.ts      # Standard WBS Excel generator (14 columns)
│   │   └── odoo.ts       # Odoo JSON-RPC SSO & excel-to-odoo-project bridge
│   └── utils/
│       └── formatters.ts # Markdown formatter & helpers
├── start-windows.bat     # One-click startup script cho Windows Server
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập Odoo SSO (Email + Password/API Key) |
| `POST` | `/api/auth/logout` | Đăng xuất và xóa phiên làm việc |
| `GET` | `/api/auth/me` | Lấy thông tin user Odoo hiện tại |
| `GET` | `/api/config` | Trạng thái API key và model đang dùng |
| `GET` | `/api/meetings` | Danh sách các cuộc họp của user hiện tại |
| `GET` | `/api/meetings/:id` | Chi tiết một cuộc họp (Recap, topics, tasks) |
| `GET` | `/api/meetings/:id/markdown` | Tải file Markdown (.md) của cuộc họp |
| `GET` | `/api/meetings/:id/excel` | Tải file Excel WBS Scrum chuẩn hóa 14 cột |
| `GET` | `/api/meetings/:id/audio` | Nghe/stream file âm thanh của cuộc họp |
| `POST` | `/api/meetings/process` | Upload file audio và kích hoạt Gemini phân tích |
| `POST` | `/api/meetings/:id/action-items/:index/toggle` | Tick/untick trạng thái hoàn thành task |
| `POST` | `/api/meetings/:id/push-odoo` | Đẩy Action Items lên Odoo thành Project & Tasks (bắt buộc disclaimer) |
| `DELETE` | `/api/meetings/:id` | Xóa cuộc họp và file âm thanh liên quan |

---

## 🖥️ Hướng dẫn Triển khai Windows Server chạy 24/7

Dự án được thiết kế để triển khai trên máy chủ Windows nội bộ tại công ty.

### Cách 1: Chạy nhanh bằng Batch Script (Khuyên dùng khi test)
Nhấp đúp vào file `start-windows.bat`. Script sẽ tự động:
1. Cài đặt các gói dependencies cần thiết (`pnpm install`).
2. Biên dịch TypeScript sang JavaScript (`pnpm build`).
3. Khởi chạy HTTP Server trên cổng `3300`.

### Cách 2: Chạy như Windows Service chạy 24/7 (Tự khởi động cùng Windows)

Sử dụng công cụ **NSSM (Non-Sucking Service Manager)** hoặc **PM2**:

#### Sử dụng PM2 (Đơn giản nhất):
```powershell
# 1. Cài đặt pm2 toàn cục (nếu chưa có)
npm install -g pm2 pm2-windows-startup

# 2. Cấu hình tự khởi động cùng Windows
pm2-startup install

# 3. Khởi chạy server bon-meeting-recap
cd C:\path\to\bon-meeting-recap
pm2 start dist/index.js --name "bon-recap"

# 4. Lưu trạng thái khởi động cùng Windows
pm2 save
```

#### Sử dụng NSSM:
1. Tải [NSSM](https://nssm.cc/download) về máy.
2. Mở PowerShell Administrator:
   ```powershell
   nssm install BonMeetingRecap "C:\Program Files\nodejs\node.exe" "C:\path\to\bon-meeting-recap\dist\index.js"
   nssm set BonMeetingRecap AppDirectory "C:\path\to\bon-meeting-recap"
   nssm start BonMeetingRecap
   ```

