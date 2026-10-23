// Agentai braižo programos įrankiais: „Pamatai“, braižytojo (senojo agento) mokymas ir įsakymas, angos, sąramos, žiedas, perdangos; vienas mygtukas.
// Paleidimas: NODE_PATH=$(npm root -g) node tests/draw.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { plan, SQ, CI, SPEC } = require('./fx_pamatai.cjs');

/* paprastas tekstinis PDF: žiniaraštis, žiedas, perdanga (tas pats projektas) */
function textPdf(lines) {
    let cs = ''; lines.forEach((t, i) => { cs += `BT /F1 11 Tf 1 0 0 1 40 ${560 - i * 18} Tm (${t}) Tj ET\n`; });
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(cs, 'latin1')} >>\nstream\n${cs}endstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
    let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = Buffer.byteLength(out, 'latin1'); out += `xref\n0 6\n0000000000 65535 f \n` + off.map(v => String(v).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
}
const FX = {
    'pamatai.pdf': plan({ sq: SQ, ci: CI, spec: SPEC }),
    'architektura.pdf': textPdf(['Projektas: Gyvenamasis namas, Senoliu g. 32', 'LANGU IR DURU ZINIARASTIS', 'L-1 Langas 1500x1500', 'D-1 Durys 900x2100', 'Monolitinis ziedas 190 mm', 'Perdanga: g/b plokstes 220', 'SRBS32-01-TDP-SA-05'])
};

(async () => {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    await p.goto('file://' + path.resolve(process.argv[2] || 'kontura.html')); await p.waitForTimeout(1200);
    const ev = (fn, a) => p.evaluate(fn, a);
    const add = names => ev(async F => { KS.setAsk(() => true); for (const [n, d] of F) await KS.Docs.add([new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' })]); return KS.ks().docs.map(d => d.name + ':' + d.member); }, names.map(n => [n, FX[n].toString('base64')]));

    // vienas mygtukas
    const one = await ev(() => { const chip = document.getElementById('chipAg'); openPanel('settings'); const t = document.getElementById('panel') ? document.getElementById('panel').innerText : document.body.innerText; closePanel();
        return { chip: chip && chip.textContent, vis: chip && chip.style.display, oldCell: /\bAgentas\b(?! \()/.test(t.replace(/Agentai/g, '')), cells: (t.match(/Agentai \(visi\)/g) || []).length }; });
    T('D1', 'Vienas mygtukas „🧠 Agentai“ (be PDF taip pat), ⚙️ – viena vieta, senojo „🤖 Agentas“ mygtuko nebėra', /^🧠 Agentai/.test(one.chip) && one.vis === 'block' && one.cells === 1 && !one.oldCell, JSON.stringify(one));
    await ev(() => document.getElementById('chipAg').click()); await p.waitForTimeout(400);
    const hub = await ev(() => ({ root: !!document.getElementById('ksRoot'), tabs: [...document.querySelectorAll('#ksRoot [data-tab]')].map(e => e.textContent) }));
    T('D2', 'Mygtukas atidaro viską: Planner, Agentai, Braižytojas, Dokumentai, Kiekiai, Board, Pataisymai', hub.root && hub.tabs.length === 7 && hub.tabs.some(t => /Braižytojas/.test(t)), hub.tabs.join(' · '));
    await ev(() => closeSubpanel());

    // 1 aukštas: sienų centrai ašyse 1/3, A/C (11 × 7 m)
    await ev(async () => { project = fixProject({ name: 'Braižymo testas', closed: true, walls: [0, 90, 180, 270].map((d, i) => ({ len: i % 2 ? 7 : 11, mode: 'C', t: 0.3, dir: d, h: 3 })) }); changed(); await KS.sync(); });
    await add(['pamatai.pdf', 'architektura.pdf']);
    await ev(async () => { const d = KS.ks().docs.find(x => x.name === 'pamatai.pdf'), a0 = R.walls[0].a; pdfCfg().pg['pamatai.pdf#1'] = { mpp: 0.0254 / 72 * 100, ax: 150, ay: 595 - 120, wx: a0[0], wy: a0[1], rot: 0, ok: true, al: true }; });
    const d = await ev(async () => { const out = await KS.Planner.drawAll(['fnd']); const f = project.fl;
        const P0 = withFloor(0, () => R.P.slice(0, R.n).map(q => q.slice())), P1 = withFloor(1, () => R.P.slice(0, R.n).map(q => q.slice()));
        const dmax = Math.max(...P0.map(q => Math.min(...P1.map(r => Math.hypot(q[0] - r[0], q[1] - r[1])))));
        const pam = floorData(0); return { out: out.map(x => x.err || x.text), names: [floorName(0), floorName(1)], fl: f, walls: pam.walls.map(w => [w.len, w.t, w.h, w.btype, w.mode]), inner: withFloor(0, () => RI.walls.map(r => [Math.round(r.len * 1000) / 1000, r.t])),
            gap: withFloor(0, () => R.gap.d), dmax, bases: floorBases(), fx: KS.ks().results.fnd && { st: KS.ks().results.fnd.state, q: KS.ks().results.fnd.qty.map(q => [q.name, Math.round(q.v * 1000) / 1000]), ch: KS.ks().results.fnd.checks.map(c => [c.name, c.status, c.note]), n: KS.ks().results.fnd.objects.length }, done: KS.ks().plan.steps.find(s => s.agent === 'fnd').done, tr: KS.ks().plan.transfer.fnd }; });
    const lens = d.walls.map(w => w[0]).join(','), ts = d.walls.map(w => w[1]).join(',');
    T('D3', 'Pamatų agentas sukuria aukštą „Pamatai“, buvęs aukštas lieka „1 aukštas“', d.names[0] === 'Pamatai' && d.names[1] === '1 aukštas', d.names.join(' / ') + ' · ' + d.out.join(' | '));
    T('D4', '„Pamatai“ nubraižyti programos sienų įrankiais: 4 išorės rostverkai 11/7 m, plotis 0,6, aukštis 0,5 (iš specifikacijos), be žiedo', lens.split(',').sort().join(',') === '11,11,7,7' && ts === '0.6,0.6,0.6,0.6' && d.walls.every(w => w[2] === 0.5 && w[3] === 'noring' && w[4] === 'C') && d.gap < 0.001, JSON.stringify(d.walls) + ' · tarpas ' + d.gap);
    T('D5', 'Vidiniai rostverkai – vidinėmis sienomis: 6,4 m ir 5,45 m, plotis 0,5', d.inner.length === 2 && d.inner.some(r => r[0] === 6.4 && r[1] === 0.5) && d.inner.some(r => r[0] === 5.45 && r[1] === 0.5), JSON.stringify(d.inner));
    T('D6', '„Pamatai“ sulygiuoti su 1 aukštu (ašių kampai sutampa)', d.dmax < 0.001, 'didžiausias nuokrypis ' + (d.dmax * 1000).toFixed(2) + ' mm');
    T('D7', 'Aukščiai: 1 aukšto ±0,00 = pamato viršus, „Pamatai“ – žemiau', Math.abs(d.bases[1]) < 1e-9 && Math.abs(d.bases[0] + 0.5) < 1e-9, JSON.stringify(d.bases));
    const q = n => (d.fx.q.find(x => x[0].startsWith(n)) || [])[1], c = n => d.fx.ch.find(x => x[0].startsWith(n)) || [];
    T('D8', 'Pamatų agentas skaičiuoja nubraižytus „Pamatai“: plotas 27,525 m², betonas ≈ 13,76 m³ (programos skaičiavimas)', Math.abs(q('Rostverkų plotas') - 27.525) < 0.1 && Math.abs(q('Rostverkų betonas') - 13.7625) < 0.15, JSON.stringify(d.fx.q));
    T('D9', '„Pamatai“ ↔ pamatų brėžinys: plotas ir vieta sutampa; 1 aukšto sienos ant rostverkų; patikrinta ir perduota', c('„Pamatai“ ↔ pamatų')[1] === 'OK' && c('„Pamatai“ sutampa')[1] === 'OK' && c('„Pamatai“ po 1 aukšto')[1] === 'OK' && d.done, d.fx.ch.filter(x => /Pamatai/.test(x[0])).map(x => x.join(' ')).join(' | ') + ' · ' + JSON.stringify(d.tr));
    await ev(() => { setFloor(0); KS.ks().layer = 'fnd'; fitView(); draw(); }); await p.screenshot({ path: path.resolve('tests/ekranas_pamatai_aukstas.png') });

    // kiti agentai nemato „Pamatai“ kaip sienų
    const w = await ev(async () => { await KS.Planner.run(['walls']); return KS.ks().results.walls.objects.map(o => o.floor); });
    T('D10', 'Sienų agentas „Pamatai“ aukšto sienomis nelaiko', w.length && w.every(f => f === 1), 'objektų aukštai: ' + [...new Set(w)].join(','));

    // Planner moko braižytoją ir įsako braižyti jūsų pasirinktame brėžinyje
    const cmd = await ev(async () => { const a = KS.ks().docs.find(x => x.name === 'architektura.pdf'); await KS.Docs.open(a.id, 1); setFloor(1, true); computeAll();
        const orig = window.agentRun; window.agentRun = async () => { window.__cmd = { fl: project.fl, pdf: PDFU && PDFU.name, page: PDFU && PDFU.page }; }; const r = await KS.Planner.commandDrawer(1, true); window.agentRun = orig;
        const K = agentKnow(), les = agentStore().lessons.filter(x => x.planner); return { called: window.__cmd, r, L1: K.marks.L1, D1: K.marks.D1, ringH: K.ringH, les: les.length, text: les[0] && les[0].text.join(' | '), task: KS.Board.log.some(m => m.type === 'TASK' && m.to === 'braižytojas' && /Braižyk/.test(m.content.text)) }; });
    T('D11', 'Planner moko braižytoją iš visų dokumentų (L-1 1,5, D-1 2,1, žiedas 0,19)', cmd.L1 && cmd.L1.h === 1.5 && cmd.D1 && cmd.D1.h === 2.1 && cmd.ringH === 0.19 && cmd.les === 1 && /žiedo aukštis 0,19 \(architektura\.pdf/.test(cmd.text), cmd.text);
    T('D12', 'Planner įsako braižytojui braižyti 1 aukštą jūsų atidarytame brėžinyje', cmd.called && cmd.called.fl === 1 && cmd.called.pdf === 'architektura.pdf' && cmd.task, JSON.stringify(cmd.called));
    const noPdf = await ev(async () => { const keep = PDFU; PDFU = null; const r = await KS.Planner.commandDrawer(1, true); PDFU = keep; return r; });
    T('D13', 'Be jūsų pasirinkto brėžinio braižytojas nekviečiamas (piešimo lapą nurodote jūs)', !noPdf.ok && /nepasirinktas/.test(noPdf.why), noPdf.why);

    // angos, sąramos, žiedas, perdangos – įrankiais, esamų reikšmių nekeičia
    const ag = await ev(async () => { setFloor(1, true); project.openings = [{ wk: 'o', wi: 0, kind: 'L', mark: 'L-1', w: '', h: '', q: '', pos: 1, sill: 0.9, lt: '', ll: '', lr: '', lh: '' }, { wk: 'o', wi: 2, kind: 'D', mark: 'D-1', w: 0.9, h: 2.2, q: '', pos: 2, sill: 0, lt: 'M', ll: 0.2, lr: 0.2, lh: 0.19 }].map(fixOpening);
        project.settings.ringH = ''; changed(true);
        const o = await KS.AG.open.draw(), l = await KS.AG.lint.draw(), r = await KS.AG.ring.draw();
        addFloor(); await new Promise(r => setTimeout(r, 500)); closeSubpanel(); project.floors[2].sl = { type: 'none' }; const s = await KS.AG.slab.draw();
        setFloor(1, true); computeAll(); const op = project.openings.map(x => [x.mark, x.w, x.h, x.lt]); return { o, l, r, s, op, ringH: project.settings.ringH, sl: slabCfg(2) }; });
    T('D14', 'Angų agentas įrašo trūkstamus matmenis pagal žymę (L-1 1,5×1,5), D-1 2,2 nekeičia', ag.op[0][1] === 1.5 && ag.op[0][2] === 1.5 && ag.op[1][2] === 2.2, JSON.stringify(ag.op) + ' · ' + ag.o.text);
    T('D15', 'Sąramų agentas – sąrama angai be jos (iš braižytojo žinių), esamos nekeičia', ag.op[0][3] === 'L' && ag.op[1][3] === 'M', ag.l.text || ag.l.err);
    T('D16', 'Žiedo agentas įrašo žiedo aukštį 0,19 iš dokumentų', ag.ringH === 0.19 && /architektura\.pdf/.test(ag.r.text || ''), ag.r.text || ag.r.err);
    T('D17', 'Perdangų agentas nustato perdangą: g/b plokštės 0,22', ag.sl && ag.sl.type === 'pre' && Math.abs(ag.sl.pt - 0.22) < 1e-9, (ag.s.text || ag.s.err) + ' · ' + JSON.stringify(ag.sl && { type: ag.sl.type, pt: ag.sl.pt }));
    const und = await ev(() => { const n = hist.length; undo(); return { n, after: hist.length }; });
    T('D18', 'Agentų pakeitimus galima atšaukti ↶', und.n > 0 && und.after === und.n - 1, JSON.stringify(und));
    const bd = await ev(() => KS.Board.log.filter(m => m.type === 'ACTION').map(m => m.from).reduce((o, a) => (o[a] = (o[a] || 0) + 1, o), {}));
    T('D19', 'Kiekvienas agento veiksmas programoje registruojamas Board (ACTION)', bd.fnd > 0 && bd.open > 0 && bd.lint > 0 && bd.ring > 0 && bd.slab > 0, JSON.stringify(bd));

    // be pamatų brėžinio: juostos po 1 aukšto sienomis (b × h – vartotojas)
    const st = await ev(async () => { project = fixProject({ name: 'Be pamatų brėžinio', closed: true, walls: [0, 90, 180, 270].map((d, i) => ({ len: i % 2 ? 6 : 9, mode: 'L', t: 0.4, dir: d, h: 3 })) }); changed(); await KS.sync();
        KS.correct('fnd', '', 'b', 0.5, 'testas'); KS.correct('fnd', '', 'h', 0.4, 'testas'); const r = await KS.AG.fnd.draw();
        const P0 = withFloor(0, () => R.P.slice(0, R.n)), P1 = withFloor(1, () => R.P.slice(0, R.n)), dm = Math.max(...P0.map(q => Math.min(...P1.map(s => Math.hypot(q[0] - s[0], q[1] - s[1])))));
        return { r: r.text || r.err, walls: floorData(0).walls.map(w => [w.len, w.t, w.h]), dm }; });
    T('D20', 'Be pamatų brėžinio: „Pamatai“ – juostos po 1 aukšto sienų ašimis (b 0,5 × h 0,4)', st.walls.length === 4 && st.walls.every(w => w[1] === 0.5 && w[2] === 0.4) && st.dm < 0.001, st.r + ' · ' + JSON.stringify(st.walls));
    T('D21', 'Braižytojas (senasis agentas) piešia tikrame architektūros brėžinyje', null, 'Testuota tik įsakymo perdavimas (agentRun pakeistas stebėjimo funkcija); jo braižymas spalvotame PDF – kaip anksčiau, netestuotas šiame teste');
    T('E', 'Nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 3).join(' | '));
    await b.close();
    R.forEach(r => console.log(String(r.nr).padEnd(4) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(18) + String(r.note).slice(0, 500) : '')));
    const cn = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + cn('PASISEKĖ') + ' · NEPAVYKO: ' + cn('NEPAVYKO') + ' · NETESTUOTA: ' + cn('NETESTUOTA'));
    fs.writeFileSync('tests/rezultatai_braizymas.json', JSON.stringify(R, null, 1));
    process.exit(cn('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
