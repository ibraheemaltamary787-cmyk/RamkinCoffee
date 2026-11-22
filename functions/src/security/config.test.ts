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
    // Public web config from Console web app "RAMKIN Web" (not secrets).
    assert.match(envExample, /^VITE_FIREBASE_API_KEY=AIzaSy/m);
    assert.match(envExample, /^VITE_FIREBASE_APP_ID=1:392513147835:web:[a-f0-9]+$/m);
    assert.match(envExample, /^VITE_FIREBASE_STORAGE_BUCKET=ramkincoffee\.firebasestorage\.app$/m);
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

  it('firebase.json pins Auth/Functions/Firestore emulator ports for local Spark workflow', () => {
    const raw = fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8');
    const parsed = JSON.parse(raw) as {
      emulators?: Record<string, { host?: string; port?: number; enabled?: boolean }>;
    };
    assert.equal(parsed.emulators?.auth?.port, 9099);
    assert.equal(parsed.emulators?.functions?.port, 5001);
    assert.equal(parsed.emulators?.firestore?.port, 8080);
    assert.equal(parsed.emulators?.ui?.enabled, true);
    assert.equal(parsed.emulators?.ui?.port, 4000);
    assert.match(raw, /"host": "127\.0\.0\.1"/);
  });

  it('documents emulator workflow and local bootstrap secret example', () => {
    const emulatorDoc = fs.readFileSync(
      path.join(repoRoot, 'docs/FIREBASE_EMULATOR_DEV.md'),
      'utf8',
    );
    assert.match(emulatorDoc, /VITE_USE_FIREBASE_EMULATORS=true/);
    assert.match(emulatorDoc, /npm run emulators/);
    assert.match(emulatorDoc, /seed:emulator/);
    assert.match(emulatorDoc, /No Blaze/);

    const secretExample = fs.readFileSync(
      path.join(repoRoot, 'functions/.secret.local.example'),
      'utf8',
    );
    assert.match(secretExample, /^BOOTSTRAP_OWNER_SECRET=.+/m);
    assert.doesNotMatch(secretExample, /hloe-45d43/);

    const envExample = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
    assert.match(envExample, /^VITE_USE_FIREBASE_EMULATORS=true$/m);
    assert.match(envExample, /^VITE_DEV_FAKE_OTP=true$/m);
    assert.match(envExample, /DEV ONLY — Fake OTP/);
  });
});
