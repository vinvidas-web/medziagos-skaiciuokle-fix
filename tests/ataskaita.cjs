// TESTAI.md iš tests/rezultatai*.json (paleisti po agents.cjs, ocr.cjs, axes.cjs)
const fs = require('fs'), rd = f => JSON.parse(fs.readFileSync(__dirname + '/' + f, 'utf8'));
const A = rd('rezultatai.json'), O = rd('rezultatai_ocr.json'), X = rd('rezultatai_asys.json'), all = A.concat(O, X), c = k => all.filter(r => r.res === k).length;
const row = r => '| ' + r.nr + ' | ' + r.name + ' | ' + (r.res === 'PASISEKĖ' ? '✅ ' : r.res === 'NEPAVYKO' ? '❌ ' : '⬜ ') + r.res + ' | ' + String(r.note).replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 300) + ' |\n';
const H = '| Nr. | Testas | Rezultatas | Pastaba |\n|---|---|---|---|\n';
let s = '# KONTŪRAS – agentų sistemos bandymų rezultatai\n\nData: 2026-10-23 · Aplinka: Chromium (Playwright), telefono ekranas 412×860 · Failas: `kontura.html`\n\nPaleidimas: `NODE_PATH=$(npm root -g) node tests/agents.cjs`, `node tests/ocr.cjs`, `node tests/axes.cjs`, tada `node tests/ataskaita.cjs`.\n\n';
s += '**Iš viso – PASISEKĖ: ' + c('PASISEKĖ') + ' · NEPAVYKO: ' + c('NEPAVYKO') + ' · NETESTUOTA: ' + c('NETESTUOTA') + '**\n\n';
s += '> Bandyta su testui sugeneruotais PDF ir vaizdais bei programos pavyzdžiais (📐 pavyzdys, 🏢 5 aukštų). OCR laikai – kompiuterio Chromium; telefone bus lėčiau. **Su tikrais statybiniais brėžiniais netestuota.** Specifikacijos 20 skyriaus punktai 11 (ašys) ir 12 (mastelis) tikrinami skyriuje „Ašys“ (A1–A16b).\n\n';
s += '## Agentų sistema (tests/agents.cjs)\n\n' + H + A.map(row).join('');
s += '\n## OCR – skenuoti PDF ir nuotraukos (tests/ocr.cjs)\n\nSkenas: A4 lapas 2480×1754 px (≈212 DPI), tik paveikslėlis, be teksto sluoksnio. Nuotrauka: 2000×1400 JPEG, pasukta 2°, su triukšmu.\n\n' + H + O.map(row).join('');
s += '\n## Ašys – geometrijos patikra (tests/axes.cjs)\n\nVektoriniai PDF: ašių tinklelis M 1:100 (1–2–3: 6000, 5000; A–B–C: 4000, 3000), brūkšninės ašys, žymės burbuluose abiejuose galuose, matmenų grandinės (vertikalūs matmenys – pasuktas tekstas). Variantai: teisingas, pamatų planas su matmeniu 5100 vietoj 5000, užrašytas M 1:50 (nubraižyta 1:100), žymės ne iš eilės. Skenas: tas pats lapas kaip paveikslėlis (PNG ir PDF be teksto).\n\n' + H + X.map(row).join('');
fs.writeFileSync(__dirname + '/../TESTAI.md', s); console.log('PASISEKĖ ' + c('PASISEKĖ') + ' · NEPAVYKO ' + c('NEPAVYKO') + ' · NETESTUOTA ' + c('NETESTUOTA'));
