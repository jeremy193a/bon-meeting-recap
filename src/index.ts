import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { type Context, Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { generateMeetingExcel } from './services/excel.js';
import { generateMeetingWord } from './services/word.js';
import { processAudioToRecap } from './services/agy.js';
import {
  authenticateOdooUser,
  pushMeetingToOdoo,
  signSessionToken,
  verifySessionToken,
} from './services/odoo.js';
import {
  deleteMeeting,
  getMeeting,
  getUserDirs,
  initStorage,
  listMeetings,
  migrateLegacyMeetings,
  saveMeeting,
  toggleActionItem,
} from './services/storage.js';
import type { MeetingRecord, UserSession } from './types.js';
import { formatMeetingToMarkdown } from './utils/formatters.js';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({ origin: (origin) => origin, credentials: true }));

// Initialize local storage directories & legacy migration to UID 145
await initStorage();
await migrateLegacyMeetings(145);

/**
 * Helper to retrieve authenticated user session from cookie.
 */
function getSession(c: Context): UserSession | null {
  const token = getCookie(c, 'bon_session');
  return verifySessionToken(token);
}

// -------------------------------------------------------------
// Auth API Routes
// -------------------------------------------------------------

/**
 * Check current authentication status
 */
app.get('/api/auth/me', (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ authenticated: false });
  }
  return c.json({
    authenticated: true,
    user: {
      uid: session.uid,
      name: session.name,
      email: session.email,
      profile: session.profile,
    },
  });
});

/**
 * Log in using Odoo credentials (Email + Password/API Key)
 */
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { login, password, profile = 'skillbon' } = body;

    if (!login || !password) {
      return c.json({ error: 'Vui lòng nhập Email và Mật khẩu Odoo.' }, 400);
    }

    console.log(`[Auth] Attempting login for: ${login} on profile: ${profile}`);
    const odooUser = await authenticateOdooUser(login, password, profile);

    if (!odooUser) {
      return c.json({ error: 'Email hoặc mật khẩu Odoo không chính xác. Vui lòng thử lại.' }, 401);
    }

    const session: UserSession = {
      uid: odooUser.id,
      name: odooUser.name,
      email: odooUser.email,
      profile,
      issuedAt: Date.now(),
    };

    const token = signSessionToken(session);

    // Set 30-day session cookie
    setCookie(c, 'bon_session', token, {
      path: '/',
      httpOnly: true,
      secure: false, // works over http / tunnel https
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Ensure user directory exists
    await initStorage(odooUser.id);

    console.log(`[Auth] Login successful: ${odooUser.name} (UID: ${odooUser.id})`);
    return c.json({
      success: true,
      user: {
        uid: odooUser.id,
        name: odooUser.name,
        email: odooUser.email,
        companyName: odooUser.companyName,
        profile,
      },
    });
  } catch (err) {
    console.error('[Auth] Login exception:', err);
    return c.json({ error: 'Không thể kết nối đến máy chủ Odoo để xác thực.' }, 500);
  }
});

/**
 * Log out
 */
app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'bon_session', { path: '/' });
  return c.json({ success: true });
});

// -------------------------------------------------------------
// System & Public Routes
// -------------------------------------------------------------

/**
 * Health check & AI provider status
 */
app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.get('/api/config', (c) => {
  const session = getSession(c);
  return c.json({
    status: 'ok',
    aiProvider: 'agy',
    model: config.agyModel,
    authenticated: Boolean(session),
    user: session ? { uid: session.uid, name: session.name, email: session.email } : null,
  });
});

/**
 * Download feature summary Word document
 */
app.get('/api/features/word', async (c) => {
  try {
    const filePath = path.resolve(process.cwd(), 'Tinh-nang-Bon-Meeting-Recap.docx');
    const buffer = await fs.readFile(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Tinh-nang-Bon-Meeting-Recap.docx"',
      },
    });
  } catch (err) {
    console.error('[API] Failed to serve feature docx:', err);
    return c.json({ error: 'Feature document not found' }, 404);
  }
});

// -------------------------------------------------------------
// Protected Meeting API Routes (Isolated by User UID)
// -------------------------------------------------------------

/**
 * List all processed meetings belonging to the authenticated user
 */
app.get('/api/meetings', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Vui lòng đăng nhập tài khoản Odoo để xem dữ liệu.', needLogin: true }, 401);
  }

  try {
    const meetings = await listMeetings(session.uid);
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
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Vui lòng đăng nhập tài khoản Odoo.', needLogin: true }, 401);
  }

  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id, session.uid);
    if (!meeting) {
      return c.json({ error: 'Không tìm thấy cuộc họp hoặc bạn không có quyền truy cập.' }, 404);
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
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id, session.uid);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }

    const markdown = formatMeetingToMarkdown(meeting);
    c.header('Content-Type', 'text/markdown; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${id}-recap.md"`);
    return c.text(markdown);
  } catch (err) {
    console.error(`[API] Failed to get markdown for ${id}:`, err);
    return c.json({ error: 'Failed to generate markdown' }, 500);
  }
});

/**
 * Export meeting recap to standardized Excel workbook (.xlsx)
 */
app.get('/api/meetings/:id/excel', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id, session.uid);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }

    const buffer = await generateMeetingExcel(meeting);
    const safeTitle = (meeting.title || 'Meeting-Recap')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const fileName = `${safeTitle}-WBS-Tasks.xlsx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error(`[API] Failed to export excel for ${id}:`, err);
    return c.json({ error: 'Failed to generate Excel file' }, 500);
  }
});

/**
 * Export meeting recap to Microsoft Word document (.docx)
 */
app.get('/api/meetings/:id/word', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id, session.uid);
    if (!meeting) {
      return c.json({ error: 'Meeting not found' }, 404);
    }

    const buffer = await generateMeetingWord(meeting);
    const safeTitle = (meeting.title || 'Meeting-Recap')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const fileName = `Bien-ban-${safeTitle}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error(`[API] Failed to export word for ${id}:`, err);
    return c.json({ error: 'Failed to generate Word document' }, 500);
  }
});

/**
 * Stream meeting audio file (protected by user session)
 */
app.get('/api/meetings/:id/audio', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const meeting = await getMeeting(id, session.uid);
    if (!meeting || !meeting.audioFileName) {
      return c.json({ error: 'Audio file not found' }, 404);
    }

    const dirs = getUserDirs(session.uid);
    let audioPath = path.join(dirs.uploadsDir, meeting.audioFileName);

    let stat = await fs.stat(audioPath).catch(() => null);
    if (!stat) {
      // Fallback to legacy uploads dir for existing files
      audioPath = path.join(config.uploadsDir, meeting.audioFileName);
      stat = await fs.stat(audioPath).catch(() => null);
    }

    if (!stat) {
      return c.json({ error: 'Audio file does not exist on disk' }, 404);
    }

    const fileBuffer = await fs.readFile(audioPath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': meeting.audioMimeType || 'audio/webm',
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    console.error(`[API] Error streaming audio for meeting ${id}:`, err);
    return c.json({ error: 'Failed to stream audio file' }, 500);
  }
});

/**
 * Upload and process audio file with AGY -> isolated to authenticated user
 */
app.post('/api/meetings/process', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Vui lòng đăng nhập Odoo để thực hiện ghi âm/xử lý cuộc họp.', needLogin: true }, 401);
  }

  try {
    const body = await c.req.parseBody();
    const file = body['audio'];
    const customTitle = typeof body['title'] === 'string' ? body['title'].trim() : '';
    const customPrompt = typeof body['customPrompt'] === 'string' ? body['customPrompt'].trim() : '';

    const attendeesRaw = typeof body['attendees'] === 'string' ? body['attendees'].trim() : '';
    const meetingGoal = typeof body['meetingGoal'] === 'string' ? body['meetingGoal'].trim() : '';
    const rawLang = typeof body['languagePreference'] === 'string'
      ? body['languagePreference'].trim()
      : typeof body['language'] === 'string'
      ? body['language'].trim()
      : 'auto';
    const languagePreference = (['auto', 'en', 'vi', 'bilingual'].includes(rawLang) ? rawLang : 'auto') as
      | 'auto'
      | 'en'
      | 'vi'
      | 'bilingual';

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No audio file provided or invalid file format' }, 400);
    }

    const ext = path.extname(file.name) || '.webm';
    const allowedExts = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.flac', '.aac', '.weba'];
    if (!allowedExts.includes(ext.toLowerCase())) {
      return c.json({ error: `Unsupported audio extension: ${ext}` }, 400);
    }

    const meetingId = crypto.randomUUID();
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const audioFileName = `${meetingId}-${safeBaseName}${ext}`;

    const dirs = getUserDirs(session.uid);
    await initStorage(session.uid);
    const destinationPath = path.join(dirs.uploadsDir, audioFileName);

    // Save audio file locally in user directory
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
        '.weba': 'audio/webm',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
      };
      mimeType = mimeMap[ext] ?? 'audio/webm';
    }

    console.log(`[API] Processing audio file for user ${session.name} (${session.uid}): ${file.name} (${mimeType}, size: ${file.size} bytes, language: ${languagePreference})`);

    // AGY directly analyzes the saved local audio and creates a recap.
    const recapData = await processAudioToRecap({
      filePath: destinationPath,
      mimeType,
      displayName: file.name,
      customPrompt: customPrompt || undefined,
      attendees: attendeesRaw || undefined,
      meetingGoal: meetingGoal || undefined,
      languagePreference,
    });

    const record: MeetingRecord = {
      id: meetingId,
      title: customTitle || recapData.title || file.name,
      createdAt: new Date().toISOString(),
      ownerId: session.uid,
      ownerEmail: session.email,
      audioFileName,
      audioMimeType: mimeType,
      recap: recapData,
    };

    await saveMeeting(record, session.uid);

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
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const index = Number(c.req.param('index'));

  if (Number.isNaN(index) || index < 0) {
    return c.json({ error: 'Invalid action item index' }, 400);
  }

  try {
    const updated = await toggleActionItem(id, index, session.uid);
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
 * Push meeting action items directly to Odoo Project
 * Requires explicit human review disclaimer acceptance
 */
app.post('/api/meetings/:id/push-odoo', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Vui lòng đăng nhập Odoo để thực hiện.', needLogin: true }, 401);
  }

  const id = c.req.param('id');
  try {
    const body = await c.req.json().catch(() => ({}));
    const { disclaimerAccepted, profileName = session.profile || 'skillbon', projectName } = body;

    if (!disclaimerAccepted) {
      return c.json({
        error: 'Bạn phải xác nhận đã rà soát danh sách công việc và cam kết chịu trách nhiệm trước khi đẩy lên Odoo.',
      }, 400);
    }

    console.log(`[API] User ${session.name} (${session.email}) pushing meeting ${id} to Odoo (${profileName})...`);

    const projectRef = await pushMeetingToOdoo({
      meetingId: id,
      user: session,
      disclaimerAccepted: Boolean(disclaimerAccepted),
      profileName,
      projectName,
    });

    return c.json({
      success: true,
      project: projectRef,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khởi tạo dự án Odoo';
    console.error('[API] Push Odoo error:', err);
    return c.json({ error: message }, 500);
  }
});

/**
 * Delete a meeting
 */
app.delete('/api/meetings/:id', async (c) => {
  const session = getSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const deleted = await deleteMeeting(id, session.uid);
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

app.use('/*', async (c, next) => {
  await next();
  const p = c.req.path;
  if (p === '/' || p.startsWith('/public') || p.endsWith('.html') || p.endsWith('.js')) {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
});

app.use('/public/*', serveStatic({ root: './' }));
app.use('/*', serveStatic({ root: './public', index: 'index.html' }));

// Start server
console.log(`🚀 Bon Meeting Recap Server starting on http://${config.host}:${config.port}`);

serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
});
