import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const home = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
test('all approved frontend entry points and shared assets exist', () => {
  for (const path of ['../../index.html', '../../experiences/fan-memberships.html', '../../experiences/academy-courses.html', '../../experiences/celebrity-access.html', '../../src/main.js', '../../src/styles.css']) {
    assert.equal(existsSync(new URL(path, import.meta.url)), true, `${path} should exist`);
  }
});
test('homepage preserves non-affiliation and demo-only language', () => {
  assert.match(home, /does not claim to represent or be affiliated/i);
  assert.match(home, /data-demo-form/);
  assert.match(home, /not be sent or saved/i);
});
test('all experience pages include clear concept notices', () => {
  for (const path of ['../../experiences/fan-memberships.html', '../../experiences/academy-courses.html', '../../experiences/celebrity-access.html']) {
    assert.match(readFileSync(new URL(path, import.meta.url), 'utf8'), /concept demonstration only|concept catalogue only|concept only/i);
  }
});
