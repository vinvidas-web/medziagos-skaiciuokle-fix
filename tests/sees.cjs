// Ką mato agentai (žyma „👁 Mato“), visi PDF prieinami visiems agentams, atskiras mygtukas „🎯 Lapas“ piešimo lapui pasirinkti.
// Paleidimas: NODE_PATH=$(npm root -g) node tests/sees.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { plan, SQ, CI, SPEC } = require('./fx_pamatai.cjs');

function pdf(pages) { // keli puslapiai su tekstu
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', null], kids = [];
    pages.forEach(lines => { let cs = ''; lines.forEach((t, i) => { cs += `BT /F1 12 Tf 1 0 0 1 40 ${560 - i * 18} Tm (${t}) Tj ET\n`; });
        objs.push(`<< /Length ${Buffer.byteLength(cs, 'latin1')} >>\nstream\n${cs}endstream`); const c = objs.length;
        objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 FONT 0 R >> >> /Contents ${c} 0 R >>`); kids.push(objs.length); });
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); const font = objs.length;
    objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
    let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${o.replace('FONT', font)}\nendobj\n`; });
    const x = Buffer.byteLength(out, 'latin1'); out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(v => String(v).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
    return Buffer.from(out, 'latin1');
}
const FX = {
    'architektura.pdf': pdf([['Projektas: Gyvenamasis namas, Senoliu g. 32', 'PJUVIS 1-1 M 1:100', 'SRBS32-01-TDP-SA-07'], ['Projektas: Gyvenamasis namas, Senoliu g. 32', '1 AUKSTO PLANAS M 1:100', 'Sienos: blokeliai 300', 'SRBS32-01-TDP-SA-01'], ['Projektas: Gyvenamasis namas, Senoliu g. 32', 'LANGU ZINIARASTIS', 'L-1 Langas 1500x1500', 'SRBS32-01-TDP-SA-05']]),
    'pamatai.pdf': plan({ sq: SQ, ci: CI, spec: SPEC }),
    'mano_brezinys.pdf': pdf([['Objektas: kitas namas, Vilniaus g. 5', 'PLANAS M 1:50']]),
    'svetimas.pdf': pdf([['Objektas: Kauno g. 7', 'FASADAS']])
};

(async () => {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const R = []; const T = (nr, name, ok, note) => R.push({ nr, name, res: ok === null ? 'NETESTUOTA' : (ok ? 'PASISEKĖ' : 'NEPAVYKO'), note: note || '' });
    await p.goto('file://' + path.resolve(process.argv[2] || 'kontura.html')); await p.waitForTimeout(1200);
    const ev = (fn, a) => p.evaluate(fn, a);
    const file = n => [n, FX[n].toString('base64')];
    await ev(async () => { project = fixProject({ name: 'Matymo testas', closed: true, walls: [0, 90, 180, 270].map((d, i) => ({ len: i % 2 ? 7 : 11, mode: 'C', t: 0.3, dir: d, h: 3 })) }); changed(); await KS.sync(); });
    // agentų dokumentai + jūsų atidarytas (kito adreso) PDF
    const s1 = await ev(async ([a, f, m]) => { const mk = ([n, d]) => new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' }); KS.setAsk(() => true);
        await KS.Docs.add([mk(a), mk(f)]); await pdfLoadFile(mk(m)); for (let i = 0; i < 40 && KS.ks().docs.length < 3; i++) await new Promise(r => setTimeout(r, 200)); for (let i = 0; i < 40 && KS.ks().docs.some(d => !KS.IDX[d.id]); i++) await new Promise(r => setTimeout(r, 200)); closeSubpanel();
        return { docs: KS.ks().docs.map(d => d.name + ':' + d.member), sees: ['fnd', 'walls', 'open', 'lint', 'ring', 'slab'].map(id => { const S = KS.agentSees(id); return id + ' ' + S.seen.length + '/' + S.total; }) }; }, [file('architektura.pdf'), file('pamatai.pdf'), file('mano_brezinys.pdf')]);
    T('S1', 'Visi 6 agentai mato visus įkeltus PDF, taip pat jūsų atidarytą (📄)', s1.sees.every(x => / 3\/3$/.test(x)) && s1.docs.some(d => /mano_brezinys.pdf:PATVIRTINTA/.test(d)), s1.docs.join(', ') + ' · ' + s1.sees.join(', '));
    const s2 = await ev(async () => { await KS.open('planner'); const pl = document.getElementById('ksRoot').innerText; await KS.open('agents'); const ag = document.getElementById('ksRoot').innerText; closeSubpanel(); return { pl: (pl.match(/\d\/\d PDF/g) || []).length, ag: ag.match(/Mato [^\n]*/)[0], names: ['architektura.pdf', 'pamatai.pdf', 'mano_brezinys.pdf'].every(n => ag.includes(n)), rel: /aktualūs: 1/.test(ag) }; });
    T('S2', 'Žyma „👁 Mato“: kiek PDF ir jų pavadinimai, puslapiai, aktualūs puslapiai', s2.pl >= 6 && s2.names && s2.rel, JSON.stringify(s2));
    const s3 = await ev(async ([sv]) => { const mk = ([n, d]) => new File([Uint8Array.from(atob(d), c => c.charCodeAt(0))], n, { type: 'application/pdf' }); KS.setAsk(() => false); await KS.Docs.add([mk(sv)]); KS.setAsk(null);
        const before = KS.agentSees('walls'); await KS.open('agents'); const txt = document.getElementById('ksRoot').innerText, btn = document.querySelector('#ksRoot [data-dacc]'); btn.click(); await new Promise(r => setTimeout(r, 200));
        const after = KS.agentSees('walls'); closeSubpanel(); return { b: before.seen.length + '/' + before.total, why: before.not.map(x => x.name + ': ' + x.why), shown: /🚫 svetimas.pdf/.test(txt), a: after.seen.length + '/' + after.total }; }, [file('svetimas.pdf')]);
    T('S3', 'Ko agentas nemato – parodoma su priežastimi, vienu mygtuku įjungiama', s3.b === '3/4' && s3.shown && s3.a === '4/4', JSON.stringify(s3));
    // atskiras mygtukas: piešimo lapas
    const s4 = await ev(async () => { draw(); const chip = document.getElementById('chipSheet'), ag = document.getElementById('chipAg'); chip.click(); await new Promise(r => setTimeout(r, 300));
        const rows = [...document.querySelectorAll('#subpanel [data-shpick]')].map(e => e.dataset.shpick); document.querySelector('#subpanel [data-shpick="1"]').click(); await new Promise(r => setTimeout(r, 600));
        const tiles = [...document.querySelectorAll('#subpanel [data-sp]')].map(e => e.dataset.sp), a = KS.ks().docs.find(d => d.name === 'architektura.pdf');
        document.querySelector('#subpanel [data-sp="' + a.id + ':2"]').click(); await new Promise(r => setTimeout(r, 1500)); closeSubpanel(); draw();
        return { sep: chip !== ag && chip.style.top !== ag.style.top, rows, tiles: tiles.length, sheet: KS.ks().sheets['1'], chip: chip.textContent, viewer: PDFU && PDFU.name + ' ' + PDFU.page }; });
    T('S4', 'Atskiras mygtukas „🎯 Lapas“: kiekvienam aukštui – PDF ir konkretus puslapis (su paveikslėliais)', s4.sep && s4.rows.includes('fnd') && s4.rows.includes('1') && s4.tiles >= 6 && s4.sheet && s4.sheet.page === 2 && /architektura.pdf 2 psl./.test(s4.chip) && s4.viewer === 'architektura.pdf 2', JSON.stringify(s4));
    const s5 = await ev(async () => { const m = KS.ks().docs.find(d => d.name === 'mano_brezinys.pdf'); await KS.Docs.open(m.id, 1); const orig = window.agentRun; window.agentRun = async () => { window.__c = PDFU.name + ' ' + PDFU.page; }; await KS.Planner.commandDrawer(0, true); window.agentRun = orig; return window.__c; });
    T('S5', 'Braižytojas piešia ant jūsų pasirinkto lapo (net jei atidarytas kitas PDF)', s5 === 'architektura.pdf 2', s5);
    const s6 = await ev(async () => { const a = KS.ks().docs.find(d => d.name === 'architektura.pdf'), f = KS.ks().docs.find(d => d.name === 'pamatai.pdf'); KS.ks().sheets.fnd = { doc: a.id, page: 1 }; const r1 = await KS.AG.fnd.draw();
        KS.ks().sheets.fnd = { doc: f.id, page: 1 }; const r2 = await KS.AG.fnd.draw(); return { r1: r1.err, r2: r2.text || r2.err, fl: floorName(0) }; });
    T('S6', 'Pamatų agentas naudoja jūsų pasirinktą „Pamatai“ lapą (netinkamame – paaiškina)', /rostverkų nerasta/.test(s6.r1 || '') && /pamatai.pdf 1 psl./.test(s6.r2) && s6.fl === 'Pamatai', JSON.stringify(s6));
    const s7 = await ev(async () => { await KS.Planner.run(['open']); return KS.AG.open.steps.map(s => s.text).find(t => /Mato/.test(t)); });
    T('S7', 'Analizės eigoje agentas užrašo, ką matė (PDF pavadinimai ir puslapiai)', /Mato 4\/4 PDF/.test(s7 || '') && /architektura.pdf \(3 psl.\)/.test(s7), s7);
    await ev(() => { closeSubpanel(); draw(); }); await p.screenshot({ path: path.resolve('tests/ekranas_mygtukai.png') });
    await ev(async () => { await KS.open('agents'); }); await p.screenshot({ path: path.resolve('tests/ekranas_mato.png') });
    T('E', 'Nebuvo JavaScript klaidų', errs.length === 0, errs.slice(0, 3).join(' | '));
    await b.close();
    R.forEach(r => console.log(String(r.nr).padEnd(4) + '  ' + r.res.padEnd(10) + '  ' + r.name + (r.note ? '\n' + ' '.repeat(18) + String(r.note).slice(0, 500) : '')));
    const cn = k => R.filter(r => r.res === k).length;
    console.log('\nPASISEKĖ: ' + cn('PASISEKĖ') + ' · NEPAVYKO: ' + cn('NEPAVYKO') + ' · NETESTUOTA: ' + cn('NETESTUOTA'));
    fs.writeFileSync('tests/rezultatai_mato.json', JSON.stringify(R, null, 1));
    process.exit(cn('NEPAVYKO') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
