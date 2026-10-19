import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, lessonFromSearch, resumeStep, sanitizeProgress } from '../lib/learning.ts';
import { levels, isPhysical } from '../lib/levels.ts';

test('learning paths refer to existing models and valid interaction conditions', () => {
  const ids = lessons.flatMap((lesson) => lesson.steps.map((step) => step.id));
  assert.equal(ids.length, new Set(ids).size);
  for (const lesson of lessons) for (const step of lesson.steps) {
    assert.ok(levels[step.level]);
    assert.ok(step.answer >= 0 && step.answer < step.options.length);
    assert.ok(step.minimumOpen >= 0 && step.minimumOpen <= 100);
    assert.ok(isPhysical(step.level) || step.minimumOpen === 0);
    assert.ok(step.question && step.explanation && step.observe);
  }
});

test('saved progress rejects corrupt values, duplicates and unknown future steps', () => {
  const id = lessons[0].steps[0].id;
  assert.deepEqual(sanitizeProgress(null), []);
  assert.deepEqual(sanitizeProgress({ completed: true }), []);
  assert.deepEqual(sanitizeProgress([id, id, null, 3, 'unknown']), [id]);
});

test('resume finds the first incomplete step, regardless of out-of-order exploration', () => {
  const lesson = lessons[0];
  assert.equal(resumeStep(lesson, []), 0);
  assert.equal(resumeStep(lesson, [lesson.steps[2].id]), 0);
  assert.equal(resumeStep(lesson, [lesson.steps[0].id, lesson.steps[2].id]), 1);
  assert.equal(resumeStep(lesson, lesson.steps.map((step) => step.id)), 0);
});

test('course links only accept known paths and can coexist with model links', () => {
  assert.equal(lessonFromSearch('?lesson=memory')?.id, 'memory');
  assert.equal(lessonFromSearch('?scale=dram&lesson=memory')?.id, 'memory');
  assert.equal(lessonFromSearch('?lesson=unknown'), undefined);
  assert.equal(lessonFromSearch(''), undefined);
});
