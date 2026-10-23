// KONTŪRAS agentų sistemos testai (Playwright + Chromium). Paleidimas: NODE_PATH=$(npm root -g) node tests/agents.cjs
// Rezultatas: lentelė PASISEKĖ / NEPAVYKO / NETESTUOTA pagal specifikacijos 20 skyrių.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/* Minimalus PDF: tekstas (Helvetica, ASCII) ir linijos; be teksto – „skenuotas“ puslapis */
function pdf(pages) {
    const objs = [], add = s => { objs.push(s); return objs.length; };
    const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const kids = [], pagesId = objs.length + 1 + pages.length * 2; // puslapių medžio ID po visų puslapių
    pages.forEach(pg => {
        let cs = '';
        (pg.lines || []).forEach(([x1, y1, x2, y2]) => { cs += `${x1} ${y1} m ${x2} ${y2} l S\n`; });
        (pg.text || []).forEach(([x, y, t, sz]) => { cs += `BT /F1 ${sz || 10} Tf ${x} ${y} Td (${t.replace(/[()\\]/g, '\\$&')}) Tj ET\n`; });
        const c = add(`<< /Length ${Buffer.byteLength(cs)} >>\nstream\n${cs}endstream`);
        kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${c} 0 R >>`));
    });
    add(`<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`);
    const cat = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let out = '%PDF-1.4\n'; const off = [];
    objs.forEach((o, i) => { off.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = Buffer.byteLength(out);
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
}
const head = (title, no, rev, addr) => [[40, 560, 'Projektas: Gyvenamasis namas, ' + addr, 11], [40, 540, title, 14], [600, 40, no, 9], [600, 28, 'Laida: ' + rev, 9]];
const FIX = {
    'arch.pdf': pdf([
        { text: head('1 AUKSTO PLANAS M 1:100', 'SRBS32-01-TDP-SA-01', '0', 'Senoliu g. 32').concat([[100, 300, '12000'], [300, 200, '8000'], [80, 420, 'A'], [80, 120, 'B'], [120, 460, '1'], [500, 460, '2'], [200, 250, 'L-1'], [250, 250, 'D-1'], [40, 100, '+0.000'], [40, 80, 'Sienos: keramzitbetonio blokeliai 300']]), lines: [[100, 100, 500, 100], [500, 100, 500, 400]] },
        { text: head('LANGU IR DURU ZINIARASTIS', 'SRBS32-01-TDP-SA-05', '0', 'Senoliu g. 32').concat([[60, 400, 'L-1 Langas 1500x1500'], [60, 380, 'D-1 Durys 900x2100'], [60, 360, 'zr. SRBS32-01-TDP-SA-01']]) },
        { text: head('PJUVIS 1-1', 'SRBS32-01-TDP-SA-07', '0', 'Senoliu g. 32').concat([[60, 300, '-1.200'], [60, 280, '+3.000'], [60, 260, 'Perdanga: g/b plokstes 220']]) }]),
    'konstr.pdf': pdf([
        { text: head('PAMATU PLANAS M 1:100', 'SRBS32-01-TDP-SK-01', '0', 'Senoliu g. 32').concat([[60, 300, 'Rostverkas R-1 600x400'], [60, 280, 'Pamatu padas -1.200'], [60, 260, 'Betonas C25/30, armatura B500B']]) }]),
    'konstr_rev1.pdf': pdf([
        { text: head('PAMATU PLANAS M 1:100', 'SRBS32-01-TDP-SK-01', '1', 'Senoliu g. 32').concat([[60, 300, 'Rostverkas R-1 500x400'], [60, 280, 'Pamatu padas -1.300'], [60, 260, '12500']]) }]),
    'kitas_projektas.pdf': pdf([
        { text: head('1 AUKSTO PLANAS M 1:50', 'XYZ-02-TP-SA-01', 'A', 'Vilniaus g. 5').concat([[60, 300, '9000']]) }]),
    'skenuotas.pdf': pdf([{ lines: [[50, 50, 700, 50], [700, 50, 700, 500], [50, 500, 700, 500], [50, 50, 50, 500]] }])
};

(async () => {
    const file = 'file://' + path.resolve(process.argv[2] || 'kontura.html');
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const ctx = await b.newContext({ viewport: { width: 412, height: 860 } });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    const ev = (fn, arg) => p.evaluate(fn, arg);
    const b64 = n => FIX[n].toString('base64');

    await p.goto(file); await p.waitForTimeout(1200);
    T(1, 'Programa atsidaro be JavaScript klaidų', errs.length === 0, errs.join(' | '));

    // 2. esamos funkcijos: pavyzdys, skaičiavimas, ataskaita, Excel, 3D, nustatymų skydelis
    const keep = await ev(async () => {
        loadExample(); const n = project.walls.length, area = R && R.wallArea, q = Q && Q.tot && Q.tot.outM2;
        set3d(true); draw(); set3d(false); openPanel('settings'); const rows = document.body.innerText.includes('Agentai 6 + Planner'); closePanel();
        let xl = 0; const orig = window.download; window.download = (name, blob) => { xl = blob.size; }; try { await saveExcelFile(); } catch (e) { } window.download = orig;
        return { n, area, q, rows, xl, closed: project.closed };
    });
    T(2, 'Esamos funkcijos išliko (pavyzdys, kiekiai, 3D, nustatymai, Excel)', keep.n > 3 && keep.area > 0 && keep.q > 0 && keep.xl > 1000 && keep.rows, JSON.stringify(keep));

    // 3–8. dokumentai
    const add = async (names, ask) => ev(async ({ files, ask }) => { KS.setAsk(t => ask); const fs = files.map(([n, d]) => new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' }));
        const r = await KS.Docs.add(fs); KS.setAsk(null); return r.map(d => ({ name: d.name, pages: d.pages, status: d.status, member: d.member, ev: d.memberEv, sum: d.sum, recheck: d.recheck, changes: d.changes })); },
        { files: names.map(n => [n, b64(n)]), ask });
    const d1 = await add(['arch.pdf', 'konstr.pdf'], true);
    T(3, 'Galima įkelti kelis vieno projekto PDF', d1.length === 2 && d1.every(d => d.status === 'INDEKSUOTA') && d1[1].member === 'AUTO', d1.map(d => d.name + ': ' + d.member + ' (' + (d.ev || []).join('; ') + ')').join(' | '));
    const d2 = await add(['kitas_projektas.pdf'], false);
    T(4, 'Tikrinama dokumentų priklausomybė projektui', d2[0].member === 'ATMESTA' && d2[0].ev.join(' ').includes('adresas'), 'kitas projektas: ' + d2[0].member + ' – ' + d2[0].ev.join('; '));
    T(5, 'Analizuojami visi PDF puslapiai', d1[0].pages === 3 && await ev(() => KS.Docs.pages().length) === 4, 'arch.pdf ' + d1[0].pages + ' psl.; iš viso projekte ' + await ev(() => KS.Docs.pages().length) + ' psl. (atmestas dokumentas neįtrauktas)');
    const f = await ev(() => { const P = KS.IDX[KS.ks().docs[0].id][0]; return { title: P.title, no: P.drawingNos, rev: P.rev, scale: P.scale, dims: P.dims, axes: P.axes, marks: P.marks, elev: P.elev, mat: P.materials, addr: P.address, kinds: P.kinds }; });
    T(6, 'Analizuojami reikšmingi informaciniai laukai', f.scale === 100 && f.no.includes('SRBS32-01-TDP-SA-01') && f.dims.includes(12000) && f.axes.includes('A') && f.marks.includes('L-1') && f.elev.includes(0) && f.addr.length === 1 && f.rev === '0', JSON.stringify(f));

    // agentai: pamatų agentas naudoja kito PDF informaciją (rostverkas iš konstr.pdf), sienos – iš modelio
    let plan = await ev(async () => { await KS.Planner.run(['fnd']); return KS.ks().plan; });
    const fnd = await ev(() => KS.ks().results.fnd);
    T(7, 'Agentai gali naudoti skirtingų PDF informaciją', fnd.candidates.some(c => c.docName === 'konstr.pdf' && Math.round(c.b * 1000) === 600) && fnd.issues.some(i => /-1\.2/.test(i.text)), 'kandidatai: ' + fnd.candidates.map(c => Math.round(c.b * 1000) + 'x' + Math.round(c.h * 1000) + ' ' + c.docName + ' p.' + c.page).join(', '));
    T('7a', 'Planner paleidžia tik reikalingus agentus (pamatams – Sienų + Pamatų)', plan.steps.map(s => s.agent).join(',') === 'walls,fnd', plan.steps.map(s => s.agent + ':' + s.reason).join(' | '));
    T('7b', 'Trūkstami matmenys neišgalvojami (pamato skerspjūvis → NEEDS_DATA)', fnd.state === 'NEEDS_DATA' && fnd.objects.every(o => o.dims.vol == null && o.status === 'PROPOSED') && !fnd.qty.some(q => q.unit === 'm³'), fnd.needs[0]);

    // prieštaringi duomenys: angos žymė modelyje ≠ žiniaraštis
    const conflict = await ev(async () => { const o = project.openings.find(x => x.kind === 'L') || project.openings[0]; o.mark = 'L-1'; o.w = 1.2; o.h = 1.5; changed(true); await KS.Planner.run(['open']); return KS.ks().results.open.issues.filter(i => /Prieštaravimas/.test(i.text)).map(i => i.text); });
    T(8, 'Aptinkami prieštaringi dokumentų duomenys', conflict.length > 0 && /1500x1500|1,5×1,5|1,50×1,50/.test(conflict[0].replace(/\s/g, '')), conflict[0]);

    const scan = await add(['skenuotas.pdf'], true);
    const scanInfo = await ev(() => { const d = KS.ks().docs.find(x => x.name === 'skenuotas.pdf'), P = KS.IDX[d.id][0]; return { read: P.read, err: P.ocrErr || KS.OCR.err || '', ocr: P.ocr }; });
    T(9, 'Veikia skenuotų PDF analizė (OCR)', scanInfo.read === 'NEPERSKAITYTA' && !scanInfo.err && scan[0].status === 'NEPERSKAITYTA', 'lapas tik su linijomis: OCR paleistas be klaidų, teksto nerasta → „' + scan[0].status + '“. Skenai su tekstu – tests/ocr.cjs (O1–O7)');
    T(10, 'Veikia nuotraukų analizė (OCR)', null, 'Tikrinama tests/ocr.cjs (O8–O10): nuotrauka pasukta 2° su triukšmu');
    T(11, 'Nustatomos ir tikrinamos pastato ašys', null, 'Ašių žymių kandidatai išrenkami iš teksto (' + f.axes.join(' ') + '), bet ašių linijų geometrija ir jų tarpusavio padėtis netikrinama');
    T(12, 'Tikrinamas mastelis', null, 'Mastelis M 1:' + f.scale + ' perskaitomas iš teksto (kalibracija – esama 📏 funkcija); automatinis mastelio patikrinimas pagal matmenų grandinę neįgyvendintas');

    // 13. matmenys: sienų dviguba patikra
    plan = await ev(async () => { await KS.Planner.run(); return KS.ks().plan; });
    const walls = await ev(() => KS.ks().results.walls);
    const dual = walls.checks.find(c => /dviguba/.test(c.name));
    T(13, 'Tikrinami matmenys (dviguba patikra: formulė ↔ koordinatės)', dual && dual.status === 'OK', dual && dual.note);

    // 14. Board
    const bd = await ev(() => ({ n: KS.Board.log.length, types: [...new Set(KS.Board.log.map(m => m.type))], ver: KS.Board.versions().length, fields: Object.keys(KS.Board.log[0]) }));
    T(14, 'Veikia Board pranešimai', bd.n > 10 && ['TASK', 'RESULT', 'QUERY', 'REPORT'].every(t => bd.types.includes(t)) && ['id', 'pid', 'from', 'to', 'type', 'taskId', 'ver', 't', 'content', 'status'].every(k => bd.fields.includes(k)), bd.n + ' pranešimų; tipai ' + bd.types.join(','));
    T(15, 'Agentai gauna Planner užduotis', await ev(() => ['fnd', 'walls', 'open', 'lint', 'ring', 'slab'].every(id => KS.Board.log.some(m => m.type === 'TASK' && m.from === 'planner' && m.to === id))), 'TASK pranešimai visiems 6');

    // 16. izoliacija
    const iso = await ev(() => { const r = {}; try { KS.Board.publish('open', 'walls.result', { objects: [] }); r.write = 'pavyko'; } catch (e) { r.write = 'atmesta'; }
        const q = KS.Board.query('lint', 'walls.result'); try { q.value.objects[0].dims.C = 999; } catch (e) { } r.after = KS.Board.data['walls.result'].value.objects[0].dims.C; r.frozen = Object.isFrozen(KS.Board.data['walls.result'].value.objects[0]); return r; });
    T(16, 'Agentai negali keisti vienas kito duomenų', iso.write === 'atmesta' && iso.after !== 999 && iso.frozen, JSON.stringify(iso));

    // 17. konfliktai
    const conf = await ev(async () => { const n0 = KS.Board.conflicts.length; class Bad extends KS.Agent { constructor() { super('bad', '?', 'Bandomasis', '', []); } }
        const a = new Bad(); KS.Board.publish('bad', 'bad.result', { objects: [{ key: 'f0:o0', type: 'išorinė siena' }] }); const r = KS.Planner.review([]); return { n: KS.Board.conflicts.length - n0, review: r.map(x => x.text) }; });
    T(17, 'Planner aptinka konfliktus', conf.n === 1 && conf.review.some(t => /du agentai/.test(t)), conf.review.join(' | '));

    // 18. grąžinimas taisyti
    const corr = await ev(async () => { const o = project.openings[0]; const keepPos = o.pos; o.pos = 200; changed(true); await KS.Planner.run(['open']);
        const P = KS.ks().plan, cr = KS.Board.log.filter(m => m.type === 'CORRECTION_REQUEST' && m.from === 'planner' && m.to === 'open').length; o.pos = keepPos; changed(true); return { cr, corrected: P.steps.find(s => s.agent === 'open').corrected, state: P.steps.find(s => s.agent === 'open').final, done: P.steps.find(s => s.agent === 'open').done }; });
    T(18, 'Planner grąžina klaidingus rezultatus taisyti', corr.cr > 0 && corr.corrected && corr.state === 'NEEDS_REVIEW' && !corr.done, JSON.stringify(corr));

    // 19–20. perdavimas į pagrindinį langą + koordinačių tikslumas
    plan = await ev(async () => { await KS.Planner.run(); return KS.ks().plan; });
    const tr = plan.transfer;
    T(19, 'Geometrija perduodama į pagrindinį langą (įrašyta, atvaizduojama)', ['walls', 'open', 'lint', 'ring', 'fnd'].every(id => tr[id] && tr[id].same && /nupiešta/.test(tr[id].draw) && tr[id].ok), Object.keys(tr).map(k => k + ': ' + (tr[k].ok ? 'OK' : tr[k].why) + ' [' + tr[k].draw + ']').join(' | '));
    T(20, 'Patikrinamas perduotų koordinačių tikslumas', Object.values(tr).every(t => /nuokrypis 0,00 mm/.test(t.coord)), Object.keys(tr).map(k => k + ': ' + tr[k].coord).join(' | '));
    const px = await ev(async () => { KS.ks().layer = ''; KS.ks().show = true; const r = KS.ks().results.ring; if (!r || !r.objects.length) return 'nėra žiedų'; const o = r.objects.find(x => x.floor === (project.fl || 0)); fitView(); draw();
        const m = W2S([(o.coords[0][0] + o.coords[1][0]) / 2, (o.coords[0][1] + o.coords[1][1]) / 2], view); const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(Math.round(m[0] * DPR), Math.round(m[1] * DPR), 1, 1).data; return [...d]; });
    T('20a', 'Rezultatai matomi pagrindinio lango drobėje (žiedo pikselis)', Array.isArray(px) && px[2] > px[0], 'RGBA ' + JSON.stringify(px));
    const notDone = plan.steps.filter(s => !s.done).map(s => s.agent + ':' + s.final);
    T('20b', '„Užbaigta“ rodoma tik patikrintiems ir perduotiems rezultatams', plan.steps.every(s => s.done === (s.final === 'COMPLETED' && tr[s.agent].ok)) && notDone.includes('fnd:NEEDS_DATA'), 'neužbaigti: ' + notDone.join(', '));

    // pamato skerspjūvis – vartotojo pataisa → tūris
    const fnd2 = await ev(async () => { KS.correct('fnd', '', 'b', 0.5, 'K-1 rostverkas'); KS.correct('fnd', '', 'h', 0.4, 'K-1 rostverkas'); await KS.Planner.run(['fnd']); const r = KS.ks().results.fnd; return { st: r.state, v: r.qty.find(q => q.unit === 'm³'), L: r.qty[0].v, n: KS.ks().corrections.length }; });
    T(23, 'Pataisymai registruojami (ir agentas perskaičiuoja)', fnd2.n >= 2 && fnd2.st === 'COMPLETED' && fnd2.v && Math.abs(fnd2.v.v - fnd2.L * 0.5 * 0.4) < 1e-6, JSON.stringify(fnd2));

    // patvirtinimas + apsauga
    const ap = await ev(async () => { const n = KS.approve('walls'); const w = project.walls[0]; const t0 = w.t; w.t = t0 + 0.05; changed(true); await KS.Planner.run(['walls']);
        const r = KS.ks().results.walls, o = r.objects.find(x => x.id === 'W0_o0'); const req = KS.Board.log.filter(m => m.type === 'APPROVAL_REQUEST').length; w.t = t0; changed(true); return { n, st: o.status, pending: !!o.pending, req }; });
    T('23a', 'Vartotojo patvirtinti duomenys apsaugoti (nauja versija laukia sprendimo)', ap.n > 0 && ap.st === 'APPROVED' && ap.pending && ap.req > 0, JSON.stringify(ap));

    // 21–22. išsaugojimas ir atkūrimas
    await ev(async () => { await KS.Planner.run(); });
    const before = await ev(() => ({ pid: KS.ks().pid, h: KS.ks().results.walls.hash, docs: KS.ks().docs.length, saved: KS.ks().plan.saved, log: KS.Board.log.length }));
    T(21, 'Projektas išsaugomas', before.saved === true, JSON.stringify(before));
    await p.reload(); await p.waitForTimeout(1500);
    const after = await ev(async () => { await KS.sync(); return { pid: KS.ks().pid, h: KS.ks().results.walls && KS.ks().results.walls.hash, docs: KS.ks().docs.length, idx: KS.Docs.pages().length, log: KS.Board.log.length, st: KS.AG.walls.state }; });
    T(22, 'Projektas atkuriamas (rezultatai, dokumentai, indeksas, Board istorija)', after.pid === before.pid && after.h === before.h && after.docs === before.docs && after.idx > 0 && after.log >= before.log - 5, JSON.stringify(after));
    const file2 = await ev(() => { const s = JSON.stringify(project); const p2 = fixProject(JSON.parse(s)); return !!(p2.ks && p2.ks.results.walls && p2.ks.pid === project.ks.pid); });
    T('22a', 'Projekto failas (💾 .json) išsaugo ir atkuria agentų duomenis', file2, '');

    // 24. nauja redakcija → pertikrinimas
    const rv = await add(['konstr_rev1.pdf'], true);
    const st = await ev(() => ({ stale: KS.ks().stale, sup: KS.ks().docs.find(d => d.name === 'konstr.pdf').superseded }));
    T(24, 'Naujas PDF inicijuoja reikalingas pakartotines patikras', rv[0].member === 'AUTO' && st.stale.fnd && st.sup && st.sup.includes(1) && rv[0].changes.length && rv[0].changes[0].gone.length === 0, 'pakeitimai: ' + JSON.stringify(rv[0].changes.map(c => ({ no: c.no, rev: c.rev, add: c.add }))) + '; pertikrinti: ' + Object.keys(st.stale).join(','));
    const cand = await ev(async () => { await KS.Planner.run(['fnd']); return KS.ks().results.fnd.candidates.map(c => Math.round(c.b * 1000)); });
    T('24a', 'Pakeistos redakcijos puslapis nebenaudojamas (rostverkas 500, ne 600)', cand.includes(500) && !cand.includes(600), 'kandidatai: ' + cand.join(', '));

    // 25. vieno agento klaida nesugadina kitų
    const fail = await ev(async () => { const a = KS.AG.lint, orig = a.analyze; a.analyze = async () => { throw new Error('bandomoji klaida'); }; const geo = () => JSON.stringify(KS.ks().results.walls.objects.map(o => [o.id, o.coords, o.dims])), h0 = geo();
        await KS.Planner.run(); a.analyze = orig; const P = KS.ks().plan; return { lint: P.steps.find(s => s.agent === 'lint').final, ring: P.steps.find(s => s.agent === 'ring').final, walls: P.steps.find(s => s.agent === 'walls').done, same: geo() === h0 }; });
    T(25, 'Vieno agento klaida nesugadina kitų agentų duomenų', fail.lint === 'FAILED' && fail.walls && fail.same && fail.ring !== 'FAILED', JSON.stringify(fail));

    // perdangos – 5 aukštų pavyzdys
    const sl = await ev(async () => { loadExample5(); await KS.sync(); await KS.Planner.run(); const r = KS.ks().results.slab; return { st: r.state, n: r.objects.length, q: r.qty.length, checks: r.checks.map(c => c.status).join(','), fl: floorCount() }; });
    T('P', 'Perdangų agentas (5 aukštų pavyzdys)', sl.n > 0 && sl.q > 0 && !/KLAIDA/.test(sl.checks), JSON.stringify(sl));

    // UI: langai atsidaro, failų pasirinkimas per mygtuką
    const ui = await ev(async () => { const out = {}; for (const t of ['planner', 'agents', 'docs', 'qty', 'board', 'kor']) { await KS.open(t); out[t] = !!document.getElementById('ksRoot'); } closeSubpanel(); return out; });
    await ev(() => KS.open('docs')); await p.waitForTimeout(200);
    const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('#ksAdd')]);
    fs.mkdirSync('/tmp/ks_fx', { recursive: true }); fs.writeFileSync('/tmp/ks_fx/arch.pdf', FIX['arch.pdf']);
    await chooser.setFiles('/tmp/ks_fx/arch.pdf'); await p.waitForTimeout(1500);
    const uiDocs = await ev(() => KS.ks().docs.map(d => d.name + ':' + d.member));
    T('UI', 'Langai: Planner, Agentai, Dokumentai, Kiekiai, Board, Pataisymai; įkėlimas per mygtuką', Object.values(ui).every(Boolean) && uiDocs.length === 1, JSON.stringify(ui) + ' ' + uiDocs.join(','));
    await ev(async () => { loadExample(); await KS.sync(); await KS.Planner.run(); await KS.open('planner'); }); await p.waitForTimeout(300);
    await p.screenshot({ path: path.resolve('tests/ekranas_planner.png') });
    await ev(() => closeSubpanel()); await p.waitForTimeout(200); await p.screenshot({ path: path.resolve('tests/ekranas_planas.png') });

    T('E', 'Per visą testą nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 5).join(' | '));
    await b.close();
    const w = Math.max(...R.map(r => String(r.nr).length));
    R.forEach(r => console.log(String(r.nr).padEnd(w) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(w + 14) + r.note.slice(0, 400) : '')));
    const c = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + c('PASISEKĖ') + ' · NEPAVYKO: ' + c('NEPAVYKO') + ' · NETESTUOTA: ' + c('NETESTUOTA'));
    fs.writeFileSync('tests/rezultatai.json', JSON.stringify(R, null, 1));
    process.exit(c('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
