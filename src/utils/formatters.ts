import type { MeetingRecord } from '../types.js';

/**
 * Converts a structured MeetingRecord into clean GitHub Flavored Markdown.
 */
export function formatMeetingToMarkdown(record: MeetingRecord): string {
  const { title, createdAt, recap } = record;
  const dateStr = new Date(createdAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const isEn = Boolean(recap.language && recap.language.toLowerCase().startsWith('en'));

  const lines: string[] = [];

  lines.push(`# ${recap.title || title}`);
  lines.push(`> **${isEn ? 'Created At' : 'Thời gian tạo'}:** ${dateStr} | **${isEn ? 'Language' : 'Ngôn ngữ'}:** ${recap.language}`);
  if (recap.durationEstimate) {
    lines.push(`> **${isEn ? 'Estimated Duration' : 'Thời lượng ước tính'}:** ${recap.durationEstimate}`);
  }
  if (recap.attendees && recap.attendees.length > 0) {
    lines.push(`> **${isEn ? 'Attendees' : 'Người tham dự'}:** ${recap.attendees.join(', ')}`);
  }
  if (recap.meetingGoal) {
    lines.push(`> **${isEn ? 'Meeting Goal' : 'Mục tiêu cuộc họp'}:** ${recap.meetingGoal} (${recap.goalAchievementStatus || 'N/A'})`);
  }
  lines.push('');

  // Executive summary
  lines.push(isEn ? '## 📌 Executive Summary' : '## 📌 Tóm Tắt Tổng Quan (Executive Summary)');
  lines.push(recap.executiveSummary.trim());
  lines.push('');

  // Key decisions
  lines.push(isEn ? '## ⚖️ Key Decisions' : '## ⚖️ Quyết Định Then Chốt (Key Decisions)');
  if (recap.decisions.length === 0) {
    lines.push(isEn ? '_No specific decisions recorded._' : '_Không có quyết định nào được ghi nhận cụ thể._');
  } else {
    for (const decision of recap.decisions) {
      lines.push(`- ${decision}`);
    }
  }
  lines.push('');

  // Action items
  lines.push(isEn ? '## ✅ Action Items & Tasks' : '## ✅ Nhiệm Vụ & Phân Công (Action Items - Odoo Ready)');
  if (recap.actionItems.length === 0) {
    lines.push(isEn ? '_No specific action items recorded._' : '_Không có action item cụ thể._');
  } else {
    for (const item of recap.actionItems) {
      const assigneeStr = item.assignee ? ` [${isEn ? 'Assignee' : 'Phụ trách'}: **${item.assignee}**]` : '';
      const dueStr = item.dueDate ? ` (${isEn ? 'Due' : 'Hạn'}: ${item.dueDate})` : '';
      const priorityStr = item.priority === 'high' ? ' 🚨 [HIGH]' : item.priority === 'low' ? ' 🟢 [LOW]' : '';
      const checkbox = item.completed ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} **${item.task}**${assigneeStr}${dueStr}${priorityStr}`);
      if (item.description && item.description !== item.task) {
        lines.push(`  > *${isEn ? 'Description' : 'Mô tả'}:* ${item.description}`);
      }
    }
  }
  lines.push('');

  // Open Questions & Blockers
  if (recap.openQuestions && recap.openQuestions.length > 0) {
    lines.push(isEn ? '## ❓ Open Questions' : '## ❓ Vấn Đề Chưa Chốt (Open Questions)');
    for (const q of recap.openQuestions) {
      const ownerStr = q.owner ? ` *(${isEn ? 'Pending response from' : 'Chờ phản hồi từ'}: **${q.owner}**)*` : '';
      lines.push(`- ⚠️ ${q.question}${ownerStr}`);
    }
    lines.push('');
  }

  // Risks
  if (recap.risks && recap.risks.length > 0) {
    lines.push(isEn ? '## ⚠️ Risks & Blockers' : '## ⚠️ Cảnh Báo Rủi Ro (Risks & Blockers)');
    for (const risk of recap.risks) {
      lines.push(`- 🛑 ${risk}`);
    }
    lines.push('');
  }

  // Topics breakdown
  if (recap.topics.length > 0) {
    lines.push(isEn ? '## 🔍 Discussion Topics Breakdown' : '## 🔍 Chi Tiết Nội Dung (Topics Breakdown)');
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
    lines.push(isEn ? '## 📝 Meeting Transcript' : '## 📝 Lược Sử Cuộc Họp (Transcript)');
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
