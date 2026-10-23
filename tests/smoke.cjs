const { chromium } = require('playwright');
const path = require('path');
(async () => {
const file = 'file://' + path.resolve(process.argv[2] || 'kontura.html');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 412, height: 860 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(file); await p.waitForTimeout(1500);
console.log('errors:', errs);
console.log(await p.evaluate(() => { loadExample5 ? 0 : 0; return typeof loadExample + ' ' + typeof window.__app; }));
await b.close();
})();
