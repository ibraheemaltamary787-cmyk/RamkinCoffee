import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('Firebase project hygiene (Phase 7)', () => {
  it('binds .firebaserc default to ramkincoffee and never hloe-45d43', () => {
    const raw = fs.readFileSync(path.join(repoRoot, '.firebaserc'), 'utf8');
    const parsed = JSON.parse(raw) as { projects?: Record<string, string> };
    assert.equal(parsed.projects?.default, 'ramkincoffee');
    assert.equal(raw.includes('hloe-45d43'), false);
  });

  it('keeps .env.example free of private secrets and hloe; documents known public IDs', () => {
    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    assert.match(envExample, /Never reuse project hloe-45d43/);
    assert.match(envExample, /^VITE_FIREBASE_PROJECT_ID=ramkincoffee$/m);
    assert.match(envExample, /^VITE_FIREBASE_MESSAGING_SENDER_ID=392513147835$/m);
    assert.match(envExample, /^VITE_FIREBASE_AUTH_DOMAIN=ramkincoffee\.firebaseapp\.com$/m);
    assert.doesNotMatch(envExample, /^VITE_FIREBASE_PROJECT_ID=\s*hloe/m);
    assert.doesNotMatch(envExample, /BEGIN PRIVATE KEY/);
    // apiKey / appId remain TODO placeholders (empty) until Console values are provided.
    assert.match(envExample, /^VITE_FIREBASE_API_KEY=\s*$/m);
    assert.match(envExample, /^VITE_FIREBASE_APP_ID=\s*$/m);
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
