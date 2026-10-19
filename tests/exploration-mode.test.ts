import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, type LevelId } from '../lib/levels.ts';
import {
  explorationMode,
  physicalExploration,
} from '../lib/exploration-mode.ts';

await test('every physical level explicitly declares its construction/disassembly mode', () => {
  for (const [id, level] of Object.entries(levels)) {
    if (level.kind === 'physical')
      assert.ok(physicalExploration[id as LevelId], id);
    else assert.equal(explorationMode(id as LevelId).kind, 'logical', id);
    assert.equal(explorationMode(id as LevelId, 100).kind, 'inventory', id);
  }
});
await test('bonded, welded, sectional and illustrative assemblies cannot be labelled ordinary service disassembly', () => {
  assert.equal(explorationMode('earbudunit').kind, 'bonded');
  assert.equal(explorationMode('ps5cooling').kind, 'welded');
  assert.equal(explorationMode('ps5-power').kind, 'manufacturing');
  assert.equal(explorationMode('engine').kind, 'section');
  for (const id of ['cameralens', 'earbuddriver'] as const)
    assert.equal(explorationMode(id).kind, 'optical');
});
