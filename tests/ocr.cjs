// OCR testai: skenuotas PDF (tik paveikslėlis, be teksto sluoksnio) ir nuotrauka (pasukta, su triukšmu).
// Paleidimas: NODE_PATH=$(npm root -g) node tests/ocr.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

function imagePdf(gray, w, h) { // A4 gulsčias lapas, kurio visas turinys – pilkas paveikslėlis
    const img = zlib.deflateSync(gray), cs = 'q 842 0 0 595 0 0 cm /Im1 Do Q\n', objs = [];
    objs.push('<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>', null, `<< /Length ${cs.length} >>\nstream\n${cs}endstream`);
    const parts = [Buffer.from('%PDF-1.4\n')], off = []; let len = parts[0].length;
    objs.forEach((o, i) => { off.push(len); let b = i === 3 ? Buffer.concat([Buffer.from(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.length} >>\nstream\n`), img, Buffer.from('\nendstream\nendobj\n')])
        : Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`); parts.push(b); len += b.length; });
    parts.push(Buffer.from(`xref\n0 6\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${len}\n%%EOF\n`));
    return Buffer.concat(parts);
}

(async () => {
    const file = 'file://' + path.resolve(process.argv[2] || 'kontura.html');
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    await p.goto(file); await p.waitForTimeout(1200);
    const ev = (fn, a) => p.evaluate(fn, a);
    await ev(async () => { loadExample(); await KS.sync(); });

    // brėžinio „skenas“: piešiama naršyklėje, PDF sudaromas čia
    const scan = await ev(() => { const W = 2480, H = 1754, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineWidth = 4; x.strokeRect(600, 500, 1200, 800); x.lineWidth = 2;
        x.beginPath(); x.moveTo(600, 420); x.lineTo(1800, 420); x.moveTo(1880, 500); x.lineTo(1880, 1300); x.stroke();
        const T = (t, X, Y, sz, rot) => { x.save(); x.translate(X, Y); if (rot) x.rotate(rot); x.font = sz + 'px Arial'; x.fillText(t, 0, 0); x.restore(); };
        T('PAMATŲ PLANAS M 1:100', 120, 120, 56); T('Projektas: Gyvenamasis namas, Senolių g. 32', 120, 200, 36);
        T('12000', 1130, 405, 34); T('8000', 1925, 980, 34, -Math.PI / 2);
        T('Rostverkas R-1 600x400', 120, 1450, 36); T('Pamatų padas -1.200', 120, 1510, 36); T('Betonas C25/30', 120, 1570, 36);
        T('SRBS32-01-TDP-SK-02', 1900, 1640, 32); T('Laida: 0', 1900, 1690, 32);
        const d = x.getImageData(0, 0, W, H).data, g = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) g[i] = d[i * 4];
        let s = ''; for (let i = 0; i < g.length; i += 32768) s += String.fromCharCode.apply(null, g.subarray(i, i + 32768)); return { w: W, h: H, b64: btoa(s) }; });
    const scanPdf = imagePdf(Buffer.from(scan.b64, 'base64'), scan.w, scan.h);
    fs.mkdirSync('/tmp/ks_fx', { recursive: true }); fs.writeFileSync('/tmp/ks_fx/skenas.pdf', scanPdf);

    const t0 = Date.now();
    const r1 = await ev(async b64 => { KS.setAsk(() => true); const f = new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], 'skenas.pdf', { type: 'application/pdf' });
        const log = []; const all = await KS.Docs.add([f], t => log.push(t)); if (!all.length) return { fail: log, docs: KS.ks().docs.map(d => d.name + d.size) }; const d = all[0]; const P = KS.IDX[d.id][0];
        return { status: d.status, read: P.read, ocr: P.ocr, scale: P.scale, dims: P.dims, addr: P.address, no: P.drawingNos, rev: P.rev, sizes: P.sizes, elev: P.elev, mat: P.materials, kinds: P.kinds, lines: P.lines.slice(0, 20), log: log.filter(t => /OCR/.test(t)).slice(-3), err: KS.OCR.err }; }, scanPdf.toString('base64'));
    if (r1.fail) { console.log(r1); process.exit(3); }
    const sec1 = Math.round((Date.now() - t0) / 1000);
    T('O1', 'Skenuotas PDF: tekstas atpažįstamas OCR (be interneto)', r1.read === 'OCR' && r1.ocr.n > 10, r1.read + ', ' + (r1.ocr ? r1.ocr.n + ' žodžių, vid. patikimumas ' + r1.ocr.conf + ' %, neaiškių ' + r1.ocr.low : r1.err) + ', laikas ' + sec1 + ' s');
    T('O2', 'Skenas: mastelis, brėžinio Nr., laida', r1.scale === 100 && r1.no.includes('SRBS32-01-TDP-SK-02') && r1.rev === '0', 'M 1:' + r1.scale + ' · ' + r1.no.join(',') + ' · laida ' + r1.rev);
    T('O3', 'Skenas: horizontalus ir vertikalus matmuo', r1.dims.includes(12000) && r1.dims.includes(8000), 'matmenys: ' + r1.dims.join(', '));
    T('O4', 'Skenas: lietuviškos raidės, adresas, pamatų turinys', r1.addr.some(a => /Senolių g\. 32/.test(a)) && r1.kinds.includes('fnd'), 'adresas: ' + r1.addr.join(', ') + ' · turinys: ' + r1.kinds.join(', '));
    T('O5', 'Skenas: dydžiai, altitudė, medžiaga', r1.sizes.includes('600x400') && r1.elev.includes(-1.2) && r1.mat.includes('c25/30'), 'dydžiai ' + r1.sizes.join(',') + ' · altitudės ' + r1.elev.join(',') + ' · ' + r1.mat.join(','));

    // pamatų agentas naudoja OCR rastą skerspjūvį tik kaip pasiūlymą, pažymėtą OCR
    const fa = await ev(async () => { await KS.Planner.run(['fnd']); const r = KS.ks().results.fnd; return { st: r.state, c: r.candidates, need: r.needs[0] }; });
    T('O6', 'Pamatų agentas: OCR skerspjūvis – tik pasiūlymas su žyma „OCR“', fa.st === 'NEEDS_DATA' && fa.c.some(c => c.ocr && Math.round(c.b * 1000) === 600), fa.need);

    // pagrindinis langas: skenuoto PDF puslapyje OCR žodžiai naudojami mastelio radimui
    const vw = await ev(async () => { const d = KS.ks().docs.find(x => x.name === 'skenas.pdf'); await KS.Docs.open(d.id, 1); return { n: (PDFU.texts || []).length, ocr: (PDFU.texts || []).some(t => t.ocr), scale: PDFU.scaleN }; });
    T('O7', 'Pagrindinis langas: skeno mastelis ir tekstai iš OCR', vw.ocr && vw.scale === 100, JSON.stringify(vw));

    // nuotrauka: pasukta 2°, triukšmas, JPEG
    const ph = await ev(async () => { const W = 2000, H = 1400, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
        x.fillStyle = '#e8e4da'; x.fillRect(0, 0, W, H); x.translate(W / 2, H / 2); x.rotate(2 * Math.PI / 180); x.translate(-W / 2, -H / 2); x.fillStyle = '#222';
        const T = (t, X, Y, sz) => { x.font = sz + 'px Arial'; x.fillText(t, X, Y); };
        T('LANGŲ ŽINIARAŠTIS', 120, 160, 52); T('L-1 Langas 1500x1500', 120, 300, 40); T('D-1 Durys 900x2100', 120, 380, 40); T('Senolių g. 32', 120, 460, 40); T('M 1:50', 120, 540, 40);
        x.setTransform(1, 0, 0, 1, 0, 0); const im = x.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 50; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8)); const f = new File([blob], 'nuotrauka.jpg', { type: 'image/jpeg' });
        const t0 = Date.now(); const dd = (await KS.Docs.add([f]))[0]; const P = KS.IDX[dd.id][0];
        return { s: Math.round((Date.now() - t0) / 1000), member: dd.member, read: P.read, ocr: P.ocr, marks: P.marks, sizes: P.sizes, scale: P.scale, addr: P.address, lines: P.lines.slice(0, 8) }; });
    T('O8', 'Nuotrauka (pasukta 2°, triukšmas): žymės ir dydžiai', ph.read === 'OCR' && ph.marks.includes('L-1') && ph.marks.includes('D-1') && ph.sizes.includes('1500x1500') && ph.sizes.includes('900x2100'), 'žymės ' + ph.marks.join(',') + ' · dydžiai ' + ph.sizes.join(',') + ' · M 1:' + ph.scale + ' · ' + (ph.ocr ? ph.ocr.conf + ' %' : '') + ' · ' + ph.s + ' s');
    T('O9', 'Nuotrauka priskiriama projektui pagal OCR adresą', ph.member === 'AUTO', ph.member + ' · ' + ph.addr.join(','));
    const op = await ev(async () => { const o = project.openings.find(x => x.kind === 'L'); o.mark = 'L-1'; o.w = 1.2; o.h = 1.5; changed(true); await KS.Planner.run(['open']); return KS.ks().results.open.issues.filter(i => /Prieštaravimas/.test(i.text)).map(i => i.text); });
    T('O10', 'Žiniaraštis iš nuotraukos: prieštaravimas pažymimas kaip OCR', op.some(t => /OCR/.test(t) && /1,5×1,5|1,50×1,50/.test(t)), op[0]);
    T('O11', 'Pasvirusi nuotrauka (perspektyva) ir ranka rašytas tekstas', null, 'Perspektyvos ištiesinimas neįdiegtas; ranka rašyto teksto Tesseract patikimai neatpažįsta');
    T('E', 'Nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 3).join(' | '));
    await b.close();
    R.forEach(r => console.log(String(r.nr).padEnd(4) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(18) + String(r.note).slice(0, 400) : '')));
    const c = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + c('PASISEKĖ') + ' · NEPAVYKO: ' + c('NEPAVYKO') + ' · NETESTUOTA: ' + c('NETESTUOTA'));
    console.log('Skeno eilutės:', JSON.stringify(r1.lines)); console.log('Nuotraukos eilutės:', JSON.stringify(ph.lines));
    fs.writeFileSync('tests/rezultatai_ocr.json', JSON.stringify(R, null, 1));
    process.exit(c('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
