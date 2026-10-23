// Rostverkų ir polių atpažinimo testai. Paleidimas: NODE_PATH=$(npm root -g) node tests/fnd.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/* Vektorinis pamatų planas M 1:100. Statinio koordinatės (m): ašys 1, 2, 3 – x = 0, 6, 11; A, B, C – y = 0, 4, 7.
   Rostverkai (bendras kontūras, kaip CAD): perimetras 600 mm ašyse 1, 3, A, C; 500 mm ašyje 2 (A–C) ir ašyje B (1–2).
   Rankinis atsakymas: 6 juostos, ilgis ašimis 11 + 11 + 7 + 7 + 7 + 6 = 49 m, plotas 11,6×7,6 − 5,45×3,45 − 5,45×2,45 − 4,45×6,4 = 27,525 m². */
function plan(o) {
    const k = 72 / 25.4 / 100 * 1000, X = x => 150 + x * k, Y = y => 120 + y * k; let cs = '';
    const ln = (x1, y1, x2, y2) => { cs += `${X(x1).toFixed(2)} ${Y(y1).toFixed(2)} m ${X(x2).toFixed(2)} ${Y(y2).toFixed(2)} l S\n`; };
    const rect = (x0, y0, x1, y1) => { ln(x0, y0, x1, y0); ln(x1, y0, x1, y1); ln(x1, y1, x0, y1); ln(x0, y1, x0, y0); };
    const circ = (cx, cy, r, pt) => { const c = 0.5523 * r, x = pt ? cx : X(cx), y = pt ? cy : Y(cy), R = pt ? r : r * k, C = pt ? c : c * k;
        cs += `${(x + R).toFixed(2)} ${y.toFixed(2)} m ${(x + R).toFixed(2)} ${(y + C).toFixed(2)} ${(x + C).toFixed(2)} ${(y + R).toFixed(2)} ${x.toFixed(2)} ${(y + R).toFixed(2)} c ${(x - C).toFixed(2)} ${(y + R).toFixed(2)} ${(x - R).toFixed(2)} ${(y + C).toFixed(2)} ${(x - R).toFixed(2)} ${y.toFixed(2)} c ${(x - R).toFixed(2)} ${(y - C).toFixed(2)} ${(x - C).toFixed(2)} ${(y - R).toFixed(2)} ${x.toFixed(2)} ${(y - R).toFixed(2)} c ${(x + C).toFixed(2)} ${(y - R).toFixed(2)} ${(x + R).toFixed(2)} ${(y - C).toFixed(2)} ${(x + R).toFixed(2)} ${y.toFixed(2)} c h S\n`; };
    const txt = (x, y, t, sz, rot) => { cs += `BT /F1 ${sz || 10} Tf ${rot ? '0 1 -1 0' : '1 0 0 1'} ${x.toFixed(2)} ${y.toFixed(2)} Tm (${t}) Tj ET\n`; };
    // rostverkų kontūras: išorė + trys „kambariai“
    rect(-0.3, -0.3, 11.3, 7.3); rect(0.3, 0.3, 5.75, 3.75); rect(0.3, 4.25, 5.75, 6.7); rect(6.25, 0.3, 10.7, 6.7);
    // ašys (brūkšninės) su burbulais (apskritimai – ne poliai!)
    const dash = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L; let u = 0, i = 0; const p = [0.12, 0.03, 0.01, 0.03];
        while (u < L) { const l = Math.min(p[i % 4], L - u); if (i % 2 === 0) ln(x1 + ux * u, y1 + uy * u, x1 + ux * (u + l), y1 + uy * (u + l)); u += p[i % 4]; i++; } };
    [[0, '1'], [6, '2'], [11, '3']].forEach(([x, l]) => { dash(x, -1.2, x, 8.2); [[-1.55], [8.55]].forEach(([y]) => { circ(X(x), Y(y), 10, true); txt(X(x) - 2.8, Y(y) - 3.5, l); }); });
    [[0, 'A'], [4, 'B'], [7, 'C']].forEach(([y, l]) => { dash(-1.2, y, 12.2, y); [[-1.55], [12.55]].forEach(([x]) => { circ(X(x), Y(y), 10, true); txt(X(x) - 3.3, Y(y) - 3.5, l); }); });
    // poliai: kvadratiniai 300×300 su įstrižainėmis, apskriti Ø400
    const sq = (x, y, a) => { cs += `${X(x - a / 2).toFixed(2)} ${Y(y - a / 2).toFixed(2)} ${(a * k).toFixed(2)} ${(a * k).toFixed(2)} re S\n`; ln(x - a / 2, y - a / 2, x + a / 2, y + a / 2); ln(x - a / 2, y + a / 2, x + a / 2, y - a / 2); };
    (o.sq || []).forEach(([x, y]) => sq(x, y, 0.3)); (o.ci || []).forEach(([x, y]) => circ(x, y, 0.2));
    // matmenys tarp ašių ir specifikacija
    [['6000', 3], ['5000', 8.5]].forEach(([t, x]) => txt(X(x) - 11, Y(-2.3), t)); [['4000', 2], ['3000', 5.5]].forEach(([t, y]) => txt(X(-2.3), Y(y) - 11, t, 10, 1));
    txt(40, 560, 'Projektas: Gyvenamasis namas, Senoliu g. 32', 11); txt(40, 540, 'PAMATU PLANAS M 1:100', 14); txt(600, 40, 'SRBS32-01-TDP-SK-01', 9); txt(600, 28, 'Laida: 0', 9);
    (o.spec || []).forEach((t, i) => txt(560, 300 - i * 14, t, 9));
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(cs, 'latin1')} >>\nstream\n${cs}endstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
    let out = '%PDF-1.4\n'; const off = []; objs.forEach((ob, i) => { off.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${ob}\nendobj\n`; });
    const x = Buffer.byteLength(out, 'latin1'); out += `xref\n0 6\n0000000000 65535 f \n` + off.map(v => String(v).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
}
const SQ = [[0, 0], [6, 0], [11, 0], [0, 4], [6, 4], [11, 4], [0, 7], [6, 7], [11, 7]], CI = [[3, 0], [8.5, 7]];
const SPEC = ['R-1 Rostverkas 600x500', 'R-2 Rostverkas 500x500', 'P-1 Polis 300x300 L=6000 9 vnt', 'P-2 Greztinis polis Ø400 L=8000 2 vnt'];
const FX = {
    'pamatai.pdf': plan({ sq: SQ, ci: CI, spec: SPEC }),
    'pamatai_klaidos.pdf': plan({ sq: SQ.concat([[3, 2]]), ci: CI, spec: ['R-1 Rostverkas 600x500', 'P-1 Polis 300x300 L=6000 9 vnt', 'P-2 Greztinis polis Ø400 L=8000 2 vnt'] })
};

(async () => {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    await p.goto('file://' + path.resolve(process.argv[2] || 'kontura.html')); await p.waitForTimeout(1200);
    const ev = (fn, a) => p.evaluate(fn, a);
    const add = name => ev(async ([n, d]) => { KS.setAsk(() => true); const f = new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' }); const r = (await KS.Docs.add([f]))[0], g = KS.IDX[r.id][0].fndGeo;
        return { kinds: KS.IDX[r.id][0].kinds, g: g && { bands: (g.bands || []).map(x => ({ w: x.w, L: Math.round(x.L * 1000) / 1000, clear: Math.round(x.clear * 1000) / 1000 })), piles: (g.piles || []).map(x => x.kind + ' ' + x.a + (x.inRv ? '' : ' (ne rostverke)')), jn: (g.junctions || []).length, Nsrc: g.Nsrc, need: g.needScale } }; }, [name, FX[name].toString('base64')]);
    // modelis: išorinės sienos ašyse 1/3, A/C (11 × 7 m, centrai)
    await ev(async () => { project = fixProject({ name: 'Pamatų testas', closed: true, walls: [0, 90, 180, 270].map((d, i) => ({ len: i % 2 ? 7 : 11, mode: 'C', t: 0.3, dir: d, h: 3 })) }); changed(); await KS.sync(); });

    const a = await add('pamatai.pdf');
    const ws = a.g.bands.map(x => x.w).sort().join(','), Lsum = a.g.bands.reduce((s, x) => s + x.L, 0);
    T('F1', 'Rostverkai atpažįstami: 6 juostos, plotis 600 ×4 ir 500 ×2', a.g.bands.length === 6 && ws === '0.5,0.5,0.6,0.6,0.6,0.6', JSON.stringify(a.g.bands) + ' · ' + a.g.Nsrc);
    T('F2', 'Rostverkų ilgis ašimis = 49 m (galai iki susikertančių ašių)', Math.abs(Lsum - 49) < 0.01, 'Σ L = ' + Lsum.toFixed(3) + ' m, sankirtų ' + a.g.jn);
    T('F3', 'Poliai: 9 kvadratiniai 0,3 ir 2 apskriti Ø0,4; ašių burbulai neįskaičiuoti', a.g.piles.filter(x => x === 'kvadratinis 0.3').length === 9 && a.g.piles.filter(x => x === 'apvalus 0.4').length === 2 && a.g.piles.length === 11, a.g.piles.join(', '));

    const r = await ev(async () => { const d = KS.ks().docs[0]; await KS.Docs.open(d.id, 1); const c = pdfCfg(), key = PDFU.name + '#' + PDFU.page, a0 = R.walls[0].a;
        c.pg[key] = { mpp: 0.0254 / 72 * 100, ax: 150, ay: 595 - 120, wx: a0[0], wy: a0[1], rot: 0, ok: true, al: true };
        await KS.Planner.run(['fnd']); const x = KS.ks().results.fnd, P = KS.ks().plan;
        return { st: x.state, q: x.qty.map(q => [q.name, Math.round(q.v * 1000) / 1000, q.unit]), ch: x.checks.map(c => [c.name, c.status, c.note]), needs: x.needs, iss: x.issues.map(i => i.text), n: x.objects.length, ver: x.objects.filter(o => o.status === 'VERIFIED').length, tr: P.transfer.fnd, done: P.steps.find(s => s.agent === 'fnd').done }; });
    const q = n => (r.q.find(x => x[0].startsWith(n)) || [])[1], ch = n => r.ch.find(c => c[0].startsWith(n)) || [];
    T('F4', 'Rostverkų plotas 27,525 m² ir dviguba patikra (rastras ↔ analitinis)', Math.abs(q('Rostverkų plotas') - 27.525) <= 0.28 && ch('Rostverkų plotas')[1] === 'OK', ch('Rostverkų plotas').join(' '));
    T('F5', 'Plotis patikrintas su specifikacija, aukštis iš jos → betono tūris', ch('Rostverkų plotis')[1] === 'OK' && Math.abs(q('Rostverkų betonas') - 27.525 * 0.5) <= 0.14, 'betonas ' + q('Rostverkų betonas') + ' m³ · ' + ch('Rostverkų plotis')[2]);
    T('F6', 'Polių skaičius ↔ specifikacija, polių ilgis 9×6 + 2×8 = 70 m', ch('Polių skaičius')[1] === 'OK' && q('Polių ilgis') === 70 && q('Poliai □300') === 9 && q('Poliai Ø400') === 2, ch('Polių skaičius')[2] + ' · ilgis ' + q('Polių ilgis'));
    T('F7', 'Kalibruotas brėžinys: sienos ant rostverkų, objektai patikrinti ir perduoti', ch('Išorinės sienos ant rostverkų')[1] === 'OK' && r.st === 'COMPLETED' && r.ver === r.n && r.tr.ok && r.done, ch('Išorinės sienos ant rostverkų').join(' ') + ' · ' + r.tr.coord + ' · ' + r.tr.draw);
    await ev(async () => { KS.ks().layer = 'fnd'; KS.ks().show = true; fitView(); draw(); }); await p.screenshot({ path: path.resolve('tests/ekranas_pamatai.png') });
    // siena ne ant rostverko
    const off = await ev(async () => { project.walls[1].len = 8; changed(); await KS.Planner.run(['fnd']); const x = KS.ks().results.fnd; project.walls[1].len = 7; changed(); return x.checks.find(c => /ant rostverkų/.test(c.name)); });
    T('F8', 'Modelio siena ne ant rostverko parodoma', off && off.status === 'ĮSPĖJIMAS', off && off.note);

    // klaidos: specifikacijoje 10 polių, vienas polis ne rostverke, R-2 specifikacijos nėra
    const e = await ev(async () => { project = fixProject({ name: 'Pamatų testas 2', closed: true, walls: [] }); changed(); await KS.sync(); return 0; });
    const a2 = await add('pamatai_klaidos.pdf');
    const r2 = await ev(async () => { await KS.Planner.run(['fnd']); const x = KS.ks().results.fnd; return { st: x.state, ch: x.checks.map(c => [c.name, c.status, c.note]), needs: x.needs, iss: x.issues.map(i => i.text), prop: x.objects.filter(o => o.status === 'PROPOSED').map(o => o.label) }; });
    const c2 = n => r2.ch.find(c => c[0].startsWith(n)) || [];
    T('F9', 'Polių skaičiaus prieštaravimas: brėžinyje 10 kv. polių, specifikacijoje 9', c2('Polių skaičius')[1] === 'ĮSPĖJIMAS' && r2.iss.some(t => /Prieštaravimas: P-1 brėžinyje 10/.test(t)), c2('Polių skaičius')[2]);
    T('F10', 'Polis ne rostverke (gal kolona) pažymimas', c2('Poliai rostverkų juostose')[1] === 'ĮSPĖJIMAS' && r2.prop.some(l => /P-1/.test(l)), c2('Poliai rostverkų juostose')[2]);
    T('F11', 'Specifikacijoje nesantis rostverko plotis → aukštis nežinomas, tūris neskaičiuojamas', c2('Rostverkų plotis')[1] === 'ĮSPĖJIMAS' && r2.needs.some(t => /aukštis nežinomas/.test(t)), r2.needs.find(t => /aukštis/.test(t)));
    T('F12', 'Nekalibruotas brėžinys: koordinatės brėžinio, sienų palyginimas neatliekamas', c2('Koordinatės statinio')[1] === 'NETIKRINTA', c2('Koordinatės statinio')[2]);
    T('F13', 'Rostverkai ir poliai skenuotuose brėžiniuose ir nuotraukose', null, 'Atpažįstama tik vektoriniuose PDF; skenuose (vaizde) rostverkų ir polių nėra ieškoma');
    T('E', 'Nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 3).join(' | '));
    await b.close();
    R.forEach(r => console.log(String(r.nr).padEnd(4) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(18) + String(r.note).slice(0, 500) : '')));
    const c = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + c('PASISEKĖ') + ' · NEPAVYKO: ' + c('NEPAVYKO') + ' · NETESTUOTA: ' + c('NETESTUOTA'));
    fs.writeFileSync('tests/rezultatai_pamatai.json', JSON.stringify(R, null, 1));
    process.exit(c('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
