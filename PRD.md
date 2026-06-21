# Abdullayev School — Student / Parent / Teacher Platform

## Product Requirements Document (v2 — all open questions resolved)

-----

## 1. Background & Current State

A frontend-only prototype exists (`abdullayev-school-app.vercel.app`) built in React + Vite + TypeScript + Tailwind + React Router + Framer Motion. It is a polished UI shell with **no backend, no auth, no database, no persistence** — all data (XP, streaks, lessons, leaderboard) is hardcoded mock state. This PRD defines the real product so we can decide whether to extend that frontend or rebuild against a proper backend.

-----

## 2. Problem Statement

Parents currently have no visibility into their child's day-to-day academic standing without physically visiting the school and asking a teacher. This creates friction for parents and unscheduled interruptions for teachers. Abdullayev School wants:

1. Parents to see real-time academic + behavioral standing without visiting school.
1. Students to have gamified daily homework tied to the actual curriculum, with visible mastery %.
1. Teachers to see exactly where each student is struggling, with minimal extra workload.
1. A behavior/conduct system tied to real consequences, with built-in redemption paths.

-----

## 3. System Overview — Three Surfaces

|Surface                  |Users                 |Core Job                                                           |
|-------------------------|----------------------|-------------------------------------------------------------------|
|**Student App**          |Students              |Daily lessons, homework, gamification, AI tutor                    |
|**Parent App**           |Parents               |Read-only visibility into academics + behavior + teacher comments  |
|**Teacher/Admin Console**|Teachers, school admin|Author content, grade/review, write comments, manage conduct ledger|

These three surfaces share one backend and one data model. Building the Student app alone (as the prototype did) without the other two produces zero real value — the entire premise is teacher input → parent visibility.

-----

## 4. Core Data Model (entities)

- **User** (role: student / parent / teacher / admin / commission-member), linked Student↔Parent(s)
- **Subject** (per Appendix A — `track: davlat | qoshimcha`)
- **Lesson** (per subject, per day, per class/grade) — authored/approved via Ta'lim sifat komissiyasi workflow; contains video + theory + 4-stage homework
- **HomeworkStage** (belongs to Lesson) — type: video_theory / vocabulary / listening / reading (pattern varies by subject), pass threshold (e.g. 75%)
- **SubmissionRecord** (student × stage) — answers, correctness per question, timestamp
- **MasteryScore** (student × subject, rolling %) — derived from SubmissionRecord, must support **error-location drill-down** (exactly which question/topic was wrong)
- **TeacherComment** (teacher × student × lesson) — short qualitative note, second evaluation axis alongside %
- **ConductLedger** (student) — behavior-only point balance (15 start), append-only log, requires Commission approval per change (see §6.2)
- **AcademicStanding** (student, yearly) — separate from ConductLedger; tracks yearly average % against the 65% floor (see §6.1)
- **XPLedger / Streak** (student) — gamification layer, separate from both ConductLedger and AcademicStanding
- **LeaderboardEntry** (computed, per class, per period)
- **ShopItem** (catalog, in-school inventory count) / **RedemptionTransaction** (student × item × staff-confirmation) — in-person handoff model, no shipping
- **ClassEnrollment** (student × class × grade × subjects)

-----

## 5. Feature Specification

### 5.1 Student App

- **Daily unlock model:** each day, the lesson taught that day unlocks in the app for that subject. Content authored/approved by the school's **Ta'lim sifat komissiyasi** (Education Quality Commission), against a yearly curriculum plan + schedule submitted in advance.
- **Lesson structure (confirmed example — Ingliz tili, "Present Simple"):**
1. **Video lecture + theory** — short video, simple written explanation with examples (a written "script")
1. **Vocabulary practice** — new words from that lesson's theme: spelling/translation entry, fill-in-the-blank exercises
1. **Listening exercise** — topic-related listening comprehension
1. **Reading exercise** — topic-related reading comprehension
   *(exact stage count/order will vary slightly by subject — this is the reference pattern, to be refined per subject by the Commission)*
- Mastery % per subject, with visibility into **where** mistakes happened (topic/question level)
- Gamification: XP, streaks, class leaderboard, "lives"/points balance (see §6 — now behavior-only)
- **Shop (confirmed model — much simpler than initially scoped):** students spend earned stars/points on school merch. **Redemption is in-person**: a dedicated staff member hands the prize to the student physically (e.g., right after class). No shipping, no courier logistics. App-side this only needs: a redemption request + a staff-side confirmation step (e.g., staff scans a code or approves in the Teacher/Admin console) so points are deducted only once actually handed over — prevents double-spend without needing a full e-commerce fulfillment system.
- **AI Agent (confirmed, final scope):** not a subject-tutor chatbot — that concept from the original prototype (English AI Teacher) is **fully replaced**, not deferred. The AI Agent is purely an in-app navigation/usage assistant — helps the student use the app itself (e.g., "qanday qilib uy vazifamni topaman", "bugungi darsim qayerda"). No subject-tutoring AI in current scope.
- Daily journal ("Kundalik") — optional reflective entry, can feed parent app under a "how my day was" view

### 5.2 Parent App (does not yet exist — net new build)

- Per-child dashboard: mastery % per subject, recent teacher comments, conduct point balance + history, attendance
- Notification feed: new comment posted, point deducted/added, low mastery alert, upcoming low-conduct-balance warning
- No ability to edit anything — strictly read-only + notification preferences
- Multi-child support if a parent has more than one child at the school

### 5.3 Teacher / Admin Console (does not yet exist — net new build)

- Lesson/curriculum authoring (or import from existing textbook content)
- Grading/review queue where automatic scoring isn't possible (open-ended answers)
- Per-student, per-lesson comment entry — **needs to be fast** (templates, quick-tags, optional AI-assisted draft the teacher edits, not workload multiplier)
- Conduct ledger management: add/deduct points with mandatory reason field, full audit trail, **not a one-tap silent action**
- Class-level analytics: who's falling behind, where most errors are concentrated across the class

-----

## 6. Discipline & Academic Standing — Finalized Design (v2)

The conduct system and academic standing are now **two fully separate tracks**, deliberately decoupled to avoid conflating "struggling academically" with "behavioral risk."

### 6.1 — Academic Track (independent of conduct points)

- Daily/in-app grading is **percentage-only**. The traditional Soviet-style 2/3/4/5 scale is **never shown** to students or parents in the app — it exists only in the backend for generating official state documents (attestat, etc.) where legally required.
- **Rationale (confirmed with stakeholder):** showing a "2" to a young child entering school creates early self-labeling ("men ikkichiman") and psychological pressure. International best practice favors percentage/mastery-based feedback for this age group. This is a deliberate, good UX/psych decision — keep it.
- **Yearly academic threshold:** if a student's overall yearly average (based on 3 grading checkpoints) falls below **65%**, the student enters an **academic dismissal review** — handled entirely separately from the conduct ledger below.
- This track has its own escalation path (tutoring referral → parent meeting → academic review board) and should NOT touch the 15-point conduct balance.

### 6.2 — Conduct Track (behavior only, 15 points)

- Every student starts with 15 points, dedicated **exclusively to behavior/conduct** — academic performance no longer affects this ledger.
- Deductions and additions are governed by a **rubric** (to be authored): "yomonlik mezonlari" (negative criteria, weighted by severity — og'ir/yengil) and "yaxshilik mezonlari" (positive/restorative criteria — e.g., participating in school events, assisting a teacher, reading books — exact point values TBD).
- **Governance:** No single teacher can unilaterally deduct/add points. All changes go through the **Sifat nazorati komissiyasi** (Quality Control Commission), which reviews the situation before any ledger change is finalized. This is the due-process safeguard that resolves the original risk flagged in v1.
- **Visibility:** Restricted to the student, their parent(s), and administration only. Never public, never on a leaderboard.

### 6.3 — At-threshold handling (both tracks)

- When a student's conduct balance hits 0, or the academic yearly average breaches the 65% floor: the Commission holds an internal conversation/review with the parent and child before any final decision (expulsion or otherwise). This is a real due-process step and should exist regardless of track.
- **Critical messaging rule:** the *existence* of this review conversation as a guaranteed safety net must **not** be advertised or implied anywhere in the student/parent-facing app or policy text. If students/parents come to expect "there's always a talk before anything real happens," it creates moral hazard and undermines the deterrent effect of the whole system. The app's language at the threshold should stay firm and serious (e.g., "Sizning ball balansingiz 0ga yetdi — maktab ma'muriyati holatni ko'rib chiqadi" — no reassuring tone, no explicit promise of a grace meeting). The human review still happens operationally; it's simply never promised as a feature.
- This means: the conduct/academic ledger UI and notification copy need careful tone review separate from the backend logic — worth a dedicated copywriting pass before launch, not just a translation task.

### 6.4 — Academic checkpoint calendar (resolved)

The yearly average is calculated within the scope of the school's own single academic-year curriculum plan (the same yearly plan the Commission submits per §5.1) — 3 checkpoints defined by that plan, not strictly tied to the state's official chorak structure.

-----

## 7. Gamification Design Notes

- **Leaderboard:** raw class rank demotivates the bottom half. Consider cohort-relative bands or "most improved" alongside raw rank.
- **Shop:** confirmed in-person redemption model (staff hands over prize physically) — removes most fulfillment risk. Still needs basic stock-count tracking per item and a staff-confirmation step in the Teacher/Admin console to prevent double-redeeming the same points.
- **Streaks/XP:** keep separate from conduct points and academic standing to avoid conflating "engagement" with "behavior" or "academic performance."

-----

## 8. Non-Functional Requirements

- **Language:** Uzbek (Latin) primary, consider Russian secondary given region; English content is subject matter, not UI language, for the language-learning sections.
- **Data privacy:** all users are minors (or guardians of minors) — name, academic record, behavioral record. Needs explicit data handling policy, parental consent flow, and minimal data retention practices appropriate for child data in Uzbekistan.
- **Offline tolerance:** Uzbekistan mobile connectivity (seen in your own screenshots: 1-bar LTE) — app should degrade gracefully, cache lesson content, queue submissions for sync.
- **Single-tenant scope (confirmed):** built exclusively for Abdullayev School, no multi-campus/franchise requirement. Don't over-invest in multi-tenant abstraction — keep the data model reasonably clean, but this is no longer a design constraint.

-----

## 9. Open Questions

All initial open questions are now resolved:

1. ✅ Conduct/academic mechanic — §6 (two separate tracks, Commission-governed).
1. ✅ Content authoring — Ta'lim sifat komissiyasi, yearly plan + daily unlock model (§5.1).
1. ✅ Shop fulfillment — in-person staff handoff, no shipping (§5.1, §7).
1. ✅ Single school — confirmed, Abdullayev School only (§8).
1. ✅ Existing frontend — discarded visually; rebuilt against a new brand book (§Phase 0).
1. ✅ AI Agent scope — navigation/usage assistant only; subject-tutor AI fully cut, not deferred (§5.1).
1. ✅ Content production lead time — Commission works **one chorak (term/month) ahead** of when content airs. This means the Teacher/Admin console needs a **content calendar/scheduling view as a Phase 1 feature**, not a later add-on — without it, the Commission has no way to plan a term ahead.
1. ✅ Academic checkpoint calendar — the 65% yearly threshold is calculated **within the scope of the single academic year's own curriculum plan** (the same yearly plan referenced in §5.1, submitted by the Commission) — not strictly mirrored to the state's official chorak structure. The 3 checkpoints are defined by the school's own yearly program.
1. ✅ Brand book — stakeholder provides core creative direction/ideas; this gets systematized into a full brand book (logo, color system, type, UI language) as part of this engagement — see Phase 0 below.

No blocking unknowns remain. Ready to move to technical architecture / build planning.

-----

## 10. Recommended MVP Phasing

**Phase 0 — Brand identity: ✅ COMPLETED.** Full brand book delivered (see `Abdullayev School Brand Book.docx` + crest/pattern assets). Summary for engineering reference — see Appendix B for full detail:

- **Mark:** Kalon Minora (Buxoro mayoq-minorasi) — markazda, qalqon ichida 4 segment (Aql/kitob, Jismoniy/to'lqin, Nutq-Yetakchilik/mash'al, Ilm-Halollik/qalam), tepada toj. Tirik mavjudot yo'q (qasddan dizayn/diniy qaror).
- **Ranglar:** Deep Navy `#0F2A52` (asosiy), Heritage Gold `#C9A227` (faqat chiziq/aksent, katta yuzaga to'ldirilmaydi), Parchment `#F7F3E8` (fon), Ink `#0A1C38` (matn).
- **Tipografika:** Serif (Cormorant Garamond / EB Garamond) — logotip, qo'lda kerning; Sans-serif (Inter/Arial) — UI va hujjat matni.
- **Logo lockup:** faqat 2 rasmiy variant — Vertikal (asosiy) va Gorizontal. Boshqa variant yaratilmaydi.
- **Kichik o'lcham qoidasi:** ≤32px ikonlar uchun soddalashtirilgan "Agate" versiya kerak (faqat minora + qalqon konturi) — "Display" (katta, batafsil) versiyadan alohida master fayl.

**Phase 0 implementation — resolved:**

1. ✅ Gerb render (3D, gold gradient) — **faqat marketing/sayt uchun**. In-app foydalanish uchun (nav, favicon, status belgilar) **flat vector versiya yaratilishi kerak** — bu Phase 1 boshlanishidan oldin bajariladigan kichik dizayn vazifasi.
1. ✅ "Hero" 3D personaj — **faqat onboarding/marketing maskoti**, ilova ichida ishlatilmaydi (AI Agent'ning yuzi emas). AI Agent shunday holda matn-asosli/minimal-vizual interfeys bo'lib qoladi, alohida personaj kerak emas.
1. Geometrik Shamsa naqshlari (ikkita variant — to'q sariq/krem va krem/lojuvard) — fon dekoratsiyasi sifatida qaysi ekranlarda ishlatiladi (loading, bo'limlar orasida ajratuvchi, va h.k)?

**Phase 1 — Foundation:** Auth (student/parent/teacher/commission roles), real backend + database, **content calendar/scheduling view** in the Teacher/Admin console (Commission needs to plan ~1 chorak ahead — this is not optional, build it now), one subject (e.g. Matematika) end-to-end: lesson → homework → mastery % → teacher comment → parent visibility.

**Phase 2 — Expand curriculum:** add remaining subjects, conduct ledger (Commission-governed), basic leaderboard.

**Phase 3 — Gamification + Shop:** points economy, redemption catalog (in-person model), staff-confirmation flow.

**Phase 4 — AI navigation agent + Parent app polish + notifications.**

-----

-----

-----

## Appendix B — Brand Identity Reference (Phase 0 deliverable)

Full source: `Abdullayev School Brand Book.docx` (1-nashr, 2026). Quick-reference for engineering/design implementation:

### B.1 — Concept

Belgi: Kalon minorasi (Buxoro) — asrlar davomida Ipak yo'li savdogarlarini xavfsiz yo'lga boshlagan mayoq, Chingizxon vayronagarchiligidan omon qolgan. Maktab va'dasining ramzi: tashqi dunyo qulasa ham tik turish.

Gerb — 4 segmentli qalqon + markazda minora + tepada toj:

- Kitob (yuqori-chap) — **Aql**
- To'lqin (yuqori-o'ng) — **Jismoniy**
- Mash'al (past-chap) — **Nutq va Yetakchilik**
- Qalam (past-o'ng) — **Ilm va Halollik**
- Minora (markaz) — **Xarakter**
- Toj (tepada) — sharaf

Ikkinchi darajali motif: Shamsa (sakkiz qirrali yulduz) — Temuriy meros, tirik mavjudotsiz.

### B.2 — Design tokens

```
--color-navy:      #0F2A52   /* asosiy fon, qalqon */
--color-gold:      #C9A227   /* faqat chiziq/aksent — katta fill YO'Q */
--color-parchment: #F7F3E8   /* fon, yorug' yuzalar */
--color-ink:       #0A1C38   /* matn, kontur */

--font-display: "Cormorant Garamond", "EB Garamond", serif;  /* logotip, sarlavhalar — BOSH HARF, qalin, qo'lda kerning */
--font-body:    "Inter", Arial, sans-serif;                   /* UI matni, tugmalar, hujjat matni */
```

### B.3 — Qattiq taqiqlar (har qanday in-app asset uchun amal qiladi)

- Belgini cho'zish/siqish/nisbat buzish
- Rang o'zgartirish yoki past-kontrast fonga qo'yish
- Soya, gradient, 3D effekt qo'shish ← *taqdim etilgan gerb render'i bunga zid, in-app uchun flat versiya kerak*
- Element almashtirish/olib tashlash
- Tirik mavjudot qo'shish (ot, qush, odam) ← *"hero" personaj buning chegarasida emasligini aniqlashtirish kerak, chunki u alohida marketing/mascot asset, gerbga kiritilmaydi*
- Trend effektlarga ergashish

### B.4 — Asset inventarizatsiyasi (hozircha mavjud)

|Asset                                        |Format       |Holat                                                                                  |
|---------------------------------------------|-------------|---------------------------------------------------------------------------------------|
|Rang palitrasi                               |PNG reference|✅ Tayyor                                                                               |
|Shamsa naqsh — to'q sariq/krem               |PNG          |✅ Tayyor (qo'llanish joyi aniqlanmagan)                                                |
|Shamsa naqsh — krem/lojuvard, porlash markazi|PNG          |✅ Tayyor (qo'llanish joyi aniqlanmagan)                                                |
|Gerb (to'liq, 3D render)                     |PNG          |✅ Tayyor — faqat marketing/sayt uchun. In-app flat vector versiyasi ❌ hali yaratilmagan|
|"Hero" 3D personaj                           |PNG          |✅ Tayyor — faqat onboarding/marketing maskoti, ilova ichida ishlatilmaydi              |
|Logotip lockup (Vertikal/Gorizontal)         |—            |❌ Hali yaratilmagan — faqat qoidalar mavjud                                            |
|Agate (kichik o'lcham) versiyasi             |—            |❌ Hali yaratilmagan                                                                    |

-----

## Appendix A — Subject List, Grades 2–3–4 (2026–2027 o'quv yili)

Manba: O'zbekiston Respublikasi Maktabgacha va maktab ta'limi vazirligining 2026–2027-o'quv yiliga mo'ljallangan tayanch o'quv reja buyrug'i (2026-yil aprel). Til ta'limi o'zbek tilida bo'lgan maktablar uchun.

Har bir fan endi ikki "track" ga ega bo'ladi: **Davlat (majburiy)** va **Qo'shimcha (maktabning chuqurlashtirilgan dasturi)**. Bu Subject data modelida `track: davlat | qoshimcha` maydoni sifatida ifodalanadi.

### A.1 — Davlat dasturi (majburiy, o'zgartirib bo'lmaydigan), 2–3–4-sinflar uchun bir xil ro'yxat

|№ |Fan                                   |Izoh                                                      |
|--|--------------------------------------|----------------------------------------------------------|
|1 |Ona tili                              |                                                          |
|2 |O'qish savodxonligi                   |                                                          |
|3 |Rus tili                              |2-sinfdan majburiy                                        |
|4 |Chet tili (davlat dasturi)            |odatda Ingliz tili — Kuzatuv kengashi tanlovi bilan       |
|5 |Tarbiya                               |                                                          |
|6 |Matematika                            |5 soat/hafta                                              |
|7 |Informatika va axborot texnologiyalari|2026–2027dan 4-sinfga ham kiritildi (avval faqat 1–3-sinf)|
|8 |Tabiiy fanlar (Science)               |2–3-sinf: 1 soat, 4-sinf: 2 soat                          |
|9 |Musiqa madaniyati                     |                                                          |
|10|Tasviriy san'at                       |                                                          |
|11|Texnologiya                           |                                                          |
|12|Jismoniy tarbiya (umumiy, davlat)     |2 soat/hafta                                              |

*Bu ro'yxat va soatlar Vazirlik buyrug'iga asoslangan eng ishonchli ma'lumot; aniq soat sonlari maktabning o'z o'quv rejasida (avgustdagi Pedagogik kengash qarori bilan) biroz farqlanishi mumkin.*

### A.2 — Maktabning qo'shimcha (chuqurlashtirilgan, premium) dasturi

Bu fanlar davlat dasturidagi tegishli darsdan **alohida**, qo'shimcha chuqurlashtirilgan tarzda o'tiladi (davlat darsini almashtirmaydi, ustiga qo'shiladi):

|№ |Fan                                            |Izoh                                                             |
|--|-----------------------------------------------|-----------------------------------------------------------------|
|13|Ingliz tili — chuqurlashtirilgan               |Davlat "Chet tili" darsidan tashqari, qo'shimcha intensiv dars   |
|14|Rus tili — chuqurlashtirilgan                  |Davlat "Rus tili" darsidan tashqari, qo'shimcha intensiv dars    |
|15|Arab tili                                      |To'liq qo'shimcha — davlat dasturida umuman yo'q                 |
|16|Jismoniy tarbiya — Futbol                      |                                                                 |
|17|Jismoniy tarbiya — Suzish                      |                                                                 |
|18|Jismoniy tarbiya — Ot sporti                   |Inventar/maydon/xavfsizlik bo'yicha alohida operatsion reja kerak|
|19|Jismoniy tarbiya — Umumiy jismoniy tayyorgarlik|                                                                 |

**Data model izohi:** Student app'da bu 7 fan (13–19) alohida tile/kartochka sifatida ko'rsatiladi (Matematika, Ingliz tili kabi), "Jismoniy tarbiya" ichida nested qilinmaydi — chunki har birining o'z dasturi, o'z o'qituvchisi va o'z mastery % progress'i bo'ladi.

**Tasdiqlandi:** Futbol maydonchasi, suzish havzasi va ot sporti uchun joy — barchasi maktab hududida, shaxsiy mulk. Tashqi hamkorlik/ijara kerak emas.

**Qoladigan ochiq nuqta — Ot sporti xavfsizligi:** boshqa fanlardan farqli, jismoniy xavf darajasi yuqori. App darajasida quyidagilar hisobga olinishi tavsiya etiladi:

- Ota-onadan alohida xavfsizlik roziligi (consent form) — Parent app orqali raqamli imzo
- Instruktor malaka sertifikati ma'lumotlari (admin tomonidan)
- Har bir mashg'ulot oldidan tibbiy/jihoz tekshiruvi checklist
- Shoshilinch tibbiy yordam protokoli maktab hududida mavjudligi (bu PRD doirasidan tashqari, lekin app buni "majburiy maydon" sifatida talab qilishi mumkin)

-----

*End of PRD v2 — all open questions resolved. Ready for technical architecture / build planning.*
