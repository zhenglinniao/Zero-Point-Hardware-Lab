import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
// Rasterize the existing vector brand at native resolution for each surface.
const svg = await readFile(
  new URL('../public/favicon.svg', import.meta.url),
  'utf8',
);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const pngs = new Map();
  for (const size of [16, 32, 48, 96, 180, 192, 256, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{width:100%;height:100%;display:block}</style>${svg}`,
    );
    pngs.set(size, await page.screenshot({ omitBackground: true }));
  }
  for (const [size, file] of [
    [96, 'favicon-96.png'],
    [180, 'apple-touch-icon.png'],
    [192, 'icon-192.png'],
    [512, 'icon-512.png'],
  ])
    await writeFile(
      new URL('../public/' + file, import.meta.url),
      pngs.get(size),
    );
  const sizes = [16, 32, 48, 256];
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const at = 6 + i * 16,
      data = pngs.get(size);
    header[at] = header[at + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  await writeFile(
    new URL('../public/favicon.ico', import.meta.url),
    Buffer.concat([header, ...sizes.map((size) => pngs.get(size))]),
  );
  console.log(
    'Generated PNG favicons, app icons and multi-resolution ICO from favicon.svg.',
  );
} finally {
  await browser.close();
}
