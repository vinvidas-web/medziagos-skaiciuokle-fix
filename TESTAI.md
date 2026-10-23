# KONTŪRAS – agentų sistemos bandymų rezultatai

Data: 2026-10-23 · Aplinka: Chromium (Playwright), telefono ekranas 412×860 · Failas: `kontura.html`

Paleidimas: `NODE_PATH=$(npm root -g) node tests/agents.cjs` ir `node tests/ocr.cjs` (reikia `playwright`).

**Iš viso – PASISEKĖ: 43 · NEPAVYKO: 0 · NETESTUOTA: 4**

> Bandyta su testui sugeneruotais PDF ir vaizdais bei programos pavyzdžiais (📐 pavyzdys, 🏢 5 aukštų). OCR laikai – kompiuterio Chromium; telefone bus lėčiau. **Su tikrais statybiniais brėžiniais netestuota.**

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
| 11 | Nustatomos ir tikrinamos pastato ašys | ⬜ NETESTUOTA | Ašių žymių kandidatai išrenkami iš teksto (A B 1 2), bet ašių linijų geometrija ir jų tarpusavio padėtis netikrinama |
| 12 | Tikrinamas mastelis | ⬜ NETESTUOTA | Mastelis M 1:100 perskaitomas iš teksto (kalibracija – esama 📏 funkcija); automatinis mastelio patikrinimas pagal matmenų grandinę neįgyvendintas |
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
| 21 | Projektas išsaugomas | ✅ PASISEKĖ | {"pid":"prj_mvlewhxu7qvua","h":"1mia3em","docs":4,"saved":true,"log":174} |
| 22 | Projektas atkuriamas (rezultatai, dokumentai, indeksas, Board istorija) | ✅ PASISEKĖ | {"pid":"prj_mvlewhxu7qvua","h":"1mia3em","docs":4,"idx":5,"log":174,"st":"COMPLETED"} |
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
| O8 | Nuotrauka (pasukta 2°, triukšmas): žymės ir dydžiai | ✅ PASISEKĖ | žymės L-1,D-1 · dydžiai 1500x1500,900x2100 · M 1:50 · 88 % · 11 s |
| O9 | Nuotrauka priskiriama projektui pagal OCR adresą | ✅ PASISEKĖ | AUTO · Senolių g. 32 |
| O10 | Žiniaraštis iš nuotraukos: prieštaravimas pažymimas kaip OCR | ✅ PASISEKĖ | Prieštaravimas: L-1 modelyje 1,20×1,50, nuotrauka.jpg 1 psl. – 1,50×1,50 (atpažinta OCR – patikrinkite brėžinyje) (nesirenkama automatiškai) |
| O11 | Pasvirusi nuotrauka (perspektyva) ir ranka rašytas tekstas | ⬜ NETESTUOTA | Perspektyvos ištiesinimas neįdiegtas; ranka rašyto teksto Tesseract patikimai neatpažįsta |
| E | Nebuvo JavaScript klaidų | ✅ PASISEKĖ |  |
