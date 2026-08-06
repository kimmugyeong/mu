import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTournamentGroups, buildKbkPairings } from '../lib/tournament.js';

test('3개 그룹으로 참가자를 나눌 수 있다', () => {
  const groups = buildTournamentGroups(['A', 'B', 'C', 'D', 'E', 'F'], 3);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups[0], ['A', 'D']);
  assert.deepEqual(groups[1], ['B', 'E']);
  assert.deepEqual(groups[2], ['C', 'F']);
});

test('KBK 방식으로 짝을 생성할 수 있다', () => {
  const pairings = buildKbkPairings(['A', 'B', 'C', 'D']);
  assert.equal(pairings.length, 6);
  assert.deepEqual(pairings[0], ['A', 'D']);
  assert.deepEqual(pairings[1], ['B', 'C']);
});
