import fs from 'node:fs/promises';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '1E293B', // Slate 800
          },
          paragraph: {
            spacing: { line: 276, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Document Header / Title
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: 'BON MEETING RECAP — TỔNG HỢP TÍNH NĂNG CỐT LÕI',
                bold: true,
                size: 32, // 16pt
                color: '1E40AF',
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'Hệ thống: ', bold: true, color: '475569' }),
              new TextRun({ text: 'Bon Meeting Recap (AI-Powered Meeting Assistant)   |   ' }),
              new TextRun({ text: 'Domain: ', bold: true, color: '475569' }),
              new TextRun({ text: 'https://recap.quangha.me   |   ' }),
              new TextRun({ text: 'Phiên bản: ', bold: true, color: '475569' }),
              new TextRun({ text: 'v1.0 (Lean Edition)' }),
            ],
            spacing: { after: 160 },
          }),

          // Objective / Vision Callout
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.SINGLE, size: 24, color: '2563EB' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: '🎯 Mục tiêu thiết kế (DoD): ', bold: true, color: '1E40AF' }),
                          new TextRun({
                            text: 'Giải phóng đội ngũ khỏi việc ghi chép thủ công; tập trung 100% thảo luận trong cuộc họp. Tự động bóc tách cam kết (Commitments) và kế hoạch hành động (Next Actions) chuẩn hóa theo từng người phụ trách để đưa vào quy trình quản trị thực thi (Odoo ERP).',
                            italics: true,
                            color: '334155',
                          }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: 'F1F5F9', fill: 'F1F5F9' },
                    margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 } }),

          // 1. Nhóm Audio Ingestion
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: '1. Tiếp Nhận & Ghi Âm Đa Kênh (Audio Ingestion)', bold: true, size: 26, color: '1E3A8A' }),
            ],
            spacing: { before: 180, after: 100 },
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Ghi âm 1 chạm trực tiếp trên trình duyệt: ', bold: true }),
              new TextRun({ text: 'Hỗ trợ ghi âm ngay trên điện thoại (Safari/Chrome Mobile) và máy tính mà không cần cài đặt thêm phần mềm.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tải lên đa định dạng âm thanh: ', bold: true }),
              new TextRun({ text: 'Chấp nhận mọi định dạng phổ biến: ' }),
              new TextRun({ text: '.mp3, .m4a, .wav, .webm, .aac, .ogg', bold: true, color: '0369A1' }),
              new TextRun({ text: ' với kích thước tệp lớn.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Bổ sung ngữ cảnh họp (Context-aware): ', bold: true }),
              new TextRun({ text: 'Cho phép nhập trước ' }),
              new TextRun({ text: 'Tiêu đề cuộc họp, Danh sách người tham dự, Mục tiêu kỳ vọng', bold: true }),
              new TextRun({ text: ' và tùy biến prompt để AI nhận diện giọng điệu chuẩn xác.' }),
            ],
            spacing: { after: 140 },
          }),

          // 2. Nhóm AI Analysis
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: '2. Phân Tích Thông Minh Bằng AI (Gemini 3.6 Flash Engine)', bold: true, size: 26, color: '1E3A8A' }),
            ],
            spacing: { before: 180, after: 100 },
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tóm tắt điều hành (Executive Summary): ', bold: true }),
              new TextRun({ text: 'Đúc kết toàn bộ nội dung thảo luận thành 3–5 luận điểm cô đọng, nắm bắt tình hình trong 30 giây.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Đánh giá mức độ đạt mục tiêu (Goal Alignment): ', bold: true }),
              new TextRun({ text: 'So sánh kết quả trao đổi thực tế với mục tiêu ban đầu để kết luận: ' }),
              new TextRun({ text: 'Đạt, Đạt một phần, hoặc Chưa đạt', bold: true, color: '059669' }),
              new TextRun({ text: '.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Quyết định then chốt (Key Decisions): ', bold: true }),
              new TextRun({ text: 'Tách biệt rõ ràng các phương án đã được hội đồng/team thống nhất chốt lại, tránh bàn lại trong tương lai.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Bóc tách nhiệm vụ chuẩn Odoo (Action Items Table): ', bold: true }),
              new TextRun({ text: 'Trích xuất tự động từng đầu việc với cấu trúc: ' }),
              new TextRun({ text: 'Tên Task, Người làm (Assignee), Hạn chót (Deadline), Mức ưu tiên (Priority), Mô tả chi tiết (Description)', bold: true, color: 'B91C1C' }),
              new TextRun({ text: ' và trạng thái (Pending/Done).' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Quản trị rủi ro & Vấn đề tồn đọng (Risks & Open Questions): ', bold: true }),
              new TextRun({ text: 'Chỉ điểm các băn khoăn chưa có câu trả lời và các nguy cơ tiềm ẩn có thể ảnh hưởng đến tiến độ dự án.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Bóc băng chi tiết (Transcript with Timestamps): ', bold: true }),
              new TextRun({ text: 'Lưu giữ chi tiết lời nói theo từng mốc thời gian (hh:mm:ss) và người phát biểu phục vụ việc tra soát khi cần.' }),
            ],
            spacing: { after: 140 },
          }),

          // 3. Nhóm Export
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: '3. Xuất Bản & Đồng Bộ Đa Định Dạng (Multi-Format Export)', bold: true, size: 26, color: '1E3A8A' }),
            ],
            spacing: { before: 180, after: 100 },
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Xuất file Excel (.xlsx) chuẩn Odoo ERP: ', bold: true, color: '15803D' }),
              new TextRun({ text: 'Gồm 2 sheet chuyên nghiệp: Sheet 1 chứa danh sách Task đã format đúng các trường dữ liệu để import/sync trực tiếp vào Odoo Tasks / Project; Sheet 2 lưu trữ tổng quan biên bản họp.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Xuất file Microsoft Word (.docx) chuẩn doanh nghiệp: ', bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Định dạng tài liệu trang trọng có bảng biểu, callout box, màu sắc nhận diện thương hiệu, sẵn sàng in ấn hoặc ký duyệt lưu trữ.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Xuất & Sao chép Markdown (.md) 1 click: ', bold: true }),
              new TextRun({ text: 'Tương thích ngay lập tức để paste vào Notion, Obsidian, GitHub Discussions, Slack hoặc Basecamp.' }),
            ],
            spacing: { after: 140 },
          }),

          // 4. Nhóm UX & Mobile & Architecture
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: '4. Trải Nghiệm Người Dùng & Hạ Tầng Tinh Gọn (UX & Architecture)', bold: true, size: 26, color: '1E3A8A' }),
            ],
            spacing: { before: 180, after: 100 },
          }),

          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Thiết kế Mobile-First: ', bold: true }),
              new TextRun({ text: 'Giao diện mượt mà trên smartphone với Slide-over Drawer quản lý lịch sử họp, nút thao tác đạt chuẩn ngón tay bấm (44px), hiển thị tràn viền chuẩn 100dvh.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Quản lý tương tác trực tiếp (Interactive Tasks): ', bold: true }),
              new TextRun({ text: 'Có thể đánh dấu tích hoàn thành (toggle status) từng việc cần làm trực tiếp ngay trên giao diện web.' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Kiến trúc Lean Stack siêu tốc: ', bold: true }),
              new TextRun({ text: 'Xây dựng trên TypeScript + Hono v4, lưu trữ Flat-file JSON/Markdown cục bộ, không cần cấu hình cơ sở dữ liệu rườm rà, tiêu thụ CPU/RAM cực thấp (<50MB RAM).' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Truy cập bảo mật qua Internet: ', bold: true }),
              new TextRun({ text: 'Tích hợp sẵn Cloudflare Named Tunnel tại domain ' }),
              new TextRun({ text: 'recap.quangha.me', bold: true, color: '2563EB' }),
              new TextRun({ text: ' với chứng chỉ SSL/TLS miễn phí, kết nối bảo mật không cần mở port modem.' }),
            ],
            spacing: { after: 160 },
          }),

          // Summary Comparison Table
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: '5. Bảng Tổng Hợp Khả Năng Đáp Ứng Nhu Cầu', bold: true, size: 26, color: '1E3A8A' }),
            ],
            spacing: { before: 180, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Hạng Mục', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tính Năng Chi Tiết', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Giá Trị Mang Lại', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Đầu vào (Input)', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Ghi âm trực tiếp trên điện thoại/PC + Upload file audio đa dạng + Nhập trước mục tiêu' })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Tiện lợi họp onsite lẫn online, không cần ghi chép' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Xử lý (Processing)', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Gemini 3.6 Flash: Tóm tắt, trích xuất Quyết định, Bóc tách Action Items kèm mô tả chi tiết' })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Bảo đảm 100% cam kết được giao đúng người đúng việc' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Đầu ra (Output)', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Excel (.xlsx) chuẩn Odoo, Word (.docx) biên bản họp, Markdown (.md) cho wiki' })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Sẵn sàng nạp vào hệ thống ERP / lưu trữ doanh nghiệp' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Vận hành (Operation)', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Truy cập qua recap.quangha.me, hỗ trợ mobile drawer, không cần DB phức tạp' })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Triển khai tức thì, bảo trì 0 chi phí, dùng mọi lúc' })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 } }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Tài liệu được tạo tự động bởi hệ thống Bon Meeting Recap.',
                italics: true,
                size: 18,
                color: '94A3B8',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve(process.cwd(), 'Tinh-nang-Bon-Meeting-Recap.docx');
  await fs.writeFile(outputPath, buffer);
  console.log(`✅ Generated feature docx at: ${outputPath} (${buffer.length} bytes)`);
}

main().catch(console.error);
