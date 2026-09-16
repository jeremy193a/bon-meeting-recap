import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { processAudioToRecap } from './services/gemini.js';
import {
  deleteMeeting,
  getMeeting,
  initStorage,
  listMeetings,
  saveMeeting,
  toggleActionItem,
} from './services/storage.js';
import type { MeetingRecord } from './types.js';
import { formatMeetingToMarkdown } from './utils/formatters.js';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors());

// Initialize local storage directories
await initStorage();

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

/**
 * Health check & config status
 */
app.get('/api/config', (c) => {
  return c.json({
    status: 'ok',
    hasApiKey: Boolean(config.geminiApiKey),
    model: config.geminiModel,
  });
});

/**
 * List all processed meetings
 */
app.get('/api/meetings', async (c) => {
  try {
    const meetings = await listMeetings();
    return c.json({ meetings });
  } catch (err) {
    console.error('[API] Failed to fetch meetings:', err);
    return c.json({ error: 'Failed to retrieve meetings' }, 500);
  }
});

/**
 * Get single meeting detail
 */
app.get('/api/meetings/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }
    return c.json({ meeting });
  } catch (err) {
    console.error(`[API] Failed to get meeting ${id}:`, err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Get markdown text for download or view
 */
app.get('/api/meetings/:id/markdown', async (c) => {
  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }

    const markdown = formatMeetingToMarkdown(meeting);
    c.header('Content-Type', 'text/markdown; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${id}-recap.md"`);
    return c.text(markdown);
  } catch (err) {
    console.error(`[API] Failed to get markdown for ${id}:`, err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Stream/serve uploaded audio file
 */
app.get('/api/meetings/:id/audio', async (c) => {
  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id);
    if (!meeting || !meeting.audioFileName) {
      return c.json({ error: 'Audio file not found' }, 404);
    }

    const audioFilePath = path.join(config.uploadsDir, meeting.audioFileName);
    const stat = await fs.stat(audioFilePath).catch(() => null);
    if (!stat) {
      return c.json({ error: 'Audio file missing on disk' }, 404);
    }

    const mimeType = meeting.audioMimeType || 'audio/mpeg';
    c.header('Content-Type', mimeType);
    c.header('Content-Length', String(stat.size));
    c.header('Accept-Ranges', 'bytes');

    const fileBuffer = await fs.readFile(audioFilePath);
    return c.body(fileBuffer);
  } catch (err) {
    console.error(`[API] Failed to serve audio for ${id}:`, err);
    return c.json({ error: 'Failed to stream audio file' }, 500);
  }
});

/**
 * Upload and process audio with Gemini
 */
app.post('/api/meetings/process', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];
    const customTitle = typeof body['title'] === 'string' ? body['title'].trim() : '';
    const customPrompt =
      typeof body['customPrompt'] === 'string' ? body['customPrompt'].trim() : '';
    const clientApiKey = c.req.header('x-gemini-api-key') || null;

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No valid audio file uploaded' }, 400);
    }

    // Supported audio mime types or extensions
    const supportedExts = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac'];
    const ext = path.extname(file.name).toLowerCase() || '.mp3';
    if (!supportedExts.includes(ext) && !file.type.startsWith('audio/')) {
      return c.json(
        {
          error: `Unsupported file format. Please upload an audio file (${supportedExts.join(', ')})`,
        },
        400,
      );
    }

    const meetingId = crypto.randomUUID();
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const audioFileName = `${meetingId}-${safeBaseName}${ext}`;
    const destinationPath = path.join(config.uploadsDir, audioFileName);

    // Save audio file locally
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));

    // Determine MIME type
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      const mimeMap: Record<string, string> = {
        '.mp3': 'audio/mp3',
        '.wav': 'audio/wav',
        '.m4a': 'audio/m4a',
        '.webm': 'audio/webm',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
      };
      mimeType = mimeMap[ext] ?? 'audio/mp3';
    }

    console.log(`[API] Processing audio file: ${file.name} (${mimeType}, size: ${file.size} bytes)`);

    // Call Gemini to transcribe & recap
    const recapData = await processAudioToRecap({
      filePath: destinationPath,
      mimeType,
      displayName: file.name,
      customApiKey: clientApiKey,
      customPrompt: customPrompt || undefined,
    });

    const record: MeetingRecord = {
      id: meetingId,
      title: customTitle || recapData.title || file.name,
      createdAt: new Date().toISOString(),
      audioFileName,
      audioMimeType: mimeType,
      recap: recapData,
    };

    await saveMeeting(record);

    return c.json({
      success: true,
      meeting: record,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown processing error';
    console.error('[API] Processing error:', err);
    return c.json({ error: message }, 500);
  }
});

/**
 * Toggle an action item checkbox
 */
app.post('/api/meetings/:id/action-items/:index/toggle', async (c) => {
  const id = c.req.param('id');
  const index = Number(c.req.param('index'));

  if (Number.isNaN(index) || index < 0) {
    return c.json({ error: 'Invalid action item index' }, 400);
  }

  try {
    const updated = await toggleActionItem(id, index);
    if (!updated) {
      return c.json({ error: 'Meeting or action item not found' }, 404);
    }
    return c.json({ success: true, meeting: updated });
  } catch (err) {
    console.error(`[API] Error toggling action item:`, err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Delete a meeting
 */
app.delete('/api/meetings/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const deleted = await deleteMeeting(id);
    if (!deleted) {
      return c.json({ error: 'Meeting not found' }, 404);
    }
    return c.json({ success: true });
  } catch (err) {
    console.error(`[API] Failed to delete meeting ${id}:`, err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// -------------------------------------------------------------
// Static Files & Web Interface
// -------------------------------------------------------------

app.use('/public/*', serveStatic({ root: './' }));
app.use('/*', serveStatic({ root: './public', index: 'index.html' }));

// Start server
console.log(`🚀 Bon Meeting Recap Server starting on http://${config.host}:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});
