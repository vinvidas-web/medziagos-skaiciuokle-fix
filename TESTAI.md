# KONTŪRAS – agentų sistemos bandymų rezultatai

Data: 2026-10-23 · Aplinka: Chromium (Playwright), telefono ekranas 412×860 · Failas: `kontura.html`

Paleidimas: `NODE_PATH=$(npm root -g) node tests/agents.cjs`, `node tests/ocr.cjs`, `node tests/axes.cjs`, `node tests/fnd.cjs`, `node tests/draw.cjs`, tada `node tests/ataskaita.cjs`.

**Iš viso – PASISEKĖ: 95 · NEPAVYKO: 0 · NETESTUOTA: 5**

> Bandyta su testui sugeneruotais PDF ir vaizdais bei programos pavyzdžiais (📐 pavyzdys, 🏢 5 aukštų). OCR laikai – kompiuterio Chromium; telefone bus lėčiau. **Su tikrais statybiniais brėžiniais netestuota.** Specifikacijos 20 skyriaus punktai 11 (ašys) ir 12 (mastelis) tikrinami skyriuje „Ašys“ (A1–A16b).

## Agentų sistema (tests/agents.cjs)

| Nr. | Testas | Rezultatas | Pastaba |
|---|---|---|---|
| 1 | Programa atsidaro be JavaScript klaidų | ✅ PASISEKĖ |  |
| 2 | Esamos funkcijos išliko (pavyzdys, kiekiai, 3D, nustatymai, Excel) | ✅ PASISEKĖ | {"n":8,"area":108.92596969619669,"q":93.18096969619668,"rows":true,"xl":513225,"closed":true} |
| 3 | Galima įkelti kelis vieno projekto PDF | ✅ PASISEKĖ | arch.pdf: PIRMAS (pirmasis projekto dokumentas) / konstr.pdf: AUTO (adresas: senoliug.32; brėžinių numeriai: SRBS32-01; bendri žodžiai: projektas, gyvenamasis, namas, senoliu) |
| 4 | Tikrinama dokumentų priklausomybė projektui | ✅ PASISEKĖ | kitas projektas: ATMESTA – adresas skiriasi nuo kitų dokumentų |
| 5 | Analizuojami visi PDF puslapiai | ✅ PASISEKĖ | arch.pdf 3 psl.; iš viso projekte 4 psl. (atmestas dokumentas neįtrauktas) |
| 6 | Analizuojami reikšmingi informaciniai laukai | ✅ PASISEKĖ | {"title":"1 AUKSTO PLANAS M 1:100","no":["SRBS32-01-TDP-SA-01"],"rev":"0","scale":100,"dims":[12000,8000],"axes":["A","B","1","2"],"marks":["L-1","D-1","SA-01"],"elev":[0],"mat":["keramzitbetonio"],"addr":["Senoliu g. 32"],"kinds":["walls"]} |
| 7 | Agentai gali naudoti skirtingų PDF informaciją | ✅ PASISEKĖ | kandidatai: 600x400 konstr.pdf p.1 |
| 7a | Planner paleidžia tik reikalingus agentus (pamatams – Sienų + Pamatų) | ✅ PASISEKĖ | walls:reikia agentui Pamatų agentas / fnd:užsakyta |
| 7b | Trūkstami matmenys neišgalvojami (pamato skerspjūvis → NEEDS_DATA) | ✅ PASISEKĖ | Pamato skerspjūvis (plotis × aukštis) nepatvirtintas – dokumentuose rasta: 600×400 (konstr.pdf 1 psl.). Įveskite arba patvirtinkite – spėjimas nenaudojamas. |
| 8 | Aptinkami prieštaringi dokumentų duomenys | ✅ PASISEKĖ | Prieštaravimas: L-1 modelyje 1,20×1,50, arch.pdf 2 psl. – 1,50×1,50 (nesirenkama automatiškai) |
| 9 | Veikia skenuotų PDF analizė (OCR) | ✅ PASISEKĖ | lapas tik su linijomis: OCR paleistas be klaidų, teksto nerasta → „NEPERSKAITYTA“. Skenai su tekstu – tests/ocr.cjs (O1–O7) |
| 10 | Veikia nuotraukų analizė (OCR) | ⬜ NETESTUOTA | Tikrinama tests/ocr.cjs (O8–O10): nuotrauka pasukta 2° su triukšmu |
| 13 | Tikrinami matmenys (dviguba patikra: formulė ↔ koordinatės) | ✅ PASISEKĖ | didžiausias skirtumas 0,0 mm |
| 14 | Veikia Board pranešimai | ✅ PASISEKĖ | 62 pranešimų; tipai WARNING,TASK,RESULT,REPORT,QUERY |
| 15 | Agentai gauna Planner užduotis | ✅ PASISEKĖ | TASK pranešimai visiems 6 |
| 16 | Agentai negali keisti vienas kito duomenų | ✅ PASISEKĖ | {"write":"atmesta","after":12,"frozen":true} |
| 17 | Planner aptinka konfliktus | ✅ PASISEKĖ | Tą patį objektą f0:o0 skelbia du agentai |
| 18 | Planner grąžina klaidingus rezultatus taisyti | ✅ PASISEKĖ | {"cr":1,"corrected":true,"state":"NEEDS_REVIEW","done":false} |
| 19 | Geometrija perduodama į pagrindinį langą (įrašyta, atvaizduojama) | ✅ PASISEKĖ | walls: OK [11 / 11 nupiešta, 11 matoma pikseliuose] / fnd: OK [9 / 9 nupiešta, 9 matoma pikseliuose] / open: OK [8 / 8 nupiešta, 8 matoma pikseliuose] / lint: OK [7 / 7 nupiešta, 7 matoma pikseliuose] / ring: OK [8 / 8 nupiešta, 8 matoma pikseliuose] / slab: OK [nėra ką piešti] |
| 20 | Patikrinamas perduotų koordinačių tikslumas | ✅ PASISEKĖ | walls: 11 obj. patikrinta, didžiausias nuokrypis 0,00 mm / fnd: 9 obj. patikrinta, didžiausias nuokrypis 0,00 mm / open: 8 obj. patikrinta, didžiausias nuokrypis 0,00 mm / lint: 7 obj. patikrinta, didžiausias nuokrypis 0,00 mm / ring: 8 obj. patikrinta, didžiausias nuokrypis 0,00 mm / slab: 0 obj. p |
| 20a | Rezultatai matomi pagrindinio lango drobėje (žiedo pikselis) | ✅ PASISEKĖ | RGBA [104,136,176,255] |
| 20b | „Užbaigta“ rodoma tik patikrintiems ir perduotiems rezultatams | ✅ PASISEKĖ | neužbaigti: fnd:NEEDS_DATA |
| 23 | Pataisymai registruojami (ir agentas perskaičiuoja) | ✅ PASISEKĖ | {"st":"COMPLETED","v":{"floor":0,"name":"Pamatų betonas","unit":"m³","v":11.171600000000002},"L":55.858000000000004,"n":2} |
| 23a | Vartotojo patvirtinti duomenys apsaugoti (nauja versija laukia sprendimo) | ✅ PASISEKĖ | {"n":11,"st":"APPROVED","pending":true,"req":1} |
| 21 | Projektas išsaugomas | ✅ PASISEKĖ | {"pid":"prj_mvli7vuyjglhy","h":"15u47l1","docs":4,"saved":true,"log":174} |
| 22 | Projektas atkuriamas (rezultatai, dokumentai, indeksas, Board istorija) | ✅ PASISEKĖ | {"pid":"prj_mvli7vuyjglhy","h":"15u47l1","docs":4,"idx":5,"log":174,"st":"COMPLETED"} |
| 22a | Projekto failas (💾 .json) išsaugo ir atkuria agentų duomenis | ✅ PASISEKĖ |  |
| 24 | Naujas PDF inicijuoja reikalingas pakartotines patikras | ✅ PASISEKĖ | pakeitimai: [{"no":"SRBS32-01-TDP-SK-01","rev":"0 → 1","add":[12500]}]; pertikrinti: fnd |
| 24a | Pakeistos redakcijos puslapis nebenaudojamas (rostverkas 500, ne 600) | ✅ PASISEKĖ | kandidatai: 500 |
| 25 | Vieno agento klaida nesugadina kitų agentų duomenų | ✅ PASISEKĖ | {"lint":"FAILED","ring":"COMPLETED","walls":true,"same":true} |
| P | Perdangų agentas (5 aukštų pavyzdys) | ✅ PASISEKĖ | {"st":"COMPLETED","n":179,"q":11,"checks":"OK,OK,OK,OK,OK,OK,OK,OK","fl":5} |
| UI | Langai: Planner, Agentai, Dokumentai, Kiekiai, Board, Pataisymai; įkėlimas per mygtuką | ✅ PASISEKĖ | {"planner":true,"agents":true,"docs":true,"qty":true,"board":true,"kor":true} arch.pdf:PIRMAS |
| E | Per visą testą nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |

## OCR – skenuoti PDF ir nuotraukos (tests/ocr.cjs)

Skenas: A4 lapas 2480×1754 px (≈212 DPI), tik paveikslėlis, be teksto sluoksnio. Nuotrauka: 2000×1400 JPEG, pasukta 2°, su triukšmu.

| Nr. | Testas | Rezultatas | Pastaba |
|---|---|---|---|
| O1 | Skenuotas PDF: tekstas atpažįstamas OCR (be interneto) | ✅ PASISEKĖ | OCR, 23 žodžių, vid. patikimumas 94 %, neaiškių 0, laikas 5 s |
| O2 | Skenas: mastelis, brėžinio Nr., laida | ✅ PASISEKĖ | M 1:100 · SRBS32-01-TDP-SK-02 · laida 0 |
| O3 | Skenas: horizontalus ir vertikalus matmuo | ✅ PASISEKĖ | matmenys: 12000, 8000 |
| O4 | Skenas: lietuviškos raidės, adresas, pamatų turinys | ✅ PASISEKĖ | adresas: Senolių g. 32 · turinys: fnd |
| O5 | Skenas: dydžiai, altitudė, medžiaga | ✅ PASISEKĖ | dydžiai 600x400 · altitudės -1.2 · c25/30 |
| O6 | Pamatų agentas: OCR skerspjūvis – tik pasiūlymas su žyma „OCR“ | ✅ PASISEKĖ | Pamato skerspjūvis (plotis × aukštis) nepatvirtintas – dokumentuose rasta: 600×400 (skenas.pdf 1 psl., OCR). Įveskite arba patvirtinkite – spėjimas nenaudojamas. |
| O7 | Pagrindinis langas: skeno mastelis ir tekstai iš OCR | ✅ PASISEKĖ | {"n":23,"ocr":true,"scale":100} |
| O8 | Nuotrauka (pasukta 2°, triukšmas): žymės ir dydžiai | ✅ PASISEKĖ | žymės L-1,D-1 · dydžiai 1500x1500,900x2100 · M 1:50 · 89 % · 9 s |
| O9 | Nuotrauka priskiriama projektui pagal OCR adresą | ✅ PASISEKĖ | AUTO · Senolių g. 32 |
| O10 | Žiniaraštis iš nuotraukos: prieštaravimas pažymimas kaip OCR | ✅ PASISEKĖ | Prieštaravimas: L-1 modelyje 1,20×1,50, nuotrauka.jpg 1 psl. – 1,50×1,50 (atpažinta OCR – patikrinkite brėžinyje) (nesirenkama automatiškai) |
| O11 | Pasvirusi nuotrauka (perspektyva) ir ranka rašytas tekstas | ⬜ NETESTUOTA | Perspektyvos ištiesinimas neįdiegtas; ranka rašyto teksto Tesseract patikimai neatpažįsta |
| E | Nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |

## Ašys – geometrijos patikra (tests/axes.cjs)

Vektoriniai PDF: ašių tinklelis M 1:100 (1–2–3: 6000, 5000; A–B–C: 4000, 3000), brūkšninės ašys, žymės burbuluose abiejuose galuose, matmenų grandinės (vertikalūs matmenys – pasuktas tekstas). Variantai: teisingas, pamatų planas su matmeniu 5100 vietoj 5000, užrašytas M 1:50 (nubraižyta 1:100), žymės ne iš eilės. Skenas: tas pats lapas kaip paveikslėlis (PNG ir PDF be teksto).

| Nr. | Testas | Rezultatas | Pastaba |
|---|---|---|---|
| A1 | Ašys randamos: linija + žymė burbule abiejuose galuose | ✅ PASISEKĖ | A,B,C / 1,2,3 · brūkšninės: true |
| A2 | Lygiagretumas ir statmenumas | ✅ PASISEKĖ | Ašys A, B, C: lygiagretumas OK didžiausias nuokrypis 0,00°; Ašys 1, 2, 3: lygiagretumas OK didžiausias nuokrypis 0,00°; Ašių kryptys statmenos OK kampas tarp krypčių 90,00° |
| A3 | Tarpai tarp ašių sutampa su matmenimis (horizontalūs ir vertikalūs tekstai) | ✅ PASISEKĖ | A-B 4000 OK, B-C 3000 OK, 1-2 6000 OK, 2-3 5000 OK |
| A4 | Matmenų grandinė: tarpų suma = bendras matmuo | ✅ PASISEKĖ | Matmenų grandinė A–C: tarpų suma 7000 mm, bendras matmuo 7000 mm; Matmenų grandinė 1–3: tarpų suma 11000 mm, bendras matmuo 11000 mm |
| A5 | Mastelis patikrintas pagal ašių matmenis | ✅ PASISEKĖ | Mastelis pagal ašių matmenis OK užrašyta M 1:100, pagal matmenis ≈ 1:100,0 |
| A6 | Žymių eiga nuosekli | ✅ PASISEKĖ |  |
| A7 | Neteisingai užrašytas mastelis aptinkamas | ✅ PASISEKĖ | Mastelis pagal ašių matmenis KLAIDA užrašyta M 1:50, pagal matmenis ≈ 1:100,0 |
| A8 | Žymės ne iš eilės (A, C, B) aptinkamos | ✅ PASISEKĖ | Ašys A, C, B: žymių eiga: žymės ne iš eilės: A → C → B; Ašys 1, 2, 3: žymių eiga: nuoseklios |
| A9 | Matmuo nesutampa su nubraižytu tarpu (5100 / 5000) | ✅ PASISEKĖ | {"k":"2-3","mm":5100,"st":"ĮSPĖJIMAS","c":[5100],"total":false} |
| A10 | Prieštaravimas tarp dokumentų: ašys 2–3 (architektūra 5000, pamatai 5100) | ✅ PASISEKĖ | Prieštaravimas: ašys 2–3 – 5000 mm (ax_arch.pdf 1 psl.), 5000 mm (ax_mastelis.pdf 1 psl.), 5000 mm (ax_eiga.pdf 1 psl.), 5100 mm (ax_pamatai.pdf 1 psl.) – automatiškai nesirenkama |
| A11 | Pamatų agentas tikrina pamatų brėžinio ašis | ✅ PASISEKĖ | Išorės juostų ilgis: sienų C suma ↔ ašių koordinatės (dviguba patikra) OK; Ašys ax_pamatai.pdf 1 psl.: A, B, C / 1, 2, 3 ĮSPĖJIMAS; Ašių tarpai sutampa skirtinguose dokumentuose ĮSPĖJIMAS |
| A12 | Sienos susiejamos su ašimis (centras ašyje – 0 mm) | ✅ PASISEKĖ | Brėžinio kalibracija ↔ ašių matmenys OK A–B: 4000 / 4000 mm; B–C: 3000 / 3000 mm; 1–2: 6000 / 6000 mm; 2–3: 5000 / 5000 mm / Išorės sienų susiejimas su ašimis (ax_arch.pdf 1 psl.) OK S1 → A (centras 0 mm nuo ašies); S2 → 3 (centras 0 mm nuo ašies); S3 → C (centras 0 mm nuo ašies); S4 → 1 (centras 0  |
| A13 | Kalibracija tikrinama pagal ašių matmenis | ✅ PASISEKĖ | Brėžinio kalibracija ↔ ašių matmenys OK A–B: 4000 / 4000 mm; B–C: 3000 / 3000 mm; 1–2: 6000 / 6000 mm; 2–3: 5000 / 5000 mm |
| A14 | Pasislinkusi siena parodoma (S3 už ašies C 100 mm) | ✅ PASISEKĖ | {"wall":"S3","axis":"C","off":0.09983055555555609,"t":0.3} |
| A15 | Ašys nupiešiamos pagrindiniame lange | ✅ PASISEKĖ | nupiešta ašių: 6 |
| A16 | Skenas (paveikslėlis): ašys iš vaizdo linijų, žymės atpažįstamos burbuluose | ✅ PASISEKĖ | {"bub":["C (76 %)","C (77 %)","B (96 %)","B (96 %)","A (95 %)","A (95 %)","1 (96 %)","1 (96 %)","2 (96 %)","3 (96 %)","3 (96 %)"],"fams":["A,B,C","1,2,3"],"spans":["A-B 4000 OK","B-C 3000 OK","1-2 6000 OK","2-3 5000 OK"],"scale":{"declared":0,"est":45.24173984794226},"raster":true,"sc":[["Matmenys t |
| A16b | Skenuotas PDF: ašys, tarpai ir mastelis M 1:100 pagal matmenis | ✅ PASISEKĖ | {"raster":true,"fams":["A,B,C","1,2,3"],"spans":["A-B 4000 OK","B-C 3000 OK","1-2 6000 OK","2-3 5000 OK"],"sc":[["Mastelis pagal ašių matmenis","OK","užrašyta M 1:100, pagal matmenis ≈ 1:99,9"],["Matmenų grandinė A–C","OK","tarpų suma 7000 mm, bendras matmuo 7000 mm"],["Matmenų grandinė 1–3","OK","t |
| A17 | Pasvirusios / kreivos ašys skenuose ir nuotraukose | ⬜ NETESTUOTA | Iš vaizdo randamos tik horizontalios ir vertikalios linijos; pasuktų (> ~0,5°) ar fotografuotų kampu brėžinių ašys neatpažįstamos |
| E | Nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |

## Rostverkai ir poliai (tests/fnd.cjs)

Vektorinis pamatų planas M 1:100: perimetro rostverkas 600 mm ašyse 1, 3, A, C (11 × 7 m), vidiniai 500 mm ašyje 2 ir ašyje B (1–2), nubraižyti bendru kontūru; 9 kvadratiniai poliai 300×300 ašių sankirtose su įstrižainėmis, 2 gręžtiniai Ø400 (Bezier apskritimai); ašių burbulai – taip pat apskritimai. Rankinis atsakymas: ilgis ašimis 49 m, plotas 27,525 m², betonas 13,76 m³, polių ilgis 70 m. Antras variantas: papildomas polis ne rostverke, specifikacijoje 9 polių vietoj 10, R-2 nėra, brėžinys nekalibruotas.

| Nr. | Testas | Rezultatas | Pastaba |
|---|---|---|---|
| F1 | Rostverkai atpažįstami: 6 juostos, plotis 600 ×4 ir 500 ×2 | ✅ PASISEKĖ | [{"w":0.6,"L":7,"clear":6.4},{"w":0.6,"L":11,"clear":9.9},{"w":0.6,"L":11,"clear":9.9},{"w":0.6,"L":7,"clear":5.9},{"w":0.5,"L":6,"clear":5.45},{"w":0.5,"L":7,"clear":5.9}] · užrašytas M 1:100 |
| F2 | Rostverkų ilgis ašimis = 49 m (galai iki susikertančių ašių) | ✅ PASISEKĖ | Σ L = 49.000 m, sankirtų 8 |
| F3 | Poliai: 9 kvadratiniai 0,3 ir 2 apskriti Ø0,4; ašių burbulai neįskaičiuoti | ✅ PASISEKĖ | apvalus 0.4, apvalus 0.4, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3, kvadratinis 0.3 |
| F4 | Rostverkų plotas 27,525 m² ir dviguba patikra (rastras ↔ analitinis) | ✅ PASISEKĖ | Rostverkų plotas: sąjunga (rastras 2 cm) ↔ Σ nubraižyta × plotis + sankirtos (dviguba patikra) OK 27,53 / 27,52 m² |
| F5 | Plotis patikrintas su specifikacija, aukštis iš jos → betono tūris | ✅ PASISEKĖ | betonas 13.763 m³ · brėžinyje 600, 500 mm; specifikacijoje R-1 600×500, R-2 500×500 |
| F6 | Polių skaičius ↔ specifikacija, polių ilgis 9×6 + 2×8 = 70 m | ✅ PASISEKĖ | P-1: brėžinyje 9, specifikacijoje 9; P-2: brėžinyje 2, specifikacijoje 2 · ilgis 70 |
| F7 | Kalibruotas brėžinys: sienos ant rostverkų, objektai patikrinti ir perduoti | ✅ PASISEKĖ | Išorinės sienos ant rostverkų (modelis ↔ pamatų brėžinys) OK visos 4 · 17 obj. patikrinta, didžiausias nuokrypis 0,00 mm · 17 / 17 nupiešta, 17 matoma pikseliuose |
| F8 | Modelio siena ne ant rostverko parodoma | ✅ PASISEKĖ | be rostverko: S1, S3 |
| F9 | Polių skaičiaus prieštaravimas: brėžinyje 10 kv. polių, specifikacijoje 9 | ✅ PASISEKĖ | P-1: brėžinyje 10, specifikacijoje 9; P-2: brėžinyje 2, specifikacijoje 2 |
| F10 | Polis ne rostverke (gal kolona) pažymimas | ✅ PASISEKĖ | 1 polių ne rostverke |
| F11 | Specifikacijoje nesantis rostverko plotis → aukštis nežinomas, tūris neskaičiuojamas | ✅ PASISEKĖ | Rostverko aukštis nežinomas (plotis 500, plotis 500) – įveskite h arba įkelkite specifikaciją „R-1 …×…“ |
| F12 | Nekalibruotas brėžinys: koordinatės brėžinio, sienų palyginimas neatliekamas | ✅ PASISEKĖ | puslapis nekalibruotas (📏) – koordinatės brėžinio, sienų palyginimas neatliekamas |
| F13 | Rostverkai ir poliai skenuotuose brėžiniuose ir nuotraukose | ⬜ NETESTUOTA | Atpažįstama tik vektoriniuose PDF; skenuose (vaizde) rostverkų ir polių nėra ieškoma |
| E | Nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |

## Agentai braižo programos įrankiais (tests/draw.cjs)

1 aukštas – sienos ašyse 11 × 7 m; pamatų planas (kaip aukščiau, kalibruotas); architektūros lapas su žiniaraščiu (L-1 1500x1500, D-1 900x2100), „Monolitinis ziedas 190“, „Perdanga: g/b plokstes 220“. Senojo agento braižymas pakeistas stebėjimo funkcija – tikrinamas tik Planner įsakymas.

| Nr. | Testas | Rezultatas | Pastaba |
|---|---|---|---|
| D1 | Vienas mygtukas „🧠 Agentai“ (be PDF taip pat), ⚙️ – viena vieta, senojo „🤖 Agentas“ mygtuko nebėra | ✅ PASISEKĖ | {"chip":"🧠 Agentai 🍼","vis":"block","oldCell":false,"cells":1} |
| D2 | Mygtukas atidaro viską: Planner, Agentai, Braižytojas, Dokumentai, Kiekiai, Board, Pataisymai | ✅ PASISEKĖ | 📋 Planner · 🧩 Agentai · 🤖 Braižytojas · 📚 Dokumentai (0) · 📊 Kiekiai · 📡 Board · ✎ Pataisymai |
| D3 | Pamatų agentas sukuria aukštą „Pamatai“, buvęs aukštas lieka „1 aukštas“ | ✅ PASISEKĖ | Pamatai / 1 aukštas · „Pamatai“: 4 išorės rostverkai, 2 vidiniai, 11 poliai – rodomi agentų sluoksnyje (pamatai.pdf 1 psl., kalibruotas pamatų lapas) |
| D4 | „Pamatai“ nubraižyti programos sienų įrankiais: 4 išorės rostverkai 11/7 m, plotis 0,6, aukštis 0,5 (iš specifikacijos), be žiedo | ✅ PASISEKĖ | [[11,0.6,0.5,"noring","C"],[7,0.6,0.5,"noring","C"],[11,0.6,0.5,"noring","C"],[7,0.6,0.5,"noring","C"]] · tarpas 2.1929269894979962e-15 |
| D5 | Vidiniai rostverkai – vidinėmis sienomis: 6,4 m ir 5,45 m, plotis 0,5 | ✅ PASISEKĖ | [[6.4,0.5],[5.45,0.5]] |
| D6 | „Pamatai“ sulygiuoti su 1 aukštu (ašių kampai sutampa) | ✅ PASISEKĖ | didžiausias nuokrypis 0.00 mm |
| D7 | Aukščiai: 1 aukšto ±0,00 = pamato viršus, „Pamatai“ – žemiau | ✅ PASISEKĖ | [-0.5,0] |
| D8 | Pamatų agentas skaičiuoja nubraižytus „Pamatai“: plotas 27,525 m², betonas ≈ 13,76 m³ (programos skaičiavimas) | ✅ PASISEKĖ | [["Rostverkų ilgis (išorė – ašimis, vidus – tarp rostverkų)",47.85],["Rostverkų plotas",27.512],["Rostverkų betonas (programos skaičiavimas)",13.763],["Poliai Ø400",2],["Poliai □300",9],["Polių ilgis viso",70]] |
| D9 | „Pamatai“ ↔ pamatų brėžinys: plotas ir vieta sutampa; 1 aukšto sienos ant rostverkų; patikrinta ir perduota | ✅ PASISEKĖ | „Pamatai“ ↔ pamatų brėžinys (pamatai.pdf 1 psl.): rostverkų plotas OK brėžinyje 27,53 m², nubraižyta 27,51 m² / „Pamatai“ sutampa su brėžiniu vietoje (kalibruotas pamatų lapas) OK visi 6 / „Pamatai“ po 1 aukšto išorinėmis sienomis OK visos 4 stovi ant rostverkų · {"ok":true,"same":true,"coord":"17 o |
| D10 | Sienų agentas „Pamatai“ aukšto sienomis nelaiko | ✅ PASISEKĖ | objektų aukštai: 1 |
| D11 | Planner moko braižytoją iš visų dokumentų (L-1 1,5, D-1 2,1, žiedas 0,19) | ✅ PASISEKĖ | Išmokė Planner iš projekto dokumentų: / L1: 1,50 × 1,50 (architektura.pdf 1 psl.) / D1: 0,90 × 2,10 (architektura.pdf 1 psl.) / žiedo aukštis 0,19 (architektura.pdf 1 psl.) |
| D12 | Planner įsako braižytojui braižyti 1 aukštą jūsų atidarytame brėžinyje | ✅ PASISEKĖ | {"fl":1,"pdf":"architektura.pdf","page":1} |
| D13 | Be jūsų pasirinkto brėžinio braižytojas nekviečiamas (piešimo lapą nurodote jūs) | ✅ PASISEKĖ | Brėžinys piešimui nepasirinktas – 📄 PDF: pasirinkite failą ir aukšto plano puslapį (jūs nurodote, ant ko piešti) |
| D14 | Angų agentas įrašo trūkstamus matmenis pagal žymę (L-1 1,5×1,5), D-1 2,2 nekeičia | ✅ PASISEKĖ | [["L-1",1.5,1.5,"L"],["D-1",0.9,2.2,"M"]] · 1 angoms įrašyti matmenys iš žiniaraščio |
| D15 | Sąramų agentas – sąrama angai be jos (iš braižytojo žinių), esamos nekeičia | ✅ PASISEKĖ | 1 angoms pridėta sąrama (iš braižytojo žinių) |
| D16 | Žiedo agentas įrašo žiedo aukštį 0,19 iš dokumentų | ✅ PASISEKĖ | Žiedo aukštis 0,19 m (architektura.pdf 1 psl.) |
| D17 | Perdangų agentas nustato perdangą: g/b plokštės 0,22 | ✅ PASISEKĖ | 1 perdangos (architektura.pdf 1 psl.: Perdanga: g/b plokstes 220) · {"type":"pre","pt":0.22} |
| D18 | Agentų pakeitimus galima atšaukti ↶ | ✅ PASISEKĖ | {"n":9,"after":8} |
| D19 | Kiekvienas agento veiksmas programoje registruojamas Board (ACTION) | ✅ PASISEKĖ | {"fnd":5,"open":1,"lint":1,"ring":1,"slab":1} |
| D20 | Be pamatų brėžinio: „Pamatai“ – juostos po 1 aukšto sienų ašimis (b 0,5 × h 0,4) | ✅ PASISEKĖ | „Pamatai“: 4 išorės rostverkai, 0 vidiniai (pagal 1 aukštas laikančias sienas, b × h = 0,500 × 0,400 m (vartotojas)) · [[8.6,0.5,0.4],[5.6,0.5,0.4],[8.6,0.5,0.4],[5.6,0.5,0.4]] |
| D21 | Braižytojas (senasis agentas) piešia tikrame architektūros brėžinyje | ⬜ NETESTUOTA | Testuota tik įsakymo perdavimas (agentRun pakeistas stebėjimo funkcija); jo braižymas spalvotame PDF – kaip anksčiau, netestuotas šiame teste |
| E | Nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |
