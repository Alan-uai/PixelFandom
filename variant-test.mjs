import { chromium } from 'playwright';

const BASE = 'http://localhost:9002';
const url = `${BASE}/w/exemplo/example_table_1?item=exemplo-de-itens-v3`;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

// Find and click the item card (item-exemplo-de-itens-v3)
const card = page.locator('[id="item-exemplo-de-itens-v3"], .rounded-xl.border').first();
await card.click();
await page.waitForTimeout(800);

// Now look for variant chips (Variantes (N))
const variantLabel = page.getByText(/Variantes\s*\(\d+\)/).first();
const variantsVisible = await variantLabel.count();
console.log('Variantes label count:', variantsVisible);

if (variantsVisible > 0) {
  // click the second variant chip (v2)
  const varSection = variantLabel.locator('xpath=ancestor::div[1]/following-sibling::div[1]');
  const buttons = varSection.locator('button');
  const n = await buttons.count();
  console.log('variant chip buttons:', n);
  for (let i = 0; i < n; i++) {
    const txt = (await buttons.nth(i).innerText()).trim();
    console.log('  chip', i, '=', JSON.stringify(txt));
  }
}

await page.screenshot({ path: '/tmp/opencode/variant-before.png', fullPage: false });
console.log('ERRORS:', JSON.stringify(errors, null, 2));
await browser.close();