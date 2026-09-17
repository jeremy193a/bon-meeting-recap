import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import type { MeetingRecord, MeetingSummaryItem } from '../types.js';
import { formatMeetingToMarkdown } from '../utils/formatters.js';

/**
 * Resolves user-specific directories for 100% data isolation.
 */
export function getUserDirs(userId?: number) {
  if (userId) {
    const userBase = path.join(config.usersDir, String(userId));
    return {
      meetingsDir: path.join(userBase, 'meetings'),
      uploadsDir: path.join(userBase, 'uploads'),
    };
  }
  return {
    meetingsDir: config.dataDir,
    uploadsDir: config.uploadsDir,
  };
}

/**
 * Ensure storage directories exist.
 */
export async function initStorage(userId?: number): Promise<void> {
  try {
    const dirs = getUserDirs(userId);
    await fs.mkdir(dirs.meetingsDir, { recursive: true });
    await fs.mkdir(dirs.uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to initialize storage directories:', error);
    throw error;
  }
}

/**
 * Migrate legacy meetings from data/meetings to default admin user 145.
 */
export async function migrateLegacyMeetings(targetUserId = 145): Promise<void> {
  try {
    const targetDirs = getUserDirs(targetUserId);
    await initStorage(targetUserId);

    const legacyExists = await fs.stat(config.dataDir).catch(() => null);
    if (!legacyExists) return;

    const files = await fs.readdir(config.dataDir);
    for (const f of files) {
      const src = path.join(config.dataDir, f);
      const dest = path.join(targetDirs.meetingsDir, f);
      const alreadyInDest = await fs.stat(dest).catch(() => null);
      if (!alreadyInDest) {
        await fs.copyFile(src, dest).catch(() => {});
      }
    }

    const legacyUploadsExists = await fs.stat(config.uploadsDir).catch(() => null);
    if (legacyUploadsExists) {
      const audioFiles = await fs.readdir(config.uploadsDir);
      for (const af of audioFiles) {
        const src = path.join(config.uploadsDir, af);
        const dest = path.join(targetDirs.uploadsDir, af);
        const alreadyInDest = await fs.stat(dest).catch(() => null);
        if (!alreadyInDest) {
          await fs.copyFile(src, dest).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Legacy migration notice:', err);
  }
}

/**
 * Save a new or updated meeting record.
 */
export async function saveMeeting(record: MeetingRecord, userId?: number): Promise<void> {
  const effectiveUid = userId ?? record.ownerId;
  await initStorage(effectiveUid);
  const dirs = getUserDirs(effectiveUid);

  if (effectiveUid) {
    record.ownerId = effectiveUid;
  }

  const jsonPath = path.join(dirs.meetingsDir, `${record.id}.json`);
  const mdPath = path.join(dirs.meetingsDir, `${record.id}.md`);

  const jsonData = JSON.stringify(record, null, 2);
  const mdData = formatMeetingToMarkdown(record);

  await fs.writeFile(jsonPath, jsonData, 'utf-8');
  await fs.writeFile(mdPath, mdData, 'utf-8');
}

/**
 * Retrieve a meeting record by its ID.
 */
export async function getMeeting(id: string, userId?: number): Promise<MeetingRecord | null> {
  const dirs = getUserDirs(userId);
  const jsonPath = path.join(dirs.meetingsDir, `${id}.json`);

  try {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as MeetingRecord;
    return parsed;
  } catch (error) {
    // If not found in user dir and user is admin 145, fallback to legacy dir
    if (userId === 145 || !userId) {
      try {
        const legacyPath = path.join(config.dataDir, `${id}.json`);
        const legacyRaw = await fs.readFile(legacyPath, 'utf-8');
        return JSON.parse(legacyRaw) as MeetingRecord;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * List all saved meetings for a specific user with summary info.
 */
export async function listMeetings(userId?: number): Promise<MeetingSummaryItem[]> {
  const effectiveUid = userId ?? 145;
  await initStorage(effectiveUid);
  const dirs = getUserDirs(effectiveUid);

  try {
    const files = await fs.readdir(dirs.meetingsDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const summaries: MeetingSummaryItem[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(dirs.meetingsDir, file);
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const record = JSON.parse(raw) as MeetingRecord;
        summaries.push({
          id: record.id,
          title: record.title || record.recap.title || 'Cuộc họp không tên',
          createdAt: record.createdAt,
          language: record.recap.language || 'vi',
          ownerId: record.ownerId ?? effectiveUid,
          actionItemsCount: record.recap.actionItems.length,
          decisionsCount: record.recap.decisions.length,
          executiveSummaryPreview:
            record.recap.executiveSummary.slice(0, 140) +
            (record.recap.executiveSummary.length > 140 ? '...' : ''),
          odooProjectUrl: record.odooProject?.projectUrl,
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
export async function deleteMeeting(id: string, userId?: number): Promise<boolean> {
  const record = await getMeeting(id, userId);
  if (!record) {
    return false;
  }

  const dirs = getUserDirs(userId ?? record.ownerId);
  const jsonPath = path.join(dirs.meetingsDir, `${id}.json`);
  const mdPath = path.join(dirs.meetingsDir, `${id}.md`);

  try {
    await fs.unlink(jsonPath).catch(() => {});
    await fs.unlink(mdPath).catch(() => {});

    if (record.audioFileName) {
      const audioPath = path.join(dirs.uploadsDir, record.audioFileName);
      await fs.unlink(audioPath).catch(() => {});
      // Also try legacy upload dir
      const legacyAudioPath = path.join(config.uploadsDir, record.audioFileName);
      await fs.unlink(legacyAudioPath).catch(() => {});
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
  userId?: number,
): Promise<MeetingRecord | null> {
  const record = await getMeeting(meetingId, userId);
  if (!record) {
    return null;
  }

  const targetItem = record.recap.actionItems[itemIndex];
  if (!targetItem) {
    return null;
  }

  targetItem.completed = !targetItem.completed;
  await saveMeeting(record, userId);
  return record;
}
