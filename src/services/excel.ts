import ExcelJS from 'exceljs';
import type { MeetingRecord } from '../types.js';

/**
 * Generates a professionally formatted Excel workbook (.xlsx)
 * designed for task management and ready for Odoo Task import.
 */
export async function generateMeetingExcel(record: MeetingRecord): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bon Meeting Recap';
  workbook.created = new Date();

  const { title, createdAt, recap } = record;
  const meetingDateStr = new Date(createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // =========================================================================
  // Sheet 1: Action Items (Ready for Odoo Task import)
  // =========================================================================
  const taskSheet = workbook.addWorksheet('Action Items (Tasks)', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  taskSheet.columns = [
    { header: 'Mã Task', key: 'id', width: 12 },
    { header: 'Tên Công Việc (Task Name)', key: 'name', width: 36 },
    { header: 'Người Phụ Trách (Assignee)', key: 'assignee', width: 22 },
    { header: 'Hạn Hoàn Thành (Deadline)', key: 'deadline', width: 18 },
    { header: 'Độ Ưu Tiên (Priority)', key: 'priority', width: 16 },
    { header: 'Trạng Thái (Status)', key: 'status', width: 14 },
    { header: 'Mô Tả Chi Tiết (Description)', key: 'description', width: 45 },
    { header: 'Cuộc Họp Nguồn (Source Meeting)', key: 'meeting', width: 28 },
    { header: 'Ngày Tạo (Date)', key: 'date', width: 14 },
  ];

  // Style header row
  const headerRow = taskSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Dark Blue #1e40af
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  // Add rows
  recap.actionItems.forEach((item, idx) => {
    const priorityText =
      item.priority === 'high'
        ? 'Cao (High)'
        : item.priority === 'low'
        ? 'Thấp (Low)'
        : 'Trung bình (Med)';

    const row = taskSheet.addRow({
      id: `TSK-${String(idx + 1).padStart(2, '0')}`,
      name: item.task,
      assignee: item.assignee || 'Chưa chỉ định',
      deadline: item.dueDate || 'Chưa có',
      priority: priorityText,
      status: item.completed ? 'Đã xong (Done)' : 'Mới (To Do)',
      description: item.description || item.task,
      meeting: title || recap.title,
      date: meetingDateStr,
    });

    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6 ? 'center' : 'left',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Highlight High priority in soft red
      if (colNumber === 5 && item.priority === 'high') {
        cell.font = { color: { argb: 'FFB91C1C' }, bold: true };
      }
    });
  });

  // =========================================================================
  // Sheet 2: Overview & Decisions (Biên bản tóm tắt)
  // =========================================================================
  const summarySheet = workbook.addWorksheet('Tổng Quan & Quyết Định');
  summarySheet.columns = [
    { header: 'Hạng Mục', key: 'category', width: 25 },
    { header: 'Nội Dung Chi Tiết', key: 'content', width: 70 },
  ];

  const sumHeader = summarySheet.getRow(1);
  sumHeader.height = 26;
  sumHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }, // Slate 700
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  summarySheet.addRow({
    category: 'Tiêu Đề Cuộc Họp',
    content: recap.title || title,
  });
  summarySheet.addRow({
    category: 'Thời Gian',
    content: meetingDateStr,
  });
  if (recap.attendees && recap.attendees.length > 0) {
    summarySheet.addRow({
      category: 'Người Tham Dự',
      content: recap.attendees.join(', '),
    });
  }
  summarySheet.addRow({
    category: 'Tóm Tắt Tổng Quan',
    content: recap.executiveSummary,
  });

  if (recap.decisions.length > 0) {
    summarySheet.addRow({
      category: 'Quyết Định Then Chốt',
      content: recap.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n'),
    });
  }

  if (recap.openQuestions && recap.openQuestions.length > 0) {
    summarySheet.addRow({
      category: 'Vấn Đề Chưa Chốt (Open Questions)',
      content: recap.openQuestions
        .map((q, i) => `${i + 1}. ${q.question}${q.owner ? ` (Chờ: ${q.owner})` : ''}`)
        .join('\n'),
    });
  }

  if (recap.risks && recap.risks.length > 0) {
    summarySheet.addRow({
      category: 'Cảnh Báo Rủi Ro (Risks)',
      content: recap.risks.map((r, i) => `${i + 1}. ${r}`).join('\n'),
    });
  }

  // Format summary rows
  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = Math.max(26, String(row.getCell(2).value).split('\n').length * 18);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
      row.getCell(1).font = { bold: true, color: { argb: 'FF1E293B' } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
