import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', String(e)));
await page.goto('http://localhost:9002/w/exemplo/example_table_1?item=exemplo-de-itens-v3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
console.log('URL now:', page.url());
const text = await page.evaluate(() => { const body = document.body; return body ? body.innerText.slice(0, 1500) : 'NO BODY'; }); // eslint-disable-line no-undef
console.log('BODY TEXT:\n', text);
console.log('TITLE:', await page.title());
await page.screenshot({ path: '/tmp/opencode/inspect.png' });
await browser.close();
