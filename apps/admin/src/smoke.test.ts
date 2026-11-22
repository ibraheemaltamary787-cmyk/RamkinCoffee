import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { messages, type MessageKey } from './i18n/locales';

describe('admin app smoke', () => {
  it('EN and AR message catalogs share the same keys', () => {
    const enKeys = Object.keys(messages.en).sort();
    const arKeys = Object.keys(messages.ar).sort();
    assert.deepEqual(arKeys, enKeys);
    assert.ok(enKeys.length > 40);
  });

  it('critical admin chrome keys exist', () => {
    const required: MessageKey[] = [
      'navOverview',
      'navCounter',
      'navTransactions',
      'channelOnline',
      'channelInStore',
      'verificationPending',
      'qrTitle',
      'qrWarning',
    ];
    for (const key of required) {
      assert.ok(messages.en[key], key);
      assert.ok(messages.ar[key], key);
    }
  });
});
