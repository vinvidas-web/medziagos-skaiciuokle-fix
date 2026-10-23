# medziagos-skaiciuokle-fix
Pataisyta medžiagų skaičiuoklė su HTML failu

- `kontura.html` – programa „KONTŪRAS“ (vienas failas, veikia telefone be interneto).
- Agentų sistema (6 specialistai + Planner, Board, keli projekto PDF): ⚙️ → 🧠 Agentai. Aprašas – [ARCHITEKTURA.md](ARCHITEKTURA.md).
- OCR skenuotiems PDF ir nuotraukoms (Tesseract, lietuvių kalba, be interneto) – `tools/ideti_ocr.py`.
- Ašių geometrijos patikra (linijos, žymės burbuluose, tarpai ↔ matmenys, mastelis, dokumentų palyginimas, sienų susiejimas).
- Bandymų rezultatai – [TESTAI.md](TESTAI.md). Paleidimas: `NODE_PATH=$(npm root -g) node tests/agents.cjs`, `tests/ocr.cjs`, `tests/axes.cjs`.
