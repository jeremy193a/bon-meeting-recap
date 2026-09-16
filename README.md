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
│   │   ├── gemini.ts     # Google GenAI File API & structured generation
│   │   └── storage.ts    # File-based storage operations
│   └── utils/
│       └── formatters.ts # Markdown formatter & helpers
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/config` | Kiểm tra trạng thái API key và model đang dùng |
| `GET` | `/api/meetings` | Danh sách tóm tắt tất cả các cuộc họp |
| `GET` | `/api/meetings/:id` | Chi tiết một cuộc họp (Recap, topics, tasks) |
| `GET` | `/api/meetings/:id/markdown` | Tải file Markdown (.md) của cuộc họp |
| `GET` | `/api/meetings/:id/audio` | Nghe/stream file âm thanh của cuộc họp |
| `POST` | `/api/meetings/process` | Upload file audio và kích hoạt Gemini phân tích |
| `POST` | `/api/meetings/:id/action-items/:index/toggle` | Tick/untick trạng thái hoàn thành task |
| `DELETE` | `/api/meetings/:id` | Xóa cuộc họp và file âm thanh liên quan |
