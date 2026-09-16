# Họp Sprint Review 4 & Kế hoạch Odoo
> **Thời gian tạo:** 17:56:50 16/9/2026 | **Ngôn ngữ:** vi
> **Người tham dự:** Quang Hà, Tuấn Backend, Lan Frontend
> **Mục tiêu cuộc họp:** Thống nhất chuẩn Excel import vào Odoo và phân công việc tuần (Đã đạt được)

## 📌 Tóm Tắt Tổng Quan (Executive Summary)
Team đã thống nhất quy trình bóc tách Action Items từ biên bản họp ra file Excel chuẩn để import thẳng vào Odoo Project. Đã phân công rõ người phụ trách, thời hạn và tiêu chí nghiệm thu.

## ⚖️ Quyết Định Then Chốt (Key Decisions)
- Áp dụng định dạng Excel 2 sheet (Tasks và Overview) chuẩn hoá cho Odoo
- Mọi Action Item bắt buộc phải có Assignee và Deadline cụ thể

## ✅ Nhiệm Vụ & Phân Công (Action Items - Odoo Ready)
- [x] **Thiết kế cấu trúc cột Excel chuẩn Odoo Task Import** [Phụ trách: **Quang Hà**] (Hạn: 18/09/2026) 🚨 [HIGH]
  > *Mô tả:* Tạo 2 sheet: Action Items có cột ID, Task Name, Assignee, Deadline và Sheet Overview.
- [ ] **Tích hợp endpoint export Excel vào Hono server** [Phụ trách: **Tuấn Backend**] (Hạn: 19/09/2026)
  > *Mô tả:* Dùng thư viện exceljs trả về application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- [ ] **Kiểm thử workflow import Excel vào Odoo Project module** [Phụ trách: **Lan Frontend**] (Hạn: 20/09/2026) 🟢 [LOW]
  > *Mô tả:* Test import file .xlsx vào Odoo 17/18 để kiểm tra mapping cột tên task, người làm và ngày hết hạn.

## ❓ Vấn Đề Chưa Chốt (Open Questions)
- ⚠️ Odoo version trên server công ty đang chạy là v17 hay v18 để map trường stage_id? *(Chờ phản hồi từ: **Quang Hà**)*

## ⚠️ Cảnh Báo Rủi Ro (Risks & Blockers)
- 🛑 File ghi âm trên 2 tiếng có thể vượt quá timeout upload của mobile nếu mạng yếu, cần hỗ trợ nén bitrate trước khi gửi

## 🔍 Chi Tiết Nội Dung (Topics Breakdown)
### Quy trình Odoo Workflow & Next Actions
Thảo luận cách kết nối Action Items sau họp trực tiếp vào hệ thống quản lý công việc

  * Giai đoạn 1: Xuất file Excel chuẩn hóa để người dùng tự review và import Odoo
  * Giai đoạn 2: Tích hợp trực tiếp Odoo XML-RPC / REST API để tự động sinh Task
