import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// ws < 8.23.0 lets a peer flood Ping frames while not reading and buffer
// auto-Pongs until the process runs out of memory (websockets/ws ace7248).
// The signaling server accepts untrusted WebSocket peers, so keep the fix locked.
describe('ws lockfile pin', () => {
  it('resolves ws to a release with the auto-Pong DoS fix', () => {
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    const [major, minor] = lock.packages['node_modules/ws'].version.split('.').map(Number);
    expect(major > 8 || (major === 8 && minor >= 23)).toBe(true);
  });
});
