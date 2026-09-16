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
import type { MeetingRecord } from '../types.js';

/**
 * Generates a professionally formatted Microsoft Word document (.docx)
 * representing the full meeting recap, action items, decisions, and transcript.
 */
export async function generateMeetingWord(record: MeetingRecord): Promise<Buffer> {
  const { title, createdAt, recap } = record;
  const meetingDateStr = new Date(createdAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const children: (Paragraph | Table)[] = [];

  // =========================================================================
  // Title & Header
  // =========================================================================
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: recap.title || title || 'Biên Bản Cuộc Họp',
          bold: true,
          size: 32, // 16pt
          color: '1E40AF', // Blue 800
        }),
      ],
      spacing: { after: 120 },
    }),
  );

  // Metadata Box / Paragraphs
  const metaParagraphs = [
    new Paragraph({
      children: [
        new TextRun({ text: '📅 Thời gian: ', bold: true, color: '475569', size: 20 }),
        new TextRun({ text: meetingDateStr, color: '1E293B', size: 20 }),
        new TextRun({ text: '   |   🗣️ Ngôn ngữ: ', bold: true, color: '475569', size: 20 }),
        new TextRun({ text: (recap.language || 'vi').toUpperCase(), color: '1E293B', size: 20 }),
        ...(recap.durationEstimate
          ? [
              new TextRun({ text: '   |   ⏱️ Thời lượng: ', bold: true, color: '475569', size: 20 }),
              new TextRun({ text: recap.durationEstimate, color: '1E293B', size: 20 }),
            ]
          : []),
      ],
      spacing: { after: 80 },
    }),
  ];

  if (recap.attendees && recap.attendees.length > 0) {
    metaParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: '👥 Người tham dự: ', bold: true, color: '475569', size: 20 }),
          new TextRun({ text: recap.attendees.join(', '), color: '1E293B', size: 20 }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  if (recap.meetingGoal) {
    metaParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: '🎯 Mục tiêu cuộc họp: ', bold: true, color: '475569', size: 20 }),
          new TextRun({ text: recap.meetingGoal, italics: true, color: '1E293B', size: 20 }),
          ...(recap.goalAchievementStatus
            ? [
                new TextRun({ text: ` [Trạng thái: `, bold: true, size: 20 }),
                new TextRun({ text: recap.goalAchievementStatus, bold: true, color: '047857', size: 20 }),
                new TextRun({ text: `]`, bold: true, size: 20 }),
              ]
            : []),
        ],
        spacing: { after: 120 },
      }),
    );
  }

  children.push(...metaParagraphs);

  // Horizontal divider
  children.push(
    new Paragraph({
      border: { bottom: { color: 'CBD5E1', style: BorderStyle.SINGLE, size: 8 } },
      spacing: { after: 200 },
    }),
  );

  // =========================================================================
  // Section 1: Executive Summary
  // =========================================================================
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: '1. Tóm Tắt Tổng Quan (Executive Summary)', bold: true, size: 24, color: '1E3A8A' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
  );

  // Callout box for summary
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: recap.executiveSummary,
                      size: 21,
                      color: '1E293B',
                    }),
                  ],
                  spacing: { before: 80, after: 80 },
                }),
              ],
              shading: { type: ShadingType.SOLID, color: 'F1F5F9', fill: 'F1F5F9' },
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: '2563EB' },
                top: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
              },
            }),
          ],
        }),
      ],
    }),
  );

  children.push(new Paragraph({ spacing: { after: 160 } }));

  // =========================================================================
  // Section 2: Key Decisions
  // =========================================================================
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: '2. Quyết Định Then Chốt (Key Decisions)', bold: true, size: 24, color: '1E3A8A' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
  );

  if (recap.decisions.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Không có quyết định nào được ghi nhận cụ thể.', italics: true, color: '64748B' })],
        spacing: { after: 120 },
      }),
    );
  } else {
    for (const d of recap.decisions) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: d, bold: true, color: '0F172A', size: 21 })],
          spacing: { after: 60 },
        }),
      );
    }
  }

  children.push(new Paragraph({ spacing: { after: 160 } }));

  // =========================================================================
  // Section 3: Action Items Table (Odoo Ready)
  // =========================================================================
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: '3. Phân Công Nhiệm Vụ (Action Items — Odoo Ready)', bold: true, size: 24, color: '1E3A8A' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
  );

  if (recap.actionItems.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Không có action items nào được ghi nhận.', italics: true, color: '64748B' })],
        spacing: { after: 120 },
      }),
    );
  } else {
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Mã Task', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Tên Công Việc', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 28, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Người Làm', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 18, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Hạn Chót', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 14, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Ưu Tiên', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Trạng Thái', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: '1E40AF', fill: '1E40AF' },
          width: { size: 16, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    const taskTableRows: TableRow[] = [tableHeaderRow];

    recap.actionItems.forEach((item, idx) => {
      const priorityLabel =
        item.priority === 'high' ? 'Cao' : item.priority === 'low' ? 'Thấp' : 'Trung bình';
      const statusLabel = item.completed ? 'Đã xong' : 'Chưa xong';

      const taskCellParagraphs = [
        new Paragraph({
          children: [new TextRun({ text: item.task, bold: true, size: 20 })],
        }),
      ];

      if (item.description && item.description !== item.task) {
        taskCellParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: item.description, italics: true, size: 18, color: '64748B' })],
            spacing: { before: 40 },
          }),
        );
      }

      taskTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: `TSK-${String(idx + 1).padStart(2, '0')}`, alignment: AlignmentType.CENTER })],
              width: { size: 12, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: taskCellParagraphs,
              width: { size: 28, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: item.assignee || 'Chưa gán', alignment: AlignmentType.CENTER })],
              width: { size: 18, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: item.dueDate || '—', alignment: AlignmentType.CENTER })],
              width: { size: 14, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: priorityLabel,
                      bold: item.priority === 'high',
                      color: item.priority === 'high' ? 'B91C1C' : '1E293B',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              width: { size: 12, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: statusLabel, alignment: AlignmentType.CENTER })],
              width: { size: 16, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: taskTableRows,
      }),
    );
  }

  children.push(new Paragraph({ spacing: { after: 160 } }));

  // =========================================================================
  // Section 4: Open Questions
  // =========================================================================
  if (recap.openQuestions && recap.openQuestions.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({ text: '4. Vấn Đề Chưa Chốt (Open Questions)', bold: true, size: 24, color: 'B45309' }), // Amber 700
        ],
        spacing: { before: 200, after: 100 },
      }),
    );

    for (const q of recap.openQuestions) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: q.question, bold: true, color: '1E293B', size: 20 }),
            ...(q.owner
              ? [
                  new TextRun({ text: ` (Chờ phản hồi từ: `, italics: true, size: 20 }),
                  new TextRun({ text: q.owner, bold: true, color: 'B45309', size: 20 }),
                  new TextRun({ text: `)`, italics: true, size: 20 }),
                ]
              : []),
          ],
          spacing: { after: 60 },
        }),
      );
    }

    children.push(new Paragraph({ spacing: { after: 160 } }));
  }

  // =========================================================================
  // Section 5: Risks
  // =========================================================================
  if (recap.risks && recap.risks.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({ text: '5. Cảnh Báo Rủi Ro (Risks & Blockers)', bold: true, size: 24, color: 'BE123C' }), // Rose 700
        ],
        spacing: { before: 200, after: 100 },
      }),
    );

    for (const r of recap.risks) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: `⚠️ ${r}`, bold: true, color: '1E293B', size: 20 })],
          spacing: { after: 60 },
        }),
      );
    }

    children.push(new Paragraph({ spacing: { after: 160 } }));
  }

  // =========================================================================
  // Section 6: Topics Breakdown
  // =========================================================================
  if (recap.topics && recap.topics.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({ text: '6. Chi Tiết Các Chủ Đề (Topics Breakdown)', bold: true, size: 24, color: '1E3A8A' }),
        ],
        spacing: { before: 200, after: 100 },
      }),
    );

    for (const topic of recap.topics) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: topic.title, bold: true, size: 22, color: '0F172A' })],
          spacing: { before: 80, after: 40 },
        }),
      );

      children.push(
        new Paragraph({
          children: [new TextRun({ text: topic.summary, size: 20, color: '334155' })],
          spacing: { after: 60 },
        }),
      );

      if (topic.keyPoints && topic.keyPoints.length > 0) {
        for (const pt of topic.keyPoints) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: pt, size: 20, color: '475569' })],
              spacing: { after: 40 },
            }),
          );
        }
      }
    }

    children.push(new Paragraph({ spacing: { after: 160 } }));
  }

  // =========================================================================
  // Section 7: Transcript
  // =========================================================================
  if (recap.transcript && recap.transcript.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({ text: '7. Lược Sử Cuộc Họp (Transcript Highlights)', bold: true, size: 24, color: '1E3A8A' }),
        ],
        spacing: { before: 200, after: 100 },
      }),
    );

    for (const seg of recap.transcript) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${seg.timestamp || ''}] `, bold: true, color: '2563EB', size: 18 }),
            ...(seg.speaker ? [new TextRun({ text: `${seg.speaker}: `, bold: true, size: 19 })] : []),
            new TextRun({ text: seg.text, size: 19, color: '334155' }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
