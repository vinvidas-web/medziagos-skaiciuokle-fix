# KONTŪRAS – programos analizė

Kaip veikia esama programa (`kontura.html`) ir kaip prie jos prijungti agentai. Analizė daryta iš kodo, ne iš aprašymų.

## 1. Mechaninė dalis – skaičiuotuvas sienoms braižyti

Programa – ne „piešimo“, o **skaičiavimo** įrankis: kiekvienas elementas įvedamas skaičiais, o vaizdas, 3D ir kiekiai išvedami iš jų.

| Elementas | Kaip įvedamas (įrankis) | Kaip saugomas (`project`) | Kas skaičiuoja |
|---|---|---|---|
| **Išorės kontūras** | ✏️ skaičiuotuvas: ilgis + kryptis (→ ↑ ↖ …, ∠ kampas), „Išorė / Centras / Vidus“, storis `t`, aukštis `h`; ⟲ uždaro | `walls[]`: `{ len, dir, mode L/C/V, t, h, hMode, btype, ringH… }`, `closed` | `Geo.compute` – centro / išorės / vidaus taškai ir ilgiai, kampų poslinkiai (kaip Excel „alytus bendra“). Kontūras visada prasideda taške (0, 0). |
| **Vidinės sienos (pertvaros)** | „＋ Vidinės“: bakstelėti sieną → atstumas `M` → ✓; arba PDF: bakstelėti pertvarą | `inner[]`: `{ L (lygiagreti išorės siena), M, t, af (ilgis: V – iki sienų arba skaičius), no (vieta) … }` | Excel variklis (`XL`, `Bridge`): vidinis kontūras, sienos ilgis, plotas, tūris |
| **Angos** | bakstelėti sieną → ＋ anga; arba PDF (2 kraštai / 1 bakstelėjimas / „Rasti visas angas“) | `openings[]`: `{ wk o/i, wi, kind L/D/K, mark, w, h, q, pos, sill … }` | `layoutOpenings` – vieta sienoje; kiekiai – Excel variklis |
| **Sąramos** | angos lange: „liejama / surenkama“, atramos `ll`, `lr`, aukštis `lh` | tie patys `openings[]` laukai `lt, ll, lr, lh` | ilgis = anga + atramos, tūris, patikros (atramos ≥ 0,10 / 0,15) |
| **Žiedas** | sienos tipas „su žiedu / be žiedo / tik žiedas“, žiedo aukštis (⚙️ arba sienai), plotis | `btype`, `ringH`, `ringW` sienoje; `settings.ringH` | žiedo ilgis ir tūris, kampai |
| **Aukštai** | 🏢 → „+ Pridėti aukštą“ (nukopijuoja viršutinį) | `floors[]` (kiti aukštai), `fl` – rodomas aukštas; jo duomenys – viršuje `project` | `floorBases` – kiekvieno aukšto ±0,00 |
| **Perdangos** | 🏢 → 🧱 tarp aukštų: monolitinė / plokštės / medinė; laikančios sienos | `floors[k].sl`, sienų `bear` | `slabCalc` – plokščių / sijų išdėstymas ir kiekiai |
| **PDF / nuotrauka** | 📄 PDF: jūs pasirenkate failą ir puslapį kiekvienam aukštui; 📏 mastelis; 🎯 sulygiavimas | `pdfu` (mastelis, sulygiavimas kiekvienam puslapiui, aukštas → puslapis) | pdf.js įdėtas į failą; linijos prilipimui, spalvoti plotai, tekstai, angų žiniaraštis |

Visi pakeitimai eina per `snapshot()` (↶ atšaukti) ir `changed()` (perskaičiavimas, išsaugojimas, perpiešimas).

## 2. Senasis agentas (🤖) – braižytojas

Rastas kode (`agentRun`, `agentReplay`, `agentApplyGen`, `agentUnderstand`, pamokos `kontura_agentas_v1`):

- **Braižo programos įrankiais, matomu pirštu 👆**: atsiverčia jūsų PDF puslapį, bakstelėja išorinį mūro kampą → automatinis kontūras, pertvaras – „vienu bakstelėjimu“, angas – „Rasti visas angas“, aukščius – pagal žymę.
- **Mokosi**: „🎓 Mokykis“ įrašo kiekvieną jūsų veiksmą; po „▶ Daryk“ stebi jūsų pataisymus (👀 → „✔ Išmokti“); pokalbyje supranta „L-1 aukštis 1,5“, „durys 2,1“, „daryk“, „ką moki?“.
- **Pamokos** – taisyklės (`rules`: aukščiai, žiedas, sąramos, žymės, spalvos, sienų savybės), susietos su projektuotoju; turi pradinę pamoką iš Senolių g. 32 brėžinių.
- Dirba **tik su vienu – jūsų atidarytu – brėžiniu**.

## 3. Kaip prijungti agentai (šis pakeitimas)

| Jūsų reikalavimas | Kaip padaryta |
|---|---|
| Pirmas aukštas – **Pamatai**, juos turi nubraižyti agentas; buvęs pirmas tampa „1 aukštas“ | 🏗️ Pamatų agentas sukuria aukštą „Pamatai“ aukštų sąrašo pradžioje (buvę aukštai pasislenka, „1 aukštas“ lieka „1 aukštas“, PDF puslapiai aukštams – kartu). Rostverkus nubraižo **tais pačiais sienų įrankiais**: išorės rostverkai – uždaras kontūras per ašis (plotis = sienos storis, aukštis = rostverko aukštis, „be žiedo“), vidiniai – vidinės sienos. Iš pamatų brėžinio (rostverkai, specifikacija „R-1 600x500“) arba, jei jo nėra, po 1 aukšto laikančiomis sienomis pagal jūsų įvestą b × h. 1 aukšto ±0,00 = pamato viršus; „Pamatai“ – žemiau. Kiekius skaičiuoja programos variklis, kaip sienoms. |
| Kiekvienas agentas prijungtas prie **programos įrankių**, kad galėtų braižyti | `KS.Tools`: aukštai, kontūras, vidinės sienos (bendras įrankis `addInnerAt` – tas pats, kurį naudoja PDF pertvaros), sienų / angų / sąramų / žiedo / perdangų savybės. Kiekvienas veiksmas – su ↶ ir užrašomas Board (ACTION). Kiekvienas agentas turi „✏️ Braižyti“. |
| **Senajam agentui Planner įsakinėja, kaip piešti, ir jį moko** | Senasis agentas tapo **braižytoju**: Planner jį **moko** tuo, ką specialistai rado visuose projekto dokumentuose (angų dydžiai pagal žymę, žiedo aukštis) – pamoka „Išmokė Planner“, ir **įsako** nubraižyti aukštą (`agentRun`) jūsų pasirinktame brėžinyje. Jo mokymasis iš jūsų pataisymų, pokalbis, pamokos – nepakeisti. |
| Kitos mechaninės funkcijos lieka | Skaičiuotuvas, PDF įrankiai, Excel, ataskaitos, 3D, aukštai – nepakeisti (pataisyti tik aukštų pavadinimai / numeriai, kai yra „Pamatai“). |
| PDF įkėlimas – mano; aš nurodau, ant kokio brėžinio piešti | 📄 PDF liko jūsų: jūs pasirenkate failą ir puslapį. Braižytojas piešia tik ant jo; jei nepasirinkta – Planner jo nekviečia ir parašo kodėl. |
| Agentams – galimybė įkelti tų pačių PDF, nes projektas ne iš vieno lapo | 🧠 → 📚 Dokumentai: keli PDF / nuotraukos, visi puslapiai. Jūsų atidarytas PDF įtraukiamas automatiškai. |
| Visi agentai ir kas su jais susiję – **po vienu mygtuku** | Vienas mygtukas **🧠 Agentai** (matomas visada). Jame: 📋 Planner (✏️ Braižyti, ▶ Tikrinti), 🧩 6 agentai, 🤖 Braižytojas (senasis agentas: Daryk, Mokykis, Pokalbis, Pamokos, Planner moko), 📚 Dokumentai, 📊 Kiekiai, 📡 Board, ✎ Pataisymai. Senojo agento mygtukas, ⚙️ dubliai ir agentų mygtukai PDF meniu pašalinti (⚙️ liko viena nuoroda). Kai braižytojas mokosi / stebi, tas pats mygtukas rodo „⏺ … ✔ Baigti“ / „👀 … ✔ Išmokti“. |

## 3a. Ką mato agentai ir ant kokio lapo piešia

- **👁 Mato** – prie kiekvieno agento: „Mato N iš M PDF“, kiekvieno PDF pavadinimas, puslapių skaičius ir agentui aktualūs puslapiai; ko nemato – pavadinimas, priežastis ir mygtukas „rodyti agentams“. Planner lange – žymos „🏗️ 3/3 PDF“ visiems 6. Analizės eigoje agentas užrašo, ką matė.
- **Visi PDF – visiems agentams**: kiekvienas agentas mato visus projekto PDF; jūsų atidarytas 📄 PDF priskiriamas projektui automatiškai (tai jūsų sprendimas), net jei adresas kitas.
- **🎯 Lapas** – atskiras mygtukas (ne 🧠): kiekvienam aukštui („Pamatai“, 1 aukštas, …) pasirenkate PDF ir konkretų puslapį (su paveikslėliais). Braižytojas piešia aukštą ant to lapo, Pamatų agentas – „Pamatai“ ant savo lapo. Iš aukštų susidaro 3D.

## 4. Kas ką braižo (Planner „✏️ Braižyti“)

1. 🏗️ **Pamatų agentas** – aukštas „Pamatai“ (rostverkai); poliai rodomi agentų sluoksnyje (programoje polio elemento nėra).
2. 🧱 **Sienų agentas** – per braižytoją: Planner jį išmoko ir liepia nubraižyti 1 aukštą jūsų brėžinyje (jei aukštas tuščias).
3. 🪟 **Angų agentas** – trūkstami angų matmenys pagal žymę iš žiniaraščio (bet kuriame dokumente).
4. 🧱 **Sąramų agentas** – sąrama angoms be jos (iš braižytojo žinių).
5. 🌀 **Žiedo agentas** – žiedo aukštis, jei neįvestas (iš dokumentų arba braižytojo žinių).
6. 🟫 **Perdangų agentas** – nenurodytos perdangos tipas ir storis iš dokumentų.

Agentai **nekeičia jūsų įvestų reikšmių** – pildo tik trūkstamas; nesutapimus rodo kaip prieštaravimus. Po braižymo Planner viską patikrina (▶ Tikrinti).

## 5. Žinomi apribojimai

- Braižytojo braižymas tikrame spalvotame architektūros PDF šiame pakeitime atskirai nebandytas (veikia kaip anksčiau; testuotas tik Planner įsakymo perdavimas).
- „Pamatai“ sulygiuojami su 1 aukštu, kai pamatų lapas kalibruotas (📏 / 🎯) arba abiejuose brėžiniuose yra tos pačios ašys; kitaip – nesulygiuota (parašoma).
- Poliai – tik agentų sluoksnyje ir kiekiuose; atskirų pamatų po kolonomis nėra.
- Rostverkų aukštis neišgalvojamas: be specifikacijos ar jūsų įvesto h „Pamatai“ nubraižomi be aukščio, tūris neskaičiuojamas.
