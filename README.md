# Bon Meeting Recap

Ứng dụng tạo biên bản họp, Action Items và transcript từ file audio. AI chạy qua **AGY** (`gemini-3.8-flash-low` mặc định), dùng phiên đăng nhập AGY có sẵn trên máy chủ — **không cần Gemini API key**.

## Chạy trực tiếp trên Windows

Điều kiện: `agy` đã đăng nhập và `agy models` hiển thị Gemini 3.8 Flash.

```bash
copy .env.example .env
pnpm install
pnpm build
pnpm start
```

Mở `http://localhost:3300`. Ở chế độ này app gọi trực tiếp `agy.exe`.

## Docker (khuyến nghị để deploy)

Docker Linux không dùng trực tiếp được phiên đăng nhập của `agy.exe` trên Windows. Vì vậy app container gọi **AGY Host Bridge** cục bộ; bridge chạy trên Windows host và chỉ gọi CLI đã auth. Audio được bind mount tại `./data`, nên bridge và container cùng thấy một file.

1. Tạo `.env` từ `.env.example`, điền các giá trị sau:

```env
AGY_BRIDGE_TOKEN=<random-secret-32-plus-chars>
AGY_BRIDGE_URL=http://host.docker.internal:3310/v1/agy
AGY_HOST_DATA_DIR=C:/Users/Admin/Desktop/Bonario/bon-meeting-recap/data
SESSION_SECRET=<random-secret>
```

2. Chạy bridge trong một terminal trên Windows host:

```bat
start-agy-bridge.bat
```

Bridge đọc `AGY_BRIDGE_TOKEN` từ `.env`; giữ terminal này chạy. Có thể dùng NSSM/PM2 để chạy script này như Windows service nếu cần tự khởi động lại.

3. Trong terminal khác, build và chạy app:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f bon-meeting-recap
```

Bridge không được expose ra Internet; token là bắt buộc. Đổi `AGY_MODEL` thành `gemini-3.8-flash-medium` nếu ưu tiên chất lượng hơn tốc độ.

## CI/CD

- GitHub Actions chạy CI cho mọi push/PR vào `main`: cài dependencies, type-check và build Docker image.
- Trên Windows deployment host, chạy một lần `start-github-deploy-watcher.bat`. Worker kiểm tra `origin/main` mỗi 60 giây; khi có commit mới, nó hard-reset source đã clone, chạy `docker compose up -d --build` và chờ container healthy.
- `.env` và `data/` là untracked/ignored nên không bị ghi đè khi deploy.

## Cloudflare Tunnel

`docker-compose.yml` tham gia mạng external `bonario-shared-tunnel`. Thêm ingress sau vào `../tunnel-master/config/config.yml`:

```yaml
- hostname: recap.bonstu.site
  service: http://bon-meeting-recap:3300
  originRequest:
    noTLSVerify: true
```

Sau đó đảm bảo DNS hostname `recap.bonstu.site` trỏ đến tunnel Cloudflare và kiểm tra:

```bash
curl https://recap.bonstu.site/api/health
```

## API

- `GET /api/health` — Docker/monitor healthcheck.
- `POST /api/meetings/process` — upload audio và tạo recap qua AGY.
- Các endpoint Odoo, tải Markdown/Word/Excel, stream audio và Action Items giữ nguyên.

## Lưu trữ

Dữ liệu theo user Odoo được lưu tại `data/users/<uid>/`; thư mục này được mount ra host trong Docker để không mất dữ liệu khi rebuild container.
