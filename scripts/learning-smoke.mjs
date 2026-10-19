import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:4173';
const output = 'output/playwright/learning';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1'));
  const click = (locator) => locator.evaluate((button) => button.click());
  const capture = (name) => page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  const ready = (level) => page.waitForFunction((id) => {
    const stage = document.querySelector('.viewport');
    return stage?.dataset.level === id && Number(stage.dataset.triangles) > 0 && stage.dataset.cameraSettled === 'true';
  }, level, { timeout: 90000 });
  const answer = (index) => click(page.locator('.knowledge-check button').nth(index));
  console.log('Checking original dashboard, vector interaction and mobile layout');
  await page.goto(base);
  await page.getByRole('heading', { name: '今天，想拆懂什么？' }).waitFor();
  assert.equal(await page.locator('canvas').count(), 0, 'dashboard should not mount the 3D engine');
  await capture('home-desktop');
  await click(page.getByRole('button', { name: '收起结构' }));
  assert.equal(await page.getByRole('button', { name: '展开结构' }).getAttribute('aria-pressed'), 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await capture('home-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('Checking observation gating, wrong answer and correct answer');
  await click(page.getByRole('button').filter({ hasText: '追踪一个比特' }));
  await ready('dimm');
  assert.equal(await page.locator('.knowledge-check button:disabled').count(), 3);
  await click(page.locator('[data-phase="Dissection"]'));
  await page.locator('.observe-task.is-done').waitFor({ timeout: 60000 });
  await answer(0);
  assert.equal(await page.locator('.answer-feedback.correct').count(), 0);
  assert.ok(await page.getByRole('button', { name: '下一个实验' }).isDisabled());
  await answer(1);
  await page.locator('.answer-feedback.correct').waitFor();
  await capture('lesson-desktop');
  await click(page.getByRole('button', { name: '下一个实验' }));
  await ready('dram');
  await page.reload();
  await ready('dram');
  assert.equal(await page.locator('.lesson-coach').count(), 1, 'refresh should retain course mode and resume the incomplete step');
  await click(page.locator('[data-phase="Inventory"]'));
  await page.locator('.observe-task.is-done').waitFor({ timeout: 60000 });
  await answer(0);
  await click(page.getByRole('button', { name: '下一个实验' }));
  await ready('cell');
  await page.locator('.observe-task.is-done').waitFor({ timeout: 60000 });
  await answer(2);
  await page.getByText('这条路径，你已经拆懂了。', { exact: true }).waitFor();
  await click(page.locator('.coach-actions').getByRole('button', { name: '返回学习台', exact: true }));
  assert.equal(await page.getByRole('progressbar', { name: '总学习进度' }).getAttribute('aria-valuenow'), '3');
  console.log('Checking persisted progress, review, mobile task drawer and reset');
  await page.reload();
  assert.equal(await page.getByRole('progressbar', { name: '总学习进度' }).getAttribute('aria-valuenow'), '3');
  await capture('home-progress');
  await page.setViewportSize({ width: 390, height: 844 });
  await click(page.getByRole('button').filter({ hasText: '追踪一个比特' }));
  await ready('dimm');
  await click(page.getByRole('button', { name: '展开实验面板' }));
  await page.locator('.explorer.mobile-open').waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await capture('lesson-mobile');
  await click(page.getByRole('button', { name: '所有实验', exact: true }));
  await click(page.getByRole('button', { name: '重置学习记录' }));
  await click(page.getByRole('button', { name: '取消', exact: true }));
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '3');
  await click(page.getByRole('button', { name: '重置学习记录' }));
  await click(page.getByRole('button', { name: '确认清除', exact: true }));
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '0');
  await page.evaluate(() => localStorage.setItem('zln-lab-progress-v1', '{broken json'));
  await page.reload();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '0');
  await page.goto(base + '/?scale=sm');
  await ready('sm');
  assert.equal(await page.locator('.lesson-coach').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Learning checks passed: dashboard, observation gating, wrong/correct answers, full path, progress persistence, review, mobile, reset, corrupt storage, free deep links; no page errors.');
} finally {
  await browser.close();
}
