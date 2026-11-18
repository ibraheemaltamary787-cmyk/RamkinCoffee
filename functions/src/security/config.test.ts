import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('Firebase project hygiene (Phase 7)', () => {
  it('does not bind .firebaserc to hloe-45d43 or any live project id', () => {
    const raw = fs.readFileSync(path.join(repoRoot, '.firebaserc'), 'utf8');
    const parsed = JSON.parse(raw) as { projects?: Record<string, string> };
    assert.deepEqual(parsed.projects ?? {}, {});
    assert.equal(raw.includes('hloe-45d43'), false);
  });

  it('keeps .env.example free of real secrets and hloe project id as a value', () => {
    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    assert.match(envExample, /Never reuse project hloe-45d43/);
    assert.doesNotMatch(envExample, /^VITE_FIREBASE_PROJECT_ID=\s*hloe/m);
    assert.doesNotMatch(envExample, /BEGIN PRIVATE KEY/);
    // Only fail on an uncommented assignment with a real value (comments may show the name).
    assert.doesNotMatch(envExample, /^BOOTSTRAP_OWNER_SECRET=\s*\S+/m);
  });

  it('firestore.rules deny client writes on privileged collections', () => {
    const rules = fs.readFileSync(path.join(repoRoot, 'firestore.rules'), 'utf8');
    for (const collection of [
      'purchases',
      'rewardRequests',
      'settings',
      'activityLogs',
      'staffInvites',
      'rateLimits',
    ]) {
      assert.match(rules, new RegExp(`match /${collection}/`));
    }
    assert.match(rules, /allow create, update, delete: if false/);
    assert.match(rules, /match \/rateLimits\/\{docId\}[\s\S]*allow read, write: if false/);
  });
});
