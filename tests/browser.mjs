import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const html = await readFile(new URL('../index.html', import.meta.url));
const server = createServer((req,res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.locator('#dx-demo').click();
  assert.match(await page.locator('#dx-result').innerText(), /符合所選 GDM/);
  assert.match(await page.locator('#dx-result .result-table tr').nth(1).innerText(), /達門檻/);
  assert.match(await page.locator('#dx-result .tw-block').innerText(), /台灣規範[\s\S]*同樣判定為妊娠糖尿病/);
  await page.locator('#dx-unit').selectOption('mmol');
  assert.equal(await page.locator('#dx-0').inputValue(), '');
  await page.locator('#dx-0').fill('5.1');
  await page.locator('#dx-1').fill('9.0');
  await page.locator('#dx-2').fill('8.0');
  await page.locator('#diagnosis-form button[type=submit]').click();
  assert.match(await page.locator('#dx-result').innerText(), /符合所選 GDM/);
  await page.locator('#dx-next').click();
  assert.equal(await page.locator('#care-type').inputValue(), 'gdm');
  await page.locator('#care-checklist input').first().check();
  assert.match(await page.locator('#care-progress').innerText(), /1 \/ /);
  await page.locator('[data-view=glucose]').click();
  await page.locator('#log-demo').click();
  assert.match(await page.locator('#log-result').innerText(), /11/);
  assert.match(await page.locator('#log-result .tw-block').innerText(), /60–95/);
  await page.locator('[data-view=postpartum]').click();
  await page.locator('#birth-date').fill('2026-12-20');
  await page.locator('#date-form button').click();
  assert.match(await page.locator('#date-result').innerText(), /2027-01-17/);
  await page.locator('#post-fasting').fill('104');
  await page.locator('#post-two').fill('152');
  await page.locator('#post-confirm').check();
  await page.locator('#post-form button').click();
  assert.match(await page.locator('#post-result').innerText(), /糖尿病前期/);
  assert.match(await page.locator('#post-result .tw-block').innerText(), /4–12 週/);
  for (let i=0; i<6; i++) {
    await page.locator('[data-view=cases]').click();
    await page.locator('[data-case="'+i+'"]').click();
    const result = await page.locator(i===5?'#post-result':'#dx-result').innerText();
    assert.ok(result.length>40);
    if(i===4) assert.match(result,/先處理急症/);
  }
  await page.locator('[data-view=quiz]').click();
  assert.equal(await page.locator('.q-card').count(),20);
  await page.locator('[data-f=adv]').click();
  assert.equal(await page.locator('.q-card').count(),10);
  await page.locator('[data-f=all]').click();
  await page.locator('[data-q="0"] [data-o="2"]').click();
  assert.match(await page.locator('[data-q="0"] .q-why').innerText(),/答對，正確答案 C/);
  await page.locator('[data-q="1"] [data-o="0"]').click();
  assert.match(await page.locator('[data-q="1"] .q-why').innerText(),/答錯，正確答案 B/);
  assert.equal(await page.locator('[data-q="1"] .q-opt.right').count(),1);
  assert.match(await page.locator('#q-score').innerText(),/已答 2 \/ 20，答對 1/);
  await page.locator('#q-reset').click();
  assert.equal(await page.locator('.q-why').count(),0);
  await page.locator('[data-view=map]').click();
  assert.equal(await page.locator('.mm-branch').count(),6);
  const leaves=await page.locator('.mm-leaf').count();
  await page.waitForFunction(n=>document.querySelectorAll('.mm-links path').length===n,leaves+6);
  await page.locator('#mm-close').click();
  assert.equal(await page.locator('.mm-links path').count(),6);
  await page.locator('.mm-node').first().click();
  assert.equal(await page.locator('.mm-leaves:not([hidden])').count(),1);
  await page.locator('#mm-open').click();
  await page.locator('.mm-leaf.go a').first().click();
  assert.equal(await page.locator('#care').isVisible(),true);
  await page.setViewportSize({width:390,height:844});
  for (const name of ['diagnosis','care','glucose','postpartum','cases','quiz','map','sources']) {
    await page.locator('[data-view='+name+']').click();
    assert.equal(await page.locator('#'+name).isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),true, 'Mobile overflow: '+name);
  }
  assert.deepEqual(errors,[]);
  console.log('Desktop workflows, six cases, quiz, mind map, and eight mobile views passed.');
} finally {
  await browser.close();
  server.close();
}

