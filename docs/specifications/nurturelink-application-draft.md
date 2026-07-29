# NurtureLink — Application Draft

*AI for Nurturing Care Hackathon · UNICEF StartUp Lab (KOICA / MEST).*

---

## 1. Team profile

| # | Name | Role | Based in | Background | Key skills |
| --- | --- | --- | --- | --- | --- |
| 1 | Yakubu Lute | Technical lead | Kumasi / Accra, Ghana | Senior Full-Stack Engineer at Amalitech; Frontend Lead at mPedigree Network (health-tech, pharmaceutical verification); 7+ years production software (mobile, web, backend); born Tumu, Upper West Region | React Native/Expo, offline-first architecture, AI integration, TypeScript, WCAG 2.1 |
| 2 | Leticia Offeibea | Health & nutrition domain | Ghana | BSc Health Information Management; Research Assistant on Social Determinants of Health; USAID Ghana National Malaria Elimination Programme field experience at community level | Health information systems, IYCF clinical thresholds, community health programme operations, population health analytics |

**UNICEF criteria:**

- Female member: Leticia Offeibea
- Technology expertise: Yakubu Lute — 7+ years full-stack, mobile, AI
- Health/nutrition domain: Leticia Offeibea — HIM degree, USAID Ghana community health field work
- Connection to problem geography: Yakubu born in Upper West Region (named in problem statement); Leticia — Ghana community health programme experience
- Responsible AI: both — architecture enforces clinical guardrails; LLM never makes clinical decisions

---

## 2. Problem statement and target user

**Target user:** a CHPS Community Health Officer or nutrition officer in a Northern Region district, working across scattered rural households, often offline, carrying a smartphone.

**The problem.** In Northern Ghana, maternal and child undernutrition is severe and worsening. The Northern Region reported 100 institutional maternal deaths in 2023 against 69 in 2022, a ratio of 136.7 per 100,000 live births, above the national target of 125 (Northern Regional Health Directorate, 2023 performance review). Among children 6 to 23 months in northern Ghana, roughly a third are stunted and fewer than four in ten receive a minimum acceptable diet (peer-reviewed northern-Ghana studies). Diet quality is the lever: children eating fewer than four food groups are nearly four times as likely to be wasted.

Yet the health worker has no tool for the two things that would move this. First, between visits there is no record of how a mother's or child's nutrition is actually trending; the worker sees only a weight and a haemoglobin reading at each visit, so counselling stays generic. Second, when the worker does counsel, they cannot quickly tell a caregiver *which specific foods to eat this week that are both nutritious and actually available and affordable in their locality this season.* Generic advice ("eat well, eat greens") ignores that the right foods change by season and that these are poor households who cannot act on a list of foods they cannot find or afford. (This framing follows guidance given directly by a Ghana Health Service public-health director at the info session, who cautioned that tracking individual food *prices* is not useful; seasonal availability and affordability are.)

**Narrow problem we will solve:** give the frontline worker (a) a simple longitudinal picture of each client's nutrition across visits, and (b) a specific, seasonally-available, affordable, nutrient-adequate feeding plan they can hand to the caregiver as a local-language voice note.

**Measurable benefit:** the share of counselled caregivers who can assemble a minimum acceptable diet within their means, and improvement in each child's diet-diversity score across visits.

---

## 3. Solution concept — how the AI is used, safely and practically

**NurtureLink** is an offline-first mobile app for the health worker, with a local-language voice layer for the caregiver. It does two things and deliberately no more.

**A. Longitudinal nutrition record.** Built entirely from what the worker already collects at each visit (weight, haemoglobin or MUAC, and a short dietary recall), the app shows each client's trend over time and flags falling haemoglobin, flattening weight, or low diet diversity, so the worker can prioritise who to counsel and tailor the message. Nothing new to measure.

**B. Seasonal affordable-food plan.** For a flagged client, the app produces a feeding plan built from foods that are in season, affordable and locally available in that district this month, chosen to close the specific nutrient gap (iron and folate for an anaemic mother; energy, protein and diet diversity for a faltering child). The plan is delivered as a plain-language voice note in the local language that the caregiver keeps on any phone.

**Where AI genuinely earns its place (not AI for its own sake):**
- Prioritisation from each client's own visit history (an explainable risk flag, not a black box).
- Constrained recommendation: selecting a nutrient-adequate basket from the set of in-season, affordable local foods, closing the missing food groups at lowest burden to the family.
- Generation of a simple, local-language counselling script from the selected plan.

**Responsible-AI design (their explicit criterion):**
- The AI supports the worker's decision and never replaces it; the worker remains responsible for care.
- Every recommendation carries a plain-language "why," with no jargon.
- Severe cases (severe acute malnutrition, severe anaemia, obstetric danger signs) bypass nutrition advice entirely and route to referral.
- Recommendations align to WHO growth standards, WHO anaemia thresholds and GHS/CHPS protocol.
- Client data stays on the device, with the worker in control, and syncs to district systems (DHIMS2-compatible) only when a connection is available.

**Practical for the field:** works fully offline and syncs in the background; no dependence on live market-price feeds; the caregiver channel needs no smartphone or data, only a voice note the worker plays or sends.

---

## 4. Prototype scope

**Demonstrable now (in the repo):** a clickable mobile prototype showing the full flow — a prioritised nutrition follow-up list, a client's nutrition trend across visits, the seasonal affordable-food plan with nutrient adequacy and an explainable rationale, a local-language voice-note step, and the severe-case referral guardrail. It runs offline in any browser with no backend.

**To be built at the bootcamp (the MVP):**
- A real seasonal food-availability and affordability dataset for one pilot district, replacing the demo data.
- A real nutrient-adequacy calculation against WHO/IYCF targets using a West African food-composition table.
- On-device storage with background sync and a DHIMS2-compatible export.
- One recorded local-language (Dagbani) voice pack for the caregiver plan.

Scoping to a single district and a single language for the MVP is deliberate: a smaller solution that works reliably beats a broad one that fails in the field.

---

## 5. Repository

GitHub: <https://github.com/YakubuLute/nurturelink>

The repo is public and contains the full working prototype: React Native mobile app (screens: Register, Visit, Plan, Referral), deterministic recommendation engine with 50+ passing tests, Express.js backend with Prisma schema and seed data, and shared Zod schemas. The README describes the concept, the two core functions, the offline and responsible-AI design, and the bootcamp build plan.

---

## 6. Field grounding

The problem statement rests on Ghana-specific data:

- Northern Regional Health Directorate 2023 annual performance review: 100 institutional maternal deaths; ratio 136.7 per 100,000 live births (up from 69 in 2022).
- Peer-reviewed northern-Ghana IYCF studies: stunting ~33% among children 6–23 months; minimum acceptable diet ~38.9%; children eating fewer than 4 food groups ~4× more likely to be wasted.
- GDHS 2022: minimum acceptable diet 26.4% nationally; SDG 3.1 target <70 per 100,000 by 2030.

**Team field connection:**

- Yakubu Lute was born and raised in Tumu, Upper West Region — one of the five target regions named in the problem statement. He has lived in Tamale and witnessed firsthand the food insecurity and under-resourced health infrastructure that define daily life in Northern Ghana.
- Leticia Offeibea participated in Ghana's National Malaria Elimination Programme (USAID-funded), supporting malaria prevention, surveillance, and control at the community level. She is the team's primary contact for ongoing CHO field validation.

**CHO field conversation:** Leticia is actively using her USAID network to arrange a direct conversation with a working CHPS CHO or nutrition officer. [To be added: brief summary of at least one field conversation before final submission.]

### Sources to cite
- Northern Regional Health Directorate, 2023 annual health performance review (via Ghana News Agency, Mar 2024): 100 institutional maternal deaths in 2023 vs 69 in 2022; ratio 136.7 per 100,000.
- Peer-reviewed northern-Ghana IYCF studies (BMC / NCBI): stunting ~33% among 6–23 months; minimum acceptable diet ~38.9%; children eating <4 food groups ~4x more likely to be wasted.
- GDHS 2022 (national): minimum acceptable diet 26.4% among 6–23 months; national maternal mortality context and SDG 3.1 target (<70 per 100,000 by 2030).
- UNICEF Ghana reports and the StartUp Lab concept note (UNICEF / UNICEF StartUp Lab LinkedIn) — read before finalising.

### Timeline
Applications close **11 August**. Virtual pre-workshops through August (attend if you can; not mandatory). Bootcamp **26–28 August, Tamale** (top 10 teams; fully sponsored — accommodation, feeding, transport stipend): day 1 shape the idea, day 2 build the MVP, day 3 pitch. Around ten awards, not winner-take-all. Teams own their IP.
