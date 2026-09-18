#!/usr/bin/env node
/**
 * Secure local bridge from the Dockerized recap app to the host's authenticated
 * Windows AGY CLI. Keep this process on the same host as agy and do not expose
 * its port through Cloudflare/the Internet.
 */
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';

const port = Number(process.env.AGY_BRIDGE_PORT ?? 3310);
const token = process.env.AGY_BRIDGE_TOKEN;
const command = process.env.AGY_COMMAND ?? 'agy';
const workspace = process.env.AGY_BRIDGE_WORKSPACE ?? process.cwd();
const maxBodyBytes = 1_000_000;

if (!token || token.length < 32) {
  throw new Error('Set AGY_BRIDGE_TOKEN to a random secret with at least 32 characters.');
}

function writeJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function authorized(request) {
  const value = request.headers.authorization;
  const expected = `Bearer ${token}`;
  if (!value || value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

function executeAgy({ prompt, model, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const timeout = Math.min(Math.max(Number(timeoutMs) || 600_000, 10_000), 900_000);
    const child = spawn(command, [
      '--print',
      prompt,
      '--model',
      model,
      '--output-format',
      'json',
      '--disable-slash-commands',
      '--print-timeout',
      `${Math.ceil(timeout / 1000)}s`,
    ], { cwd: workspace, shell: false, windowsHide: true });

    let output = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeout + 10_000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`AGY timed out after ${Math.round(timeout / 1000)} seconds.`));
      else if (code !== 0) reject(new Error(`AGY exited with code ${code}: ${stderr.trim() || output.trim()}`));
      else resolve({ output, stderr });
    });
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return writeJson(response, 200, { status: 'ok' });
  }
  if (request.method !== 'POST' || request.url !== '/v1/agy') {
    return writeJson(response, 404, { error: 'Not found' });
  }
  if (!authorized(request)) {
    return writeJson(response, 401, { error: 'Unauthorized' });
  }

  let raw = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => {
    raw += chunk;
    if (Buffer.byteLength(raw) > maxBodyBytes) request.destroy();
  });
  request.on('error', () => undefined);
  request.on('end', async () => {
    try {
      const body = JSON.parse(raw);
      if (
        typeof body.prompt !== 'string' || body.prompt.length > 100_000 ||
        typeof body.model !== 'string' || !/^gemini-[a-z0-9.-]+$/i.test(body.model)
      ) {
        return writeJson(response, 400, { error: 'Invalid request payload.' });
      }
      const result = await executeAgy(body);
      return writeJson(response, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AGY bridge error';
      console.error('[agy-host-bridge]', message);
      return writeJson(response, 502, { error: message });
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`AGY host bridge is listening on http://0.0.0.0:${port} (workspace: ${workspace})`);
});
