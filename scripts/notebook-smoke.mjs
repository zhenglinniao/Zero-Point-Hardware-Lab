import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const output = process.env.SMOKE_OUTPUT_DIR ?? 'output/playwright';
await mkdir(output, { recursive: true });

const base = process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:5173';
console.log('Checking laptop interactions at', base);
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log('Page error:', error.message);
  });
  await page.addInitScript(() =>
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1'),
  );
  const ready = async (level, explode = 0) => {
    await page.waitForFunction(
      ({ level, explode }) => {
        const host = document.querySelector('.viewport');
        return (
          host?.dataset.level === level &&
          Number(host.dataset.explode) === explode &&
          host.dataset.cameraSettled === 'true' &&
          host.dataset.transitioning !== 'true' &&
          Number(host.dataset.triangles) > 0
        );
      },
      { level, explode },
      { timeout: 60000 },
    );
    assert.deepEqual(errors, [], level);
  };
  const phase = async (name, level, amount) => {
    await page
      .locator(`[data-phase="${name}"]`)
      .evaluate((button) => button.click());
    await ready(level, amount);
  };
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  const openFromTray = async (label, destination) => {
    console.log('Opening', destination, 'from its tray item');
    await page
      .getByRole('list', { name: 'Parts on the tray' })
      .getByRole('button', { name: label, exact: true })
      .evaluate((button) => button.click());
    await page
      .getByRole('button', { name: new RegExp('^继续拆解 ') })
      .evaluate((button) => button.click());
    await ready(destination);
  };
  await page.goto(base + '/?scale=legion');
  await ready('legion');
  await capture('legion-assembled');
  await phase('Dissection', 'legion', 50);
  await capture('legion-exploded');
  await phase('Inventory', 'legion', 100);
  await capture('legion-inventory');
  await openFromTray('笔记本系统主板', 'legionboard');
  await phase('Inventory', 'legionboard', 100);
  await openFromTray('DDR4 SO-DIMM 内存', 'legionmemory');
  await phase('Inventory', 'legionmemory', 100);
  await openFromTray('笔记本 DRAM 封装', 'legionpackage');
  await phase('Dissection', 'legionpackage', 50);
  await capture('legion-package-exploded');
  console.log('Switching to Mac');
  await page
    .locator('.system-picker button')
    .filter({ hasText: 'MacBook' })
    .evaluate((button) => button.click());
  await ready('macbook');
  await capture('macbook-assembled');
  await phase('Dissection', 'macbook', 50);
  await capture('macbook-exploded');
  await page
    .getByRole('button', { name: 'Reset camera and assembly' })
    .evaluate((button) => button.click());
  await ready('macbook');
  assert.equal(new URL(page.url()).searchParams.get('scale'), 'macbook');
  console.log('Comparing both laptops');
  await page
    .locator('.compare-button')
    .evaluate((button) => button.click());
  await page
    .getByRole('button', { name: '笔记本电脑', exact: true })
    .evaluate((button) => button.click());
  await page.waitForFunction(
    () =>
      document.querySelector('.comparison-viewport')?.dataset.pair ===
      'legion:macbook',
  );
  await page
    .getByRole('button', { name: 'Swap comparison sides' })
    .evaluate((button) => button.click());
  await page.waitForFunction(
    () =>
      document.querySelector('.comparison-viewport')?.dataset.pair ===
      'macbook:legion',
  );
  await page
    .getByRole('button', { name: '返回实验台' })
    .evaluate((button) => button.click());
  console.log('Checking the existing desktop explorer');
  await page
    .locator('.system-picker button')
    .filter({ hasText: '台式电脑' })
    .evaluate((button) => button.click());
  await ready('pc');
  await capture('pc-assembled');
  await phase('Dissection', 'pc', 50);
  await phase('Inventory', 'pc', 100);
  await capture('pc-inventory');
  console.log('Checking Chinese guide and return to the explorer');
  await page.goto(base + '/guide/zh-CN.html');
  await page.getByRole('heading', { name: '第一次探索，只需三步' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
  await capture('guide-zh-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await capture('guide-zh-mobile');
  await page.goto(base + '/?scale=pc');
  await ready('pc');
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('Checking mobile navigation and deep links');
  await page.goto(base + '/?scale=maccell');
  console.log(
    'Cell page loaded',
    await page.locator('.viewport').getAttribute('data-level'),
  );
  await ready('maccell');
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: '展开实验面板' })
    .evaluate((button) => button.click());
  await page
    .locator('.system-picker button')
    .filter({ hasText: 'Legion' })
    .evaluate((button) => button.click());
  await ready('legion');
  await capture('legion-mobile');
  assert.deepEqual(errors, []);
  console.log(
    'Interaction checks passed: tray dives, reset, comparison, desktop disassembly, Chinese guide, mobile, links; no page errors.',
  );
} finally {
  await browser.close();
}
