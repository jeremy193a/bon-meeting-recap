import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import type { MeetingRecord, MeetingSummaryItem } from '../types.js';
import { formatMeetingToMarkdown } from '../utils/formatters.js';

/**
 * Ensure storage directories exist.
 */
export async function initStorage(): Promise<void> {
  try {
    await fs.mkdir(config.dataDir, { recursive: true });
    await fs.mkdir(config.uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to initialize storage directories:', error);
    throw error;
  }
}

/**
 * Save a new or updated meeting record.
 */
export async function saveMeeting(record: MeetingRecord): Promise<void> {
  await initStorage();
  const jsonPath = path.join(config.dataDir, `${record.id}.json`);
  const mdPath = path.join(config.dataDir, `${record.id}.md`);

  const jsonData = JSON.stringify(record, null, 2);
  const mdData = formatMeetingToMarkdown(record);

  await fs.writeFile(jsonPath, jsonData, 'utf-8');
  await fs.writeFile(mdPath, mdData, 'utf-8');
}

/**
 * Retrieve a meeting record by its ID.
 */
export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  const jsonPath = path.join(config.dataDir, `${id}.json`);
  try {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as MeetingRecord;
    return parsed;
  } catch (error) {
    // If file doesn't exist, return null
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Failed to read meeting ${id}:`, error);
    throw error;
  }
}

/**
 * List all saved meetings with summary info.
 */
export async function listMeetings(): Promise<MeetingSummaryItem[]> {
  await initStorage();
  try {
    const files = await fs.readdir(config.dataDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const summaries: MeetingSummaryItem[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(config.dataDir, file);
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const record = JSON.parse(raw) as MeetingRecord;
        summaries.push({
          id: record.id,
          title: record.title || record.recap.title || 'Cuộc họp không tên',
          createdAt: record.createdAt,
          language: record.recap.language || 'vi',
          actionItemsCount: record.recap.actionItems.length,
          decisionsCount: record.recap.decisions.length,
          executiveSummaryPreview:
            record.recap.executiveSummary.slice(0, 140) +
            (record.recap.executiveSummary.length > 140 ? '...' : ''),
        });
      } catch (err) {
        console.error(`Error reading meeting file ${file}:`, err);
      }
    }

    // Sort newest first
    return summaries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error('Failed to list meetings:', error);
    return [];
  }
}

/**
 * Delete a meeting and associated files.
 */
export async function deleteMeeting(id: string): Promise<boolean> {
  const record = await getMeeting(id);
  if (!record) {
    return false;
  }

  const jsonPath = path.join(config.dataDir, `${id}.json`);
  const mdPath = path.join(config.dataDir, `${id}.md`);

  try {
    await fs.unlink(jsonPath).catch(() => {});
    await fs.unlink(mdPath).catch(() => {});

    if (record.audioFileName) {
      const audioPath = path.join(config.uploadsDir, record.audioFileName);
      await fs.unlink(audioPath).catch(() => {});
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete meeting ${id}:`, error);
    throw error;
  }
}

/**
 * Toggle or set the completion status of an action item in a meeting.
 */
export async function toggleActionItem(
  meetingId: string,
  itemIndex: number,
): Promise<MeetingRecord | null> {
  const record = await getMeeting(meetingId);
  if (!record) {
    return null;
  }

  const targetItem = record.recap.actionItems[itemIndex];
  if (!targetItem) {
    return null;
  }

  targetItem.completed = !targetItem.completed;
  await saveMeeting(record);
  return record;
}
