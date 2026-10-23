# KONTŪRAS – agentų sistema (6 specialistai + Planner)

Šis dokumentas aprašo, kas iš specifikacijos „KONTŪRAS – agentų architektūra V2/V3“ **realiai įgyvendinta** faile `kontura.html`, kas **neįgyvendinta**, ir kaip sistema sujungta su esama programa. Patikrinimų rezultatai yra faile [TESTAI.md](TESTAI.md).

## 1 fazė – esamos programos analizė

`kontura.html` (≈7 100 eilučių, vienas failas, veikia be interneto) jau turėjo:

| Modulis | Kas daro |
|---|---|
| `Geo` | kontūro geometrija: centro / išorės / vidaus ilgiai, kampai, plotai |
| `XL` + `Bridge` | Excel v32 lapo „alytus bendra“ skaičiavimo variklis: sienos, angos, sąramos, žiedas, kiekiai, patikros |
| Aukštai, perdangos | `project.floors`, `slabCfg` / `slabCalc` (monolitinė, plokštės, medinė) |
| PDF / nuotrauka | pdf.js įdėtas į failą; vienas PDF vienu metu, mastelis, kalibracija, linijų „prilipimas“, angų žiniaraštis, IndexedDB `kontura_pdf` |
| 🤖 Agentas (senas) | mokymasis iš vartotojo veiksmų ir jų kartojimas ant PDF |
| Išsaugojimas | `localStorage`, `.kontura.json`, Excel, PDF ataskaita |

Nebuvo: kelių PDF viename projekte, bendro dokumentų indekso, agentų architektūros, Board, Planner, pamatų skaičiavimo.

**Sprendimas:** programa neperrašyta. Pridėtas vienas naujas modulis `KS` (faile pažymėtas antrašte „AGENTŲ SISTEMA (KS)“, prieš „PALEIDIMAS“) ir 7 nedideli prijungimai prie esamo kodo:

1. `fixProject` – išsaugo ir išvalo `project.ks` (kitaip įkeliant failą agentų duomenys dingtų);
2. `draw` – agentų rezultatų sluoksnis plane;
3. `pdfLoadFile` – per esamą 📄 PDF atidarytas failas užregistruojamas projekto dokumentuose;
4. ⚙️ nustatymai – nauja eilutė: 🧠 Agentai, 📚 dokumentai, 📊 kiekiai, 📡 Board;
5. 📄 PDF meniu – mygtukas „📚 Visi projekto dokumentai“;
6. ❓ pagalba – trumpas aprašas;
7. paleidimas – `KS.init()`.

Senas 🤖 Agentas ir visos kitos funkcijos paliktos kaip buvo.

## Struktūra

```
Vartotojas → Planner → Agentai          (užduotys TASK)
             Agentai ↔ Board            (publish / query / report)
             Agentai → Planner → patikra → taisymas (CORRECTION_REQUEST) arba perdavimas
             Planner → project.ks.results → pagrindinis langas → patikra → išsaugojimas
```

| Dalis | Kur | Kas įgyvendinta |
|---|---|---|
| **Kit** | `KS.Kit` | atstumai, kampai, ilgiai, plotai, PDF ⇄ statinio koordinatės (ta pati `P2W`/`W2P`), matmenų / altitudžių / mastelio skaitymas, puslapio laukų analizė, dokumento parašas. Sprendimų nepriima. |
| **Board** | `KS.Board` | `publish()` – tik į savo sritį (`agentas.result`), kitaip ERROR ir atmetama; versijos ir maiša; `query()` – grąžina kopiją; įrašai užšaldyti (`Object.freeze`); `report()` → Planner; pranešimų žurnalas su §11 laukais; konfliktai (tas pats objektas – du agentai); išsaugoma IndexedDB `kontura_ks/board`. |
| **Agent** | `KS.Agent` | būsenos IDLE / WORKING / NEEDS_DATA / NEEDS_REVIEW / COMPLETED / FAILED; `receiveTask, analyze, validate, publish, report, requestCorrection, saveState, restoreState`; klaida viename agente sugaunama ir kitų neliečia. |
| **6 agentai** | `KS.AG` | žr. žemiau |
| **Planner** | `KS.Planner` | planas su priklausomybėmis (pvz. tik pamatams → Sienų + Pamatų), užduotys, tarpusavio patikra, grąžinimas taisyti, perdavimas į projektą ir jo patikra, pakartotinės patikros žymėjimas. Specialistų reikšmių nekeičia. |
| **Dokumentai** | `KS.Docs` | keli PDF / nuotraukos; visi puslapiai indeksuojami; priklausomybės projektui tikrinimas; redakcijų pakeitimai; failai ir indeksas IndexedDB. |
| **OCR** | `KS.OCR` | skenuoti PDF puslapiai (be teksto sluoksnio) ir nuotraukos atpažįstami Tesseract (žr. žemiau). |

### Šeši agentai

Visi agentai naudoja tą patį projekto modelį (visi aukštai) ir **visų priskirtų dokumentų visų puslapių** indeksą.

| Agentas | Skaito iš Board | Ką skaičiuoja | Dviguba patikra |
|---|---|---|---|
| 🧱 Sienų | – | išorinės / vidinės sienos: koordinatės, C/L/V ilgiai, storis, plotas, grynas plotas, tūris; kiekiai pagal aukštus | centro ilgis pagal formulę ↔ pagal koordinates; ilgiai ↔ brėžinio matmenys (kai PDF kalibruotas) |
| 🏗️ Pamatų | Sienų | pamatų juostos po išorinėmis ir laikančiomis (pažymėtomis arba ≥ 0,20 m) sienomis; vidinės juostos trumpinamos per (b − t)/2 ties išorės juostomis; tūris | Σ sienų C ↔ ašių koordinatės. **Skerspjūvį patvirtina vartotojas** – dokumentuose rasti „600x400“ rodomi tik kaip kandidatai su šaltiniu |
| 🪟 Angų | Sienų | langai, durys, angos: padėtis sienoje (tas pats rėmas kaip plane), plotai, kiekiai | w×h×kiekis ↔ skaičiuoklė; žymė ↔ žiniaraštis **visuose** dokumentuose (nesutapimas = prieštaravimas, automatiškai nesirenkama) |
| 🧱 Sąramų | Angų | tipas (liejama / surenkama), ilgis = anga + atramos, skerspjūvis, tūris | ilgis ↔ skaičiuoklė; atramų ilgis |
| 🌀 Žiedo | Sienų, Sąramų | trasos, ilgiai, skerspjūvis, tūris | skaičiuoklės ilgis ↔ sienų geometrija |
| 🟫 Perdangų | Sienų | perdangos tarp aukštų: plokštės / sijos / monolitas, plotai, kiekiai, laikančios sienos | plotas ↔ elementų daugiakampiai |

### Objektų būsenos ir užbaigimas

- Objektas: `id, type, coords (statinio m), dims, src (dokumentas, puslapis arba projekto modelis), agent, conf, status, ver, calc (skaičiavimo eiga)`.
- `PROPOSED` → `VERIFIED` (agentas, jei patikros praeitos) → `APPROVED` (**tik vartotojas**, užrašoma kas ir kada).
- Pakeitus projektą, patvirtinti objektai neperrašomi: paliekama patvirtinta versija, nauja laukia sprendimo (`APPROVAL_REQUEST`).
- Agento užduotis **UŽBAIGTA** tik kai: agentas COMPLETED + į projektą įrašyta tai, kas Board + koordinatės sutampa su pagrindinio lango geometrija (perskaičiuota iš naujo) + objektai nupiešiami (tikrinami pikseliai) + projektas išsaugotas ir perskaitytas iš telefono atminties.

### Vartotojo sąsaja (⚙️ → 🧠 Agentai)

📋 Planner · 🤖 Agentai (užduotis, eiga, objektai, neatitikimai, patikros, „✔ Patvirtinti“) · 📚 Dokumentai (įkėlimas, puslapių laukai, priklausomybė, redakcijos) · 📊 Kiekiai (pagal aukštus, CSV → Excel su kilme, JSON atsarginė kopija) · 📡 Board (pranešimai, užklausos, versijos, konfliktai) · ✎ Pataisymai (istorija, ankstesnių versijų atkūrimas).
Paspaudus objektą – **kilmė**: šaltinis, matmenys, skaičiavimo eiga, koordinatės, „📍 Rodyti plane“, „📄 Atidaryti brėžinį“ (tas puslapis), „✎ Pataisyti“.

### OCR (skenuoti PDF ir nuotraukos)

- **Variklis:** tesseract.js 7.0.0 + tesseract.js-core 7.0.0 (WebAssembly SIMD, LSTM) + lietuvių kalbos modelis `lit` 4.0.0_best_int (Apache-2.0). Įdėta į `kontura.html` (gzip + base64, kaip pdf.js) – **veikia be interneto**; išskleidžiama tik pirmą kartą prireikus OCR. Failas padidėjo nuo ≈1,9 MB iki ≈6,4 MB. Įdėjimo skriptas: `tools/ideti_ocr.py`.
- **Kada:** PDF puslapis, kuriame < 3 teksto elementai, ir kiekviena nuotrauka – automatiškai pridedant prie projekto dokumentų (ir atidarant per 📄 PDF). Mygtukas „🔤 OCR“ – atpažinti visą dokumentą iš naujo. OCR galima išjungti; kokybė: greitas (~3200 px) arba tikslus (~6000 px, plytelėmis po 2400 px).
- **Kaip:** puslapis atvaizduojamas į drobę, atpažįstama du kartus – horizontalus ir 90° pasuktas tekstas (vertikalūs matmenys); žodžių koordinatės perskaičiuojamos į tuos pačius PDF taškus, kuriuos naudoja pagrindinis langas; naudojamos Tesseract eilutės (tinka ir pasvirusiai nuotraukai).
- **Patikimumas:** kiekvienas žodis turi patikimumą. Žodžiai < 60 % (pasuktiems < 75 %) laukams nenaudojami – rodomi kaip „neaiškūs“. Skaičiuose taisoma O→0, l/I→1. Iš OCR gauti duomenys pažymimi „OCR“ (pvz. pamatų skerspjūvio pasiūlymas, žiniaraščio prieštaravimas) ir lieka tik pasiūlymai.
- **Pagrindinis langas:** skenuoto puslapio ar nuotraukos OCR žodžiai naudojami kaip tekstas – randamas mastelis „M 1:100“, veikia ilgių patikra pagal matmenis ir angų žymės.

### Ašių geometrijos patikra

Ašių atpažinimas – Kit funkcijos (`Kit.findAxes`, `Kit.checkAxes`, skenams `Kit.rasterLines`); rezultatus naudoja Sienų agentas (visi dokumentai, susiejimas su sienomis) ir Pamatų agentas (pamatų brėžinių ašys). Naujas agentas nekurtas.

| Žingsnis | Kaip |
|---|---|
| Ašies linija | PDF vektorių atkarpos grupuojamos į tieses (kryptis ±0,2°, poslinkis ±0,9 pt); brūkšninė linija = daug atkarpų vienoje tiesėje. Skene / nuotraukoje – ilgos horizontalios ir vertikalios tamsių pikselių eilės. |
| Žymė | Tekstas `A`…`Ž`, `1`…`99` (taip pat `A'`, `1/2`) linijos tęsinyje už jos galo (burbule). Skene kiekvienas burbulas iškerpamas be apskritimo ir atpažįstamas OCR kaip vienas simbolis. |
| Šeimos | Lygiagrečios ašys (±1°) – viena kryptis; žymės išrikiuojamos didėjančia tvarka. |
| Patikros | lygiagretumas, krypčių statmenumas; žymių eiga (iš eilės, be pasikartojimų, nemaišant raidžių ir skaičių); tarpas tarp gretimų ašių ↔ matmens tekstas tarp jų (taip pat pasuktas); matmenų grandinė: tarpų suma = bendras matmuo; mastelis: užrašytas „M 1:N“ ↔ pagal ašių matmenis (nuotraukoje – tik santykinis nuoseklumas, nes popieriaus dydis nežinomas). Matmens tekstas svarbesnis už nubraižytą atstumą – nesutapimas rodomas, automatiškai nerenkamas. |
| Tarp dokumentų | tos pačios ašių poros (pvz. 2–3) tarpai visuose projekto lapuose; skirtumas > 10 mm → prieštaravimas su visais šaltiniais. |
| Su modeliu | kai atidarytas brėžinys kalibruotas (📏): kalibracija ↔ ašių matmenys; kiekvienai išorės sienai – artimiausia lygiagreti ašis ir sienos centro atstumas iki jos (mm). Ašys nupiešiamos plane (žymės, tarpai ✔ / ⚠). |

### Rostverkai ir poliai iš pamatų brėžinio

Vykdoma vektoriniams PDF puslapiams, kurių turinys atpažintas kaip „pamatai“ (pamat…, rostverk…, poli…), kai žinomas mastelis (užrašytas arba pagal ašių matmenis). Rezultatus naudoja Pamatų agentas.

| Kas | Kaip |
|---|---|
| Rostverkas | Juosta tarp dviejų gretimų lygiagrečių ištisinių linijų (ilgis ≥ 1,2 m, plotis 0,25–1,5 m realiai). Nutrūkusios ties sankirtomis dalys sujungiamos; galai pratęsiami iki susikertančio rostverko ašies (ilgis ašimis) ir jo tolimojo krašto (plotui). Brūkšninės ašys atkrenta, nes susideda iš trumpų brūkšnių. |
| Plotas | Juostų sąjunga rastru (2 cm, kraštų pikseliai – dalimis), sankirtos skaičiuojamos vieną kartą; dviguba patikra: Σ nubraižytas ilgis × plotis + neuždengtos sankirtos. |
| Polis | Mažas uždaras kontūras 0,15–0,8 m, beveik kvadratinis (□) arba su kreivėmis (Ø), be teksto viduje (taip atmetami ašių burbulai ir žymės); dubliai (keli kontūrai vienoje vietoje) – vienas polis. Tikrinama, ar polis rostverko juostoje. |
| Specifikacija | Visų projekto puslapių eilutės: `R-1 … 600x500` (plotis × aukštis), `P-1 … 300x300 L=6000 9 vnt`, `P-2 … Ø400 L=8000 2 vnt`. Plotis brėžinyje ↔ specifikacija → aukštis ir tūris; polių skaičius brėžinyje ↔ specifikacija (nesutapimas – prieštaravimas, nesirenkama); polių ilgis iš specifikacijos. Be specifikacijos aukštis ir polių ilgis neišgalvojami – prašoma įvesti. |
| Koordinatės | Kalibruotas puslapis (📏) → statinio koordinatės ir patikra, ar modelio išorinės sienos stovi ant rostverkų; nekalibruotas → brėžinio koordinatės (metrais), palyginimas su sienomis neatliekamas. |

Jei pamatų brėžinyje rostverkų / polių rasta, Pamatų agentas kiekius skaičiuoja iš brėžinio, o juostų po sienomis neskelbia (kad nebūtų dvigubai). Jei nerasta – veikia kaip anksčiau (juostos po laikančiomis sienomis).

### Saugojimas

| Kas | Kur |
|---|---|
| Rezultatai, dokumentų sąrašas, patvirtinimai, pataisymai, 10 ankstesnių versijų | `project.ks` (kartu su projektu: `localStorage` ir 💾 `.kontura.json`) |
| PDF failai, puslapių indeksas, Board istorija | IndexedDB `kontura_ks` |
| Ankstesni patvirtinti pavyzdžiai (tik informacijai kitiems projektams) | `localStorage` `kontura_ks_examples` |

## Kas NEĮGYVENDINTA (sąžiningai)

| Specifikacijos reikalavimas | Būsena |
|---|---|
| Skenuotų PDF ir nuotraukų teksto atpažinimas | **Įgyvendinta (OCR).** Netestuota su tikrais skenais. Neįdiegta: perspektyvos ištiesinimas kampu fotografuotoms nuotraukoms, ranka rašytas tekstas, OCR telefonuose be WebAssembly SIMD (labai seni). |
| Linijų atpažinimas iš vaizdo (skenuose) | Tik ilgos horizontalios / vertikalios linijos ašims; sienų kontūrų iš skeno vaizdo neatpažįstama. |
| Ašių geometrijos nustatymas ir tikrinimas | **Įgyvendinta** (žr. „Ašių geometrijos patikra“). Neįgyvendinta: pasuktos ar kreivos ašys skenuose ir nuotraukose (iš vaizdo – tik horizontalios / vertikalios), lenktos (radialinės) ašys, ašys be burbulų. Netestuota su tikrais brėžiniais. |
| Automatinis mastelio patikrinimas pagal matmenų grandinę | **Įgyvendinta** ašių matmenims (užrašytas mastelis ↔ ašių tarpų matmenys). |
| Pamatų / rostverkų geometrijos atpažinimas iš brėžinio | **Įgyvendinta vektoriniams PDF** (žr. „Rostverkai ir poliai“). Neįgyvendinta: skenuoti brėžiniai ir nuotraukos, įstriži / lenkti rostverkai su kintamu pločiu, poliai, nubraižyti tik linijomis be uždaro kontūro, polių grupės po kolonomis (atskiri pamatai). Netestuota su tikrais brėžiniais. |
| Pjūvių altitudžių susiejimas su elementais (§25) | Altitudės surenkamos ir rodomos kaip informacija; aukščiai – iš esamo modelio. |
| Taisymas tiesiai brėžinyje pirštu (§30) | Pataisos įvedamos objekto lange; sienų ir angų geometrija – kaip anksčiau, pagrindiniame lange. |
| Tikras DI modelio mokymas | Ne. Saugomi patvirtinti pavyzdžiai, bendros taisyklės automatiškai nekeičiamos. |
| Eksportas į .xlsx / PDF kiekių suvestinei | CSV (atsidaro Excel) ir JSON. Esama Excel ir PDF ataskaita nepakeista. |
| Testai su tikrais statybiniais brėžiniais | **Neatlikta** – tik su sugeneruotais PDF ir programos pavyzdžiais. |

Kontūrų atpažinimas nėra konstrukcinio saugumo patvirtinimas. Įkeltų dokumentų tekstas laikomas duomenimis ir niekada nevykdomas.
