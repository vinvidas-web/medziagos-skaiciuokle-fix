#!/usr/bin/env python3
"""Įdeda Tesseract OCR (tesseract.js 7.0.0, tesseract.js-core 7.0.0 simd-lstm, lietuvių kalbos modelis 4.0.0_best_int)
į kontura.html kaip <script type="text/plain"> blokus (gzip + base64), kad OCR veiktų be interneto.
Naudojimas: npm i tesseract.js@7.0.0 tesseract.js-core@7.0.0 @tesseract.js-data/lit@1.0.0 (kataloge NM)
            python3 tools/ideti_ocr.py NM/node_modules kontura.html
Licencijos: Tesseract, tesseract.js, tesseract.js-core, tessdata – Apache-2.0."""
import base64, gzip, re, sys
nm, html = sys.argv[1], sys.argv[2]
parts = {
    'ocrJ': (nm + '/tesseract.js/dist/tesseract.min.js', True),
    'ocrW': (nm + '/tesseract.js/dist/worker.min.js', True),
    'ocrC': (nm + '/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', True),
    'ocrL': (nm + '/@tesseract.js-data/lit/4.0.0_best_int/lit.traineddata.gz', False),  # jau gzip
}
s = open(html, encoding='utf-8').read()
s = re.sub(r'<script type="text/plain" id="ocr[JWCL]">[^<]*</script>\n?', '', s)
s = s.replace('<!-- OCR: Tesseract (Apache-2.0) -->\n', '')
add = '<!-- OCR: Tesseract (Apache-2.0) -->\n'
for k, (p, gz) in parts.items():
    b = open(p, 'rb').read()
    if gz: b = gzip.compress(b, 9, mtime=0)
    add += '<script type="text/plain" id="%s">%s</script>\n' % (k, base64.b64encode(b).decode())
i = s.rindex('</body>')
s = s[:i] + add + s[i:]
open(html, 'w', encoding='utf-8').write(s)
print('OK', len(s.encode()) // 1024, 'KB')
