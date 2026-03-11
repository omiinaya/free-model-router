import { existsSync, statSync, openSync, readSync, closeSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DEFAULT_LOG_FILE = join(homedir(), '.free-coding-models', 'request-log.jsonl');
const MAX_READ_BYTES = 128 * 1024; // 128 KB

export function buildProviderModelTokenKey(providerKey: string, modelId: string): string {
  return `${providerKey}::${modelId}`;
}

interface ParsedRow {
  provider: string;
  model: string;
  tokens: number;
}

function parseLogLine(line: string): ParsedRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let entry;
  try {
    entry = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!entry || typeof entry !== 'object') return null;
  if (!entry.timestamp) return null;

  // tokens = prompt + completion
  const tokens = (Number(entry.usage?.prompt_tokens ?? entry.promptTokens ?? 0) +
                  Number(entry.usage?.completion_tokens ?? entry.completionTokens ?? 0)) || 0;
  if (tokens <= 0) return null;

  // provider: use providerKey or provider, fallback to accountId parsing
  let provider = entry.providerKey || entry.provider;
  if (!provider && typeof entry.accountId === 'string' && entry.accountId.includes('/')) {
    provider = entry.accountId.split('/')[0];
  }
  if (!provider) provider = 'unknown';

  // model: use modelId or model
  const model = String(entry.modelId ?? entry.model ?? 'unknown');

  return { provider, model, tokens };
}

export function loadTokenUsageByProviderModel(options: { logFile?: string; limit?: number } = {}): Record<string, number> {
  const { logFile = DEFAULT_LOG_FILE, limit = 50000 } = options;
  const totals: Record<string, number> = {};

  try {
    if (!existsSync(logFile)) return totals;
    const fileSize = statSync(logFile).size;
    if (fileSize === 0) return totals;

    const readBytes = Math.min(fileSize, MAX_READ_BYTES);
    const fileOffset = fileSize - readBytes;

    const buf = Buffer.allocUnsafe(readBytes);
    const fd = openSync(logFile, 'r');
    try {
      readSync(fd, buf, 0, readBytes, fileOffset);
    } finally {
      closeSync(fd);
    }

    const text = buf.toString('utf8');
    const rawLines = text.split('\n');
    const lines = fileOffset > 0 ? rawLines.slice(1) : rawLines;

    let count = 0;
    // Iterate from the end to get the most recent entries first
    for (let i = lines.length - 1; i >= 0 && count < limit; i--) {
      const row = parseLogLine(lines[i]);
      if (row) {
        const key = buildProviderModelTokenKey(row.provider, row.model);
        totals[key] = (totals[key] || 0) + row.tokens;
        count++;
      }
    }
  } catch (err) {
    console.error('Failed to read token usage:', err);
  }

  return totals;
}
