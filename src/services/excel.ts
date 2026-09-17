import ExcelJS from 'exceljs';
import type { MeetingRecord } from '../types.js';

/**
 * Generates a professionally formatted Excel workbook (.xlsx)
 * 100% compliant with the Odoo WBS Project Engine parser.
 */
export async function generateMeetingExcel(record: MeetingRecord): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bon Meeting Recap';
  workbook.created = new Date();

  const { title, createdAt, recap } = record;
  const meetingDate = new Date(createdAt);
  const meetingDateIso = meetingDate.toISOString().split('T')[0];
  const meetingDateStr = meetingDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // =========================================================================
  // Sheet 1: Quản lý dự án (WBS Format for Odoo Project Engine)
  // =========================================================================
  const taskSheet = workbook.addWorksheet('Quản lý dự án', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  taskSheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Hạng mục', key: 'category', width: 22 },
    { header: 'Backlog / Công việc', key: 'name', width: 38 },
    { header: 'Ưu tiên', key: 'priority', width: 14 },
    { header: 'Owner', key: 'owner', width: 22 },
    { header: 'Kỹ năng / Kiến thức', key: 'skills', width: 24 },
    { header: 'Bắt đầu', key: 'start', width: 15 },
    { header: 'Deadline', key: 'deadline', width: 15 },
    { header: 'Trạng thái', key: 'status', width: 16 },
    { header: '% HT', key: 'progress', width: 10 },
    { header: 'Definition of Done (DoD)', key: 'dod', width: 35 },
    { header: 'Điều kiện đầu vào / Gate', key: 'gate', width: 28 },
    { header: 'Phụ thuộc', key: 'dep', width: 14 },
    { header: 'Ghi chú', key: 'note', width: 36 },
  ];

  // Style header row
  const headerRow = taskSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Dark Blue #1E40AF
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
        ? 'Cao'
        : item.priority === 'low'
        ? 'Thấp'
        : 'Trung bình';

    const deadlineVal = item.dueDate && /^\d{4}-\d{2}-\d{2}/.test(item.dueDate)
      ? item.dueDate
      : meetingDateIso;

    const row = taskSheet.addRow({
      id: `TSK-${String(idx + 1).padStart(2, '0')}`,
      category: item.category || (recap.topics && recap.topics[0]?.title) || 'Hành động Cuộc họp',
      name: item.task,
      priority: priorityText,
      owner: item.assignee || 'Chưa chỉ định',
      skills: 'Kỹ năng chuyên môn / Nghiệp vụ',
      start: meetingDateIso,
      deadline: deadlineVal,
      status: item.completed ? 'Hoàn thành' : 'Đang thực hiện',
      progress: item.completed ? '1' : '0',
      dod: item.dod || item.description || item.task,
      gate: item.gate || 'Thống nhất trong biên bản cuộc họp',
      dep: item.dependencies || '-',
      note: item.description
        ? `${item.description} (Nguồn: ${title || recap.title})`
        : `Nguồn: ${title || recap.title} — Ngày ${meetingDateStr}`,
    });

    row.height = 26;
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 4, 7, 8, 9, 10, 13].includes(colNumber) ? 'center' : 'left',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Highlight High priority in soft red
      if (colNumber === 4 && item.priority === 'high') {
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
    { header: 'Nội Dung Chi Tiết', key: 'content', width: 75 },
  ];

  const sumHeader = summarySheet.getRow(1);
  sumHeader.height = 28;
  sumHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }, // Slate 700
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const addSumRow = (cat: string, content: string) => {
    const r = summarySheet.addRow({ category: cat, content });
    r.height = 24;
    r.eachCell((cell, col) => {
      cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (col === 1) cell.font = { bold: true, color: { argb: 'FF1E293B' } };
    });
  };

  addSumRow('Tên Cuộc Họp', title || recap.title);
  addSumRow('Ngày Diễn Ra', meetingDateStr);
  if (recap.attendees?.length) {
    addSumRow('Thành Phần Tham Dự', recap.attendees.join(', '));
  }
  if (recap.meetingGoal) {
    addSumRow('Mục Tiêu Cuộc Họp', `${recap.meetingGoal} ${recap.goalAchievementStatus ? `[${recap.goalAchievementStatus}]` : ''}`);
  }
  addSumRow('Tóm Tắt Điều Hành', recap.executiveSummary);

  if (recap.decisions.length > 0) {
    addSumRow('Quyết Định Cốt Lõi', recap.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n'));
  }

  if (recap.risks && recap.risks.length > 0) {
    addSumRow('Rủi Ro Tiềm Ẩn', recap.risks.map((r, i) => `${i + 1}. ${r}`).join('\n'));
  }

  if (recap.openQuestions && recap.openQuestions.length > 0) {
    addSumRow('Vấn Đề Cần Làm Rõ', recap.openQuestions.map((q, i) => `${i + 1}. ${q.question} ${q.owner ? `(${q.owner})` : ''}`).join('\n'));
  }

  const uint8Array = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
}
