import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseQrLandingUrl, stripTrailingSlash } from './config';

describe('site QR landing URL helpers', () => {
  it('accepts http(s) landing URLs and strips trailing slash', () => {
    const ok = parseQrLandingUrl('https://ramkin.example/');
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.url, 'https://ramkin.example');
    assert.equal(stripTrailingSlash('http://127.0.0.1:5173/'), 'http://127.0.0.1:5173');
  });

  it('rejects non-http schemes and self-stamp style paths', () => {
    assert.equal(parseQrLandingUrl('ftp://example.com').ok, false);
    assert.equal(parseQrLandingUrl('not a url').ok, false);
    assert.equal(parseQrLandingUrl('https://ramkin.local/c/abc123token').ok, false);
    assert.equal(parseQrLandingUrl('https://example.com/self-stamp').ok, false);
  });
});
