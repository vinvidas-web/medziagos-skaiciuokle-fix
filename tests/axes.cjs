// Ašių geometrijos testai. Paleidimas: NODE_PATH=$(npm root -g) node tests/axes.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
function imagePdf(gray, w, h) { // A4 gulsčias lapas – tik pilkas paveikslėlis (skenas)
    const img = zlib.deflateSync(gray), cs = 'q 842 0 0 595 0 0 cm /Im1 Do Q\n', objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>', null, `<< /Length ${cs.length} >>\nstream\n${cs}endstream`];
    const parts = [Buffer.from('%PDF-1.4\n')], off = []; let len = parts[0].length;
    objs.forEach((o, i) => { off.push(len); const b = i === 3 ? Buffer.concat([Buffer.from(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.length} >>\nstream\n`), img, Buffer.from('\nendstream\nendobj\n')]) : Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`); parts.push(b); len += b.length; });
    parts.push(Buffer.from(`xref\n0 6\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${len}\n%%EOF\n`));
    return Buffer.concat(parts);
}

/* PDF su linijomis ir tekstu (taip pat pasuktu 90°), PDF naudotojo koordinatės (y aukštyn) */
function pdf(pg) {
    let cs = '';
    pg.segs.forEach(([x1, y1, x2, y2]) => { cs += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`; });
    pg.text.forEach(([x, y, t, sz, rot]) => { cs += `BT /F1 ${sz || 10} Tf ${rot ? '0 1 -1 0' : '1 0 0 1'} ${x.toFixed(2)} ${y.toFixed(2)} Tm (${t}) Tj ET\n`; });
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(cs)} >>\nstream\n${cs}endstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = Buffer.byteLength(out); out += `xref\n0 6\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
}
const W = { A: 0.667, B: 0.667, C: 0.722, D: 0.722, '1': 0.556, '2': 0.556, '3': 0.556 };
/* ašių tinklelis M 1:scale: vertikalios 1,2,3 (tarpai vx mm), horizontalios A,B,C (tarpai hy mm) */
function grid(o) {
    const k = 72 / 25.4 / (o.drawScale || 100), segs = [], text = [];
    const X = [150]; o.vx.forEach(v => X.push(X[X.length - 1] + v * k)); const Y = [120]; o.hy.forEach(v => Y.push(Y[Y.length - 1] + v * k));
    const dash = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L; let u = 0, pat = [12, 3, 1, 3], i = 0;
        while (u < L) { const l = Math.min(pat[i % 4], L - u); if (i % 2 === 0) segs.push([x1 + ux * u, y1 + uy * u, x1 + ux * (u + l), y1 + uy * (u + l)]); u += pat[i % 4]; i++; } };
    const circ = (cx, cy, r) => { for (let i = 0; i < 20; i++) { const a = i / 20 * 2 * Math.PI, b = (i + 1) / 20 * 2 * Math.PI; segs.push([cx + r * Math.cos(a), cy + r * Math.sin(a), cx + r * Math.cos(b), cy + r * Math.sin(b)]); } };
    const lab = (t, cx, cy) => { circ(cx, cy, 10); text.push([cx - (W[t] || 0.6) * 5, cy - 3.5, t, 10]); };
    const xl = o.xLab || ['1', '2', '3'], yl = o.yLab || ['A', 'B', 'C'];
    X.forEach((x, i) => { dash(x, Y[0] - 30, x, Y[Y.length - 1] + 30); lab(xl[i], x, Y[Y.length - 1] + 40); lab(xl[i], x, Y[0] - 40); });
    Y.forEach((y, i) => { dash(X[0] - 30, y, X[X.length - 1] + 30, y); lab(yl[i], X[0] - 40, y); lab(yl[i], X[X.length - 1] + 40, y); });
    const dx = o.dimX || o.vx, dy = o.dimY || o.hy;
    dx.forEach((v, i) => text.push([(X[i] + X[i + 1]) / 2 - 11.1, 50, String(v), 10]));
    text.push([(X[0] + X[X.length - 1]) / 2 - 13.9, 35, String(o.totX || dx.reduce((a, b) => a + b, 0)), 10]);
    dy.forEach((v, i) => text.push([75, (Y[i] + Y[i + 1]) / 2 - 11.1, String(v), 10, 1]));
    text.push([60, (Y[0] + Y[Y.length - 1]) / 2 - 13.9, String(o.totY || dy.reduce((a, b) => a + b, 0)), 10, 1]);
    text.push([40, 560, 'Projektas: Gyvenamasis namas, Senoliu g. 32', 11], [40, 540, o.title + ' M 1:' + (o.declared || 100), 14], [600, 40, o.no, 9], [600, 28, 'Laida: 0', 9]);
    return pdf({ segs, text });
}
const FX = {
    'ax_arch.pdf': grid({ vx: [6000, 5000], hy: [4000, 3000], title: '1 AUKSTO PLANAS', no: 'SRBS32-01-TDP-SA-01' }),
    'ax_pamatai.pdf': grid({ vx: [6000, 5000], hy: [4000, 3000], dimX: [6000, 5100], totX: 11000, title: 'PAMATU PLANAS', no: 'SRBS32-01-TDP-SK-01' }),
    'ax_mastelis.pdf': grid({ vx: [6000, 5000], hy: [4000, 3000], declared: 50, title: '2 AUKSTO PLANAS', no: 'SRBS32-01-TDP-SA-02' }),
    'ax_eiga.pdf': grid({ vx: [6000, 5000], hy: [4000, 3000], yLab: ['A', 'C', 'B'], title: 'PJUVIS SCHEMA PLANAS', no: 'SRBS32-01-TDP-SA-03' })
};

(async () => {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    await p.goto('file://' + path.resolve(process.argv[2] || 'kontura.html')); await p.waitForTimeout(1200);
    const ev = (fn, a) => p.evaluate(fn, a);
    const add = names => ev(async F => { KS.setAsk(() => true); const fs = F.map(([n, d]) => new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' }));
        const r = await KS.Docs.add(fs); return r.map(d => { const g = KS.IDX[d.id][0].axGeo; return { name: d.name, member: d.member, g: g && { fams: g.fams.map(f => f.labels.join(',')), spans: g.spans.map(s => ({ k: s.from + '-' + s.to, mm: s.mm, st: s.st, c: s.cands, total: !!s.total })), checks: g.checks.map(c => [c.name, c.status, c.note]), scale: g.scale, dashed: KS.IDX[d.id][0].axGeo.axes.every(a => a.dashed), both: KS.IDX[d.id][0].axGeo.axes.every(a => a.both) } }; }); },
        names.map(n => [n, FX[n].toString('base64')]));
    const st = (g, re) => (g.checks.find(c => re.test(c[0])) || [])[1];

    await ev(async () => { loadExample(); await KS.sync(); });
    const [a] = await add(['ax_arch.pdf']);
    T('A1', 'Ašys randamos: linija + žymė burbule abiejuose galuose', a.g && a.g.fams.length === 2 && a.g.fams.includes('A,B,C') && a.g.fams.includes('1,2,3') && a.g.both && a.g.dashed, a.g && a.g.fams.join(' | ') + ' · brūkšninės: ' + a.g.dashed);
    T('A2', 'Lygiagretumas ir statmenumas', st(a.g, /A, B, C: lygiagretumas/) === 'OK' && st(a.g, /1, 2, 3: lygiagretumas/) === 'OK' && st(a.g, /statmenos/) === 'OK', a.g.checks.filter(c => /lygiagret|statmen/.test(c[0])).map(c => c[0] + ' ' + c[1] + ' ' + c[2]).join('; '));
    T('A3', 'Tarpai tarp ašių sutampa su matmenimis (horizontalūs ir vertikalūs tekstai)', ['1-2:6000', '2-3:5000', 'A-B:4000', 'B-C:3000'].every(k => a.g.spans.some(s => s.k + ':' + s.mm === k && s.st === 'OK')), a.g.spans.filter(s => !s.total).map(s => s.k + ' ' + s.mm + ' ' + s.st).join(', '));
    T('A4', 'Matmenų grandinė: tarpų suma = bendras matmuo', st(a.g, /grandinė 1–3/) === 'OK' && st(a.g, /grandinė A–C/) === 'OK', a.g.checks.filter(c => /grandin/.test(c[0])).map(c => c[0] + ': ' + c[2]).join('; '));
    T('A5', 'Mastelis patikrintas pagal ašių matmenis', st(a.g, /Mastelis/) === 'OK', a.g.checks.find(c => /Mastelis/.test(c[0])).join(' '));
    T('A6', 'Žymių eiga nuosekli', st(a.g, /A, B, C: žymių eiga/) === 'OK' && st(a.g, /1, 2, 3: žymių eiga/) === 'OK', '');

    const [m] = await add(['ax_mastelis.pdf']);
    T('A7', 'Neteisingai užrašytas mastelis aptinkamas', st(m.g, /Mastelis/) === 'KLAIDA' && Math.abs(m.g.scale.est - 100) < 1, m.g.checks.find(c => /Mastelis/.test(c[0])).join(' '));
    const [e] = await add(['ax_eiga.pdf']);
    T('A8', 'Žymės ne iš eilės (A, C, B) aptinkamos', st(e.g, /žymių eiga/) === 'ĮSPĖJIMAS', e.g.checks.filter(c => /eiga/.test(c[0])).map(c => c[0] + ': ' + c[2]).join('; '));
    const [f] = await add(['ax_pamatai.pdf']);
    const s23 = f.g.spans.find(s => s.k === '2-3');
    T('A9', 'Matmuo nesutampa su nubraižytu tarpu (5100 / 5000)', s23 && s23.st === 'ĮSPĖJIMAS' && s23.c.includes(5100), JSON.stringify(s23));

    // agentai: skirtingų dokumentų ašių palyginimas, pamatų ašys
    const ag = await ev(async () => { await KS.Planner.run(['walls', 'fnd']); const K = KS.ks().results; return { w: K.walls.checks.filter(c => /Ašy|ašy|ašim/.test(c.name)).map(c => [c.name, c.status, c.note]), wi: K.walls.issues.filter(i => /ašys/.test(i.text)).map(i => i.text), f: K.fnd.checks.filter(c => /Aš|aš/.test(c.name)).map(c => [c.name, c.status]), fi: K.fnd.issues.filter(i => /ašys/.test(i.text)).map(i => i.text), fa: K.fnd.axes.length }; });
    T('A10', 'Prieštaravimas tarp dokumentų: ašys 2–3 (architektūra 5000, pamatai 5100)', ag.wi.some(t => /2–3/.test(t) && /5100/.test(t) && /5000/.test(t)) && ag.fi.some(t => /2–3/.test(t)), ag.wi.find(t => /2–3/.test(t)));
    T('A11', 'Pamatų agentas tikrina pamatų brėžinio ašis', ag.fa === 1 && ag.f.some(c => /ax_pamatai/.test(c[0])), ag.f.map(c => c.join(' ')).join('; '));

    // susiejimas su modeliu: kalibruotas brėžinys, sienos ašyse 1/3 ir A/C (11 × 7 m)
    const bind = await ev(async () => {
        snapshot(); const pid = project.ks.pid, ks0 = project.ks;
        project = fixProject({ name: 'Ašių testas', closed: true, walls: [0, 90, 180, 270].map((d, i) => ({ len: i % 2 ? 7 : 11, mode: 'C', t: 0.3, dir: d, h: 3 })) }); project.ks = ks0; changed(); await KS.sync();
        const d = KS.ks().docs.find(x => x.name === 'ax_arch.pdf'); await KS.Docs.open(d.id, 1);
        const c = pdfCfg(), key = PDFU.name + '#' + PDFU.page, a0 = R.walls[0].a; c.pg[key] = { mpp: 0.0254 / 72 * 100, ax: 150, ay: 595 - 120, wx: a0[0], wy: a0[1], rot: 0, ok: true, al: true };
        await KS.Planner.run(['walls']); const r = KS.ks().results.walls; KS.ks().layer = 'axes'; fitView(); draw();
        const out = { b: r.checks.filter(c => /susiejimas|kalibracija/.test(c.name)).map(c => [c.name, c.status, c.note]), bind: r.bind, drawn: KS.drawAxes(document.createElement('canvas').getContext('2d'), view) };
        project.walls[1].len = 7.1; changed(); await KS.Planner.run(['walls']); out.b2 = KS.ks().results.walls.bind; return out; });
    T('A12', 'Sienos susiejamos su ašimis (centras ašyje – 0 mm)', bind.bind.length === 4 && bind.bind.every(x => x.axis && Math.abs(x.off) < 0.001), bind.b.map(c => c.join(' ')).join(' | '));
    T('A13', 'Kalibracija tikrinama pagal ašių matmenis', bind.b.some(c => /kalibracija/.test(c[0]) && c[1] === 'OK'), (bind.b.find(c => /kalibracija/.test(c[0])) || []).join(' '));
    const moved = bind.b2.find(x => x.wall === 'S3');
    T('A14', 'Pasislinkusi siena parodoma (S3 už ašies C 100 mm)', moved && moved.axis === 'C' && Math.abs(Math.abs(moved.off) - 0.1) < 0.002, JSON.stringify(moved));
    T('A15', 'Ašys nupiešiamos pagrindiniame lange', bind.drawn === 6, 'nupiešta ašių: ' + bind.drawn);
    await p.screenshot({ path: path.resolve('tests/ekranas_asys.png') });

    // skenas: tos pačios ašys kaip paveikslėlis (rastras + OCR)
    const scan = await ev(async () => { const d = KS.ks().docs.find(x => x.name === 'ax_arch.pdf'), doc = await pdfjsLib.getDocument({ data: new Uint8Array(await (await KS.Docs.open(d.id, 1), PDFU.file).arrayBuffer()) }).promise, pg = await doc.getPage(1);
        const vp = pg.getViewport({ scale: 2480 / 842 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); await pg.render({ canvasContext: x, viewport: vp }).promise;
        const dd0 = x.getImageData(0, 0, cv.width, cv.height).data, gr = new Uint8Array(cv.width * cv.height); for (let i = 0; i < gr.length; i++) gr[i] = dd0[i * 4]; let gs = ''; for (let i = 0; i < gr.length; i += 32768) gs += String.fromCharCode.apply(null, gr.subarray(i, i + 32768)); window.__gray = { w: cv.width, h: cv.height, b64: btoa(gs) };
        const blob = await new Promise(r => cv.toBlob(r, 'image/png')); const f = new File([blob], 'ax_skenas.png', { type: 'image/png' }); const dd = (await KS.Docs.add([f]))[0], P = KS.IDX[dd.id][0], g = P.axGeo;
        return { read: P.read, g: g && { bub: g.bubbles, fams: g.fams.map(f => f.labels.join(',')), spans: g.spans.filter(s => !s.total).map(s => s.from + '-' + s.to + ' ' + s.mm + ' ' + s.st), scale: g.scale, raster: g.raster, sc: g.checks.filter(c => c.status !== 'OK' || /nuosekl/.test(c.name)).map(c => [c.name, c.status]) }, labels: P.axes }; });
    T('A16', 'Skenas (paveikslėlis): ašys iš vaizdo linijų, žymės atpažįstamos burbuluose', scan.g && scan.g.raster && scan.g.fams.includes('A,B,C') && scan.g.fams.includes('1,2,3') && ['A-B 4000 OK', 'B-C 3000 OK', '1-2 6000 OK', '2-3 5000 OK'].every(k => scan.g.spans.includes(k)) && scan.g.sc.some(c => /nuoseklūs/.test(c[0]) && c[1] === 'OK') && !scan.g.sc.some(c => c[1] === 'KLAIDA'), JSON.stringify(scan.g));
    const gray = await ev(() => window.__gray), spdf = imagePdf(Buffer.from(gray.b64, 'base64'), gray.w, gray.h);
    const sp = await ev(async b64 => { const f = new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'ax_skenas.pdf', { type: 'application/pdf' }); const d = (await KS.Docs.add([f]))[0], P = KS.IDX[d.id][0], g = P.axGeo;
        return { read: P.read, g: g && { raster: g.raster, fams: g.fams.map(f => f.labels.join(',')), spans: g.spans.filter(s => !s.total).map(s => s.from + '-' + s.to + ' ' + s.mm + ' ' + s.st), sc: g.checks.filter(c => /Mastelis|grandin/.test(c.name)).map(c => [c.name, c.status, c.note]) } }; }, spdf.toString('base64'));
    T('A16b', 'Skenuotas PDF: ašys, tarpai ir mastelis M 1:100 pagal matmenis', sp.g && sp.g.raster && sp.g.fams.length === 2 && sp.g.spans.every(x => / OK$/.test(x)) && sp.g.sc.some(c => /Mastelis/.test(c[0]) && c[1] === 'OK'), JSON.stringify(sp.g));
    T('A17', 'Pasvirusios / kreivos ašys skenuose ir nuotraukose', null, 'Iš vaizdo randamos tik horizontalios ir vertikalios linijos; pasuktų (> ~0,5°) ar fotografuotų kampu brėžinių ašys neatpažįstamos');
    T('E', 'Nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 3).join(' | '));
    await b.close();
    R.forEach(r => console.log(String(r.nr).padEnd(4) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(18) + String(r.note).slice(0, 500) : '')));
    const c = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + c('PASISEKĖ') + ' · NEPAVYKO: ' + c('NEPAVYKO') + ' · NETESTUOTA: ' + c('NETESTUOTA'));
    fs.writeFileSync('tests/rezultatai_asys.json', JSON.stringify(R, null, 1));
    process.exit(c('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
