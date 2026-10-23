// Testų brėžiniai: vektorinis pamatų planas M 1:100 (rostverkai, poliai, ašys, specifikacija)
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

module.exports = { plan, SQ, CI, SPEC, FX };
