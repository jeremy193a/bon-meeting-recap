import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';
import type { OdooProjectRef, OdooUser, UserSession } from '../types.js';
import { generateMeetingExcel } from './excel.js';
import { getMeeting, saveMeeting } from './storage.js';

const execFileAsync = promisify(execFile);

/**
 * Resolves Odoo base URL and DB for a given profile.
 */
export function getOdooProfileConfig(profile: string = 'skillbon') {
  if (profile === 'prod') {
    return {
      baseUrl: config.odooProdBaseUrl,
      db: config.odooProdDb,
      name: 'prod',
    };
  }
  return {
    baseUrl: config.odooBaseUrl,
    db: config.odooDb,
    name: 'skillbon',
  };
}

/**
 * Authenticates user credentials directly against Odoo JSON-RPC.
 */
export async function authenticateOdooUser(
  login: string,
  passwordOrKey: string,
  profile: string = 'skillbon',
): Promise<OdooUser | null> {
  const { baseUrl, db } = getOdooProfileConfig(profile);

  try {
    // 1. Authenticate with Odoo common service
    const authRes = await fetch(`${baseUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [db, login.trim(), passwordOrKey.trim(), {}],
        },
        id: Date.now(),
      }),
    });

    const authData = (await authRes.json()) as { result?: number | false; error?: unknown };

    if (!authData || typeof authData.result !== 'number' || authData.result <= 0) {
      return null;
    }

    const uid = authData.result;

    // 2. Fetch user details (name, email, company)
    // We can use the user's credential or fallback to Admin API Key for res.users query
    const adminKey = process.env.ODOO_PROD_API_KEY || passwordOrKey;
    const adminUid = uid;

    let userName = login;
    let userEmail = login;
    let companyId: number | undefined;
    let companyName: string | undefined;

    try {
      const userRes = await fetch(`${baseUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              db,
              adminUid,
              adminKey,
              'res.users',
              'read',
              [[uid]],
              { fields: ['id', 'name', 'login', 'email', 'company_id'] },
            ],
          },
          id: Date.now() + 1,
        }),
      });

      const userData = (await userRes.json()) as { result?: Array<{ id: number; name: string; login: string; email: string; company_id?: [number, string] }> };
      if (userData.result && userData.result[0]) {
        const u = userData.result[0];
        userName = u.name || userName;
        userEmail = u.email || login;
        if (u.company_id && Array.isArray(u.company_id)) {
          companyId = u.company_id[0];
          companyName = u.company_id[1];
        }
      }
    } catch (readErr) {
      console.warn('[OdooAuth] Failed to read extended user details:', readErr);
    }

    return {
      id: uid,
      name: userName,
      login: login.trim(),
      email: userEmail.trim(),
      companyId,
      companyName,
    };
  } catch (err) {
    console.error('[OdooAuth] Connection error:', err);
    return null;
  }
}

/**
 * Signs a session payload into a tamper-proof session token.
 */
export function signSessionToken(session: UserSession): string {
  const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url');
  const hmac = crypto.createHmac('sha256', config.sessionSecret);
  hmac.update(payloadStr);
  const sig = hmac.digest('base64url');
  return `${payloadStr}.${sig}`;
}

/**
 * Verifies and decodes a session token.
 */
export function verifySessionToken(token?: string | null): UserSession | null {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payloadStr, sig] = token.split('.');
  if (!payloadStr || !sig) {
    return null;
  }

  const hmac = crypto.createHmac('sha256', config.sessionSecret);
  hmac.update(payloadStr);
  const expectedSig = hmac.digest('base64url');

  if (sig !== expectedSig) {
    return null;
  }

  try {
    const raw = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const session = JSON.parse(raw) as UserSession;

    // Check expiration (30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.issuedAt > thirtyDaysMs) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Pushes a meeting's action items as a standardized WBS Scrum project to Odoo.
 * Requires human review disclaimer to be explicitly confirmed.
 */
export async function pushMeetingToOdoo(params: {
  meetingId: string;
  user: UserSession;
  disclaimerAccepted: boolean;
  profileName?: string;
  projectName?: string;
}): Promise<OdooProjectRef> {
  const { meetingId, user, disclaimerAccepted, profileName = 'skillbon', projectName } = params;

  if (!disclaimerAccepted) {
    throw new Error('Bạn phải xác nhận đã rà soát danh sách công việc và cam kết chịu trách nhiệm trước khi đẩy lên Odoo.');
  }

  // 1. Get meeting record
  const record = await getMeeting(meetingId, user.uid);
  if (!record) {
    throw new Error('Không tìm thấy cuộc họp hoặc bạn không có quyền thao tác trên cuộc họp này.');
  }

  if (record.recap.actionItems.length === 0) {
    throw new Error('Cuộc họp này không có Action Items nào để khởi tạo dự án Odoo.');
  }

  // 2. Generate standard WBS Excel
  const excelBuffer = await generateMeetingExcel(record);
  const tempDir = path.join(config.usersDir, String(user.uid), 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const tempExcelPath = path.join(tempDir, `wbs_${record.id}.xlsx`);
  await fs.writeFile(tempExcelPath, excelBuffer);

  const finalProjectName = (projectName || record.title || record.recap.title || 'Dự án từ Cuộc họp').trim();

  // 3. Execute python CLI from excel-to-odoo-project
  const engineDir = config.odooEngineDir;
  console.log(`[OdooPush] Running CLI from ${engineDir} for user ${user.email}, project: "${finalProjectName}"`);

  let stdout = '';
  let stderr = '';

  try {
    const isUv = config.odooPythonBin === 'uv';
    const bin = isUv ? 'uv' : config.odooPythonBin;
    const baseArgs = [
      '--file',
      tempExcelPath,
      '--user',
      user.email,
      '--profile',
      profileName,
      '--name',
      finalProjectName,
    ];
    const args = isUv
      ? ['run', '--with-requirements', 'requirements.txt', 'python', 'cli.py', ...baseArgs]
      : ['cli.py', ...baseArgs];

    const result = await execFileAsync(bin, args, {
      cwd: engineDir,
      timeout: 120000, // 2 minutes
    });

    stdout = result.stdout;
    stderr = result.stderr;
    if (stderr) {
      console.log(`[OdooPush] CLI stderr output: ${stderr.slice(0, 200)}`);
    }
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; message: string };
    const errText = execErr.stderr || execErr.stdout || execErr.message;
    console.error('[OdooPush] Execution error:', errText);
    throw new Error(`Khởi tạo dự án Odoo thất bại: ${errText.slice(0, 300)}`);
  } finally {
    // Clean up temporary excel file
    await fs.unlink(tempExcelPath).catch(() => {});
  }

  // 4. Parse CLI output
  // Example output:
  //   • Project ID        : 1970
  //   • Tên dự án         : Dự án Sprint Test
  //   • Người đứng tên    : BON BIS, Nguyễn Quang Hà
  //   • Số tasks đã tạo   : 4
  //   🔗 Đường link truy cập dự án trên Odoo:
  //     https://skillbon.odoo.com/odoo/action-443/1970/action-446
  const projectIdMatch = stdout.match(/Project ID\s*:\s*(\d+)/i);
  const projectUrlMatch = stdout.match(/https?:\/\/[^\s]+/);
  const tasksCreatedMatch = stdout.match(/Số tasks đã tạo\s*:\s*(\d+)/i);

  if (!projectIdMatch) {
    console.error('[OdooPush] Output could not be parsed:', stdout);
    throw new Error('Dự án có thể đã được tạo nhưng không thể trích xuất ID từ log Odoo. Vui lòng kiểm tra trên Odoo.');
  }

  const projectId = Number(projectIdMatch[1]);
  const tasksCount = tasksCreatedMatch ? Number(tasksCreatedMatch[1]) : record.recap.actionItems.length;
  const projectUrl = projectUrlMatch ? projectUrlMatch[0] : `${getOdooProfileConfig(profileName).baseUrl}/odoo/action-443/${projectId}/action-446`;

  const odooRef: OdooProjectRef = {
    projectId,
    projectName: finalProjectName,
    projectUrl,
    pushedBy: `${user.name} (${user.email})`,
    pushedAt: new Date().toISOString(),
    tasksCount,
    profileName,
  };

  // 5. Save reference to meeting record
  record.odooProject = odooRef;
  await saveMeeting(record, user.uid);

  console.log(`[OdooPush] Successfully created Odoo Project #${projectId}: ${projectUrl}`);
  return odooRef;
}
