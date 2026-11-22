import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { messages } from './i18n/locales';

describe('customer app smoke', () => {
  it('placeholder passes', () => {
    assert.equal(1 + 1, 2);
  });

  it('keeps EN/AR message keys aligned', () => {
    const enKeys = Object.keys(messages.en).sort();
    const arKeys = Object.keys(messages.ar).sort();
    assert.deepEqual(arKeys, enKeys);
  });

  it('points Order Online at the official Foodics menu', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const configSrc = readFileSync(path.join(here, 'config.ts'), 'utf8');
    assert.match(configSrc, /FOODICS_MENU_URL/);
    const constantsSrc = readFileSync(
      path.join(here, '../../../packages/shared/src/constants.ts'),
      'utf8',
    );
    assert.match(constantsSrc, /ramkin\.foodics\.online\/menu\/-289360/);
  });
});
