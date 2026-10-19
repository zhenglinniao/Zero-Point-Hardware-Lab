import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { digitalDefinitions, digitalRoots } from '../lib/digital/catalogue.ts';
import { digitalLessons } from '../lib/digital-learning.ts';

const base=process.env.NOTEBOOK_BASE_URL ?? 'http://127.0.0.1:4173';
const output='output/playwright/digital';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({ executablePath:process.env.BROWSER_EXECUTABLE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  const errors=[];
  page.on('pageerror',(error)=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('pc-anatomy-performance-tip-v1','1'));
  const click=(locator)=>locator.evaluate((button)=>button.click());
  const ready=(level,explode)=>page.waitForFunction(({level,explode})=>{
    const stage=document.querySelector('.viewport');
    return stage?.dataset.level===level && Number(stage.dataset.triangles)>0 && stage.dataset.cameraSettled==='true' && stage.dataset.transitioning!=='true' && (explode===undefined || Math.abs(Number(stage.dataset.explode)-explode)<.1);
  },{level,explode},{timeout:90000});
  const capture=(name)=>page.screenshot({path:`${output}/${name}.png`,timeout:60000});
  await page.goto(base);
  await page.locator('.device-card').first().waitFor();
  assert.equal(await page.locator('.device-card').count(),8);
  await click(page.getByRole('tab',{name:'游戏',exact:true}));
  assert.equal(await page.locator('.device-card').count(),2);
  await click(page.getByRole('tab',{name:'全部',exact:true}));
  await page.locator('#devices').scrollIntoViewIfNeeded();
  await capture('device-library');
  console.log('Checking all digital scales at assembly, dissection and inventory');
  for(const definition of digitalDefinitions) {
    console.log('Rendering',definition.id);
    await page.goto(`${base}/?scale=${definition.id}`);
    await ready(definition.id,0);
    if(digitalRoots.includes(definition.id)) await capture(`${definition.id}-assembled`);
    await click(page.locator('[data-phase="Dissection"]')); await ready(definition.id,50);
    await capture(`${definition.id}-dissection`);
    await click(page.locator('[data-phase="Inventory"]')); await ready(definition.id,100);
    assert.ok(await page.locator('.part-labels button').count()>0,definition.id);
  }
  console.log('Checking Chinese inherited descriptions and digital details, visibility and dives');
  await page.goto(`${base}/?scale=card&part=card`,{waitUntil:'domcontentloaded'}); await ready('card');
  await page.locator('.detail-panel').waitFor();
  assert.match(await page.locator('.detail-panel [data-slot="sheet-description"]').innerText(),/[\u3400-\u9fff]/);
  await capture('inherited-chinese-detail');
  await page.goto(`${base}/?scale=phone&part=phone-battery&open=50`); await ready('phone',50);
  await page.locator('.detail-panel').waitFor();
  assert.match(await page.locator('.detail-panel [data-slot="sheet-description"]').innerText(),/电池/);
  await capture('phone-chinese-detail');
  await click(page.getByRole('button',{name:'单独查看',exact:true}));
  await page.getByRole('button',{name:'显示周围部件',exact:true}).waitFor();
  await click(page.getByRole('button',{name:'隐藏',exact:true}));
  await page.locator('.hidden-tracker').waitFor();
  if(!(await page.getByRole('button',{name:'全部恢复',exact:true}).isVisible())) await click(page.locator('.hidden-tracker-toggle'));
  await click(page.getByRole('button',{name:'全部恢复',exact:true}));
  await page.goto(`${base}/?scale=ps5&part=ps5board&open=100`); await ready('ps5',100);
  await click(page.getByRole('button',{name:/^继续拆解 /})); await ready('ps5board');
  await click(page.getByRole('button',{name:'Back one level',exact:true})); await ready('ps5');
  console.log('Checking five complete new learning paths');
  for(const lesson of digitalLessons) {
    console.log('Learning',lesson.id);
    await page.goto(`${base}/?lesson=${lesson.id}`);
    for(let index=0;index<lesson.steps.length;index++) {
      const step=lesson.steps[index];
      await ready(step.level,0);
      if(step.minimumOpen>0) await click(page.locator(`[data-phase="${step.minimumOpen===100?'Inventory':'Dissection'}"]`));
      await page.locator('.observe-task.is-done').waitFor({timeout:60000});
      await click(page.locator('.knowledge-check button').nth(step.answer));
      await page.locator('.answer-feedback.correct').waitFor();
      assert.ok(await page.evaluate((id)=>JSON.parse(localStorage.getItem('zln-lab-progress-v1')??'[]').includes(id),step.id));
      await click(page.locator('.coach-actions > button'));
    }
    await page.locator('.learning-home').waitFor();
  }
  console.log('Checking mobile library and phone model');
  await page.setViewportSize({width:390,height:844});
  await page.goto(base); await page.locator('#devices').scrollIntoViewIfNeeded();
  await capture('device-library-mobile');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await click(page.locator('[data-device="phone"]')); await ready('phone');
  await capture('phone-mobile');
  await click(page.getByRole('button',{name:'展开实验面板'}));
  await page.locator('.explorer.mobile-open').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('Digital checks passed: all digital scales × 3 poses, all 5 learning paths, Chinese descriptions, visibility, nested dive, device filters and mobile; no page errors.');
} finally { await browser.close(); }

