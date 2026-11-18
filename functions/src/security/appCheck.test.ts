import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { APP_CHECK_SETUP_NOTES, appCheckCallableOptions, assertAppCheck } from './appCheck';

function fakeRequest(hasApp: boolean): CallableRequest {
  return {
    app: hasApp ? ({ appId: 'test' } as CallableRequest['app']) : undefined,
    auth: undefined,
    data: {},
    rawRequest: {} as CallableRequest['rawRequest'],
    acceptsStreaming: false,
  };
}

describe('assertAppCheck', () => {
  const prev = process.env.ENFORCE_APP_CHECK;

  afterEach(() => {
    if (prev === undefined) delete process.env.ENFORCE_APP_CHECK;
    else process.env.ENFORCE_APP_CHECK = prev;
  });

  it('allows missing App Check token when enforcement is off (soft stub)', () => {
    process.env.ENFORCE_APP_CHECK = 'false';
    assert.doesNotThrow(() => assertAppCheck(fakeRequest(false), 'exportReport'));
    assert.deepEqual(appCheckCallableOptions(), { enforceAppCheck: false });
  });

  it('rejects missing App Check token when ENFORCE_APP_CHECK=true', () => {
    process.env.ENFORCE_APP_CHECK = 'true';
    assert.throws(
      () => assertAppCheck(fakeRequest(false), 'exportReport'),
      (err: unknown) => err instanceof HttpsError && err.code === 'failed-precondition',
    );
    assert.deepEqual(appCheckCallableOptions(), { enforceAppCheck: true });
  });

  it('allows verified App Check token when enforcement is on', () => {
    process.env.ENFORCE_APP_CHECK = 'true';
    assert.doesNotThrow(() => assertAppCheck(fakeRequest(true), 'lookupCustomerByQr'));
  });

  it('documents Console setup steps (never invent secrets)', () => {
    assert.ok(APP_CHECK_SETUP_NOTES.some((n) => n.includes('hloe-45d43')));
    assert.ok(APP_CHECK_SETUP_NOTES.some((n) => n.includes('ENFORCE_APP_CHECK')));
  });
});
