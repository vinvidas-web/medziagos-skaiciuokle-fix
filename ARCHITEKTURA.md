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

### Saugojimas

| Kas | Kur |
|---|---|
| Rezultatai, dokumentų sąrašas, patvirtinimai, pataisymai, 10 ankstesnių versijų | `project.ks` (kartu su projektu: `localStorage` ir 💾 `.kontura.json`) |
| PDF failai, puslapių indeksas, Board istorija | IndexedDB `kontura_ks` |
| Ankstesni patvirtinti pavyzdžiai (tik informacijai kitiems projektams) | `localStorage` `kontura_ks_examples` |

## Kas NEĮGYVENDINTA (sąžiningai)

| Specifikacijos reikalavimas | Būsena |
|---|---|
| Skenuotų PDF ir nuotraukų turinio atpažinimas (OCR, linijų / ašių atpažinimas iš vaizdo) | **Neįgyvendinta.** Tokie puslapiai priimami, rodomi ir pažymimi „neperskaityta“. |
| Ašių geometrijos nustatymas ir tikrinimas | Tik ašių žymių kandidatai iš teksto. |
| Automatinis mastelio patikrinimas pagal matmenų grandinę | Mastelis skaitomas iš teksto „M 1:100“; kalibracija – esama 📏 funkcija. |
| Pamatų / rostverkų geometrijos atpažinimas iš brėžinio | Juostos išvedamos iš sienų; skerspjūvį tvirtina vartotojas. Rostverkų (ne po sienomis) ir polių nėra. |
| Pjūvių altitudžių susiejimas su elementais (§25) | Altitudės surenkamos ir rodomos kaip informacija; aukščiai – iš esamo modelio. |
| Taisymas tiesiai brėžinyje pirštu (§30) | Pataisos įvedamos objekto lange; sienų ir angų geometrija – kaip anksčiau, pagrindiniame lange. |
| Tikras DI modelio mokymas | Ne. Saugomi patvirtinti pavyzdžiai, bendros taisyklės automatiškai nekeičiamos. |
| Eksportas į .xlsx / PDF kiekių suvestinei | CSV (atsidaro Excel) ir JSON. Esama Excel ir PDF ataskaita nepakeista. |
| Testai su tikrais statybiniais brėžiniais | **Neatlikta** – tik su sugeneruotais PDF ir programos pavyzdžiais. |

Kontūrų atpažinimas nėra konstrukcinio saugumo patvirtinimas. Įkeltų dokumentų tekstas laikomas duomenimis ir niekada nevykdomas.
