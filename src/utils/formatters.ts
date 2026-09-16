import type { MeetingRecord } from '../types.js';

/**
 * Converts a structured MeetingRecord into clean GitHub Flavored Markdown.
 */
export function formatMeetingToMarkdown(record: MeetingRecord): string {
  const { title, createdAt, recap } = record;
  const dateStr = new Date(createdAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const lines: string[] = [];

  lines.push(`# ${recap.title || title}`);
  lines.push(`> **Thời gian tạo:** ${dateStr} | **Ngôn ngữ:** ${recap.language}`);
  if (recap.durationEstimate) {
    lines.push(`> **Thời lượng ước tính:** ${recap.durationEstimate}`);
  }
  lines.push('');

  // Executive summary
  lines.push('## 📌 Tóm Tắt Tổng Quan (Executive Summary)');
  lines.push(recap.executiveSummary.trim());
  lines.push('');

  // Key decisions
  lines.push('## ⚖️ Quyết Định Then Chốt (Key Decisions)');
  if (recap.decisions.length === 0) {
    lines.push('_Không có quyết định nào được ghi nhận cụ thể._');
  } else {
    for (const decision of recap.decisions) {
      lines.push(`- ${decision}`);
    }
  }
  lines.push('');

  // Action items
  lines.push('## ✅ Nhiệm Vụ Tiếp Theo (Action Items)');
  if (recap.actionItems.length === 0) {
    lines.push('_Không có action item cụ thể._');
  } else {
    for (const item of recap.actionItems) {
      const assigneeStr = item.assignee ? ` [Phụ trách: **${item.assignee}**]` : '';
      const dueStr = item.dueDate ? ` (Hạn: ${item.dueDate})` : '';
      const priorityStr = item.priority === 'high' ? ' 🚨 [HIGH]' : item.priority === 'low' ? ' 🟢 [LOW]' : '';
      const checkbox = item.completed ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} **${item.task}**${assigneeStr}${dueStr}${priorityStr}`);
    }
  }
  lines.push('');

  // Topics breakdown
  if (recap.topics.length > 0) {
    lines.push('## 🔍 Chi Tiết Nội Dung (Topics Breakdown)');
    for (const topic of recap.topics) {
      lines.push(`### ${topic.title}`);
      lines.push(topic.summary);
      if (topic.keyPoints.length > 0) {
        lines.push('');
        for (const point of topic.keyPoints) {
          lines.push(`  * ${point}`);
        }
      }
      lines.push('');
    }
  }

  // Transcript if present
  if (recap.transcript && recap.transcript.length > 0) {
    lines.push('## 📝 Lược Sử Cuộc Họp (Transcript)');
    for (const seg of recap.transcript) {
      const timeTag = seg.timestamp ? `\`${seg.timestamp}\`` : '';
      const speakerTag = seg.speaker ? `**${seg.speaker}**` : '';
      const prefix = [timeTag, speakerTag].filter(Boolean).join(' ');
      lines.push(prefix ? `${prefix}: ${seg.text}` : seg.text);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format bytes to readable string (e.g. 12.5 MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = (bytes / Math.pow(k, i)).toFixed(1);
  return `${val} ${sizes[i]}`;
}
