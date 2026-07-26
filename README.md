# ⚖️ TRP Application Binder & AI Legal Submission Studio
### *Under IRPA s. 24(1) — Temporary Resident Permit Application*

An interactive, responsive single-page web dashboard and digital submission binder engineered for **Justin Louis Hardy FASSIO** (UCI: `11-2962-5822`).

This package compiles statutory legal briefs, family court mandates, financial provenance records, and GCMS ATIP rebuttals alongside an integrated **AI Legal Analysis & Adjudication Studio** powered by Google’s Gemini and Imagen models.

---

## 📌 Case Profile & Metadata

| Metadata Field | Record Details |
| :--- | :--- |
| **Applicant** | Justin Louis Hardy FASSIO (U.S. Citizen) |
| **Unique Client Identifier (UCI)** | `11-2962-5822` |
| **Minor Child** | Ava FASSIO (Age 6, Canadian Citizen) |
| **Jurisdiction** | Supreme Court of British Columbia (Kelowna Registry, File No. `139323`) |
| **Primary Need** | 50/50 Equal Physical Custody & Guardianship (Term 16 Relocation Restriction) |
| **Legal Counsel** | Ocana Law Group (Barristers & Solicitors, Kelowna, BC) |
| **Governing Framework** | IRPA s. 24(1) TRP / Supreme Court of Canada *Kanthasamy v. Canada* (BIOC) |

---

## 🚀 Key Features

* **🗂️ Interactive Master Binder (Tabs 1–6):** Organized digital tabs mapping to official IRCC submission requirements, from forms and court orders to U.S. living trusts and financial provenance.
* **🔍 Document Inspection Modal:** Clickable exhibit inspection previews providing instant verification status and legal relevance notes for all 18 binder exhibits.
* **🤖 AI Legal Suite & Risk Simulator (Tab 7):**
  * **IRCC Adjudication Simulator:** Generates risk scores, key strengths, vulnerabilities, and official GCMS decision narratives via `gemini-3-flash-preview`.
  * **Real-Time Grounded Legal Search:** Live search across Federal Court case law, IRCC manuals, and CBSA bulletins with Google Search grounding.
  * **Multimodal Exhibit Vision OCR:** Upload/inspect document images (CBP stamps, court seals, receipts) to verify IRPA compliance.
  * **Custom Legal Brief & Affidavit Drafter:** Generates custom statutory declarations and counsel arguments.
  * **Audio Oral Briefing (TTS):** Converts case briefs and POE interview scenarios into spoken audio using `gemini-2.5-flash-preview-tts`.
  * **Visual Evidence Diagramming:** Synthesizes custom legal infographics and audit flowcharts using `imagen-4.0-generate-001`.
* **🖨️ Print & PDF Ready:** Custom print stylesheet support for clean PDF generation or physical binder rendering (`Ctrl+P` / `Cmd+P`).
* **🌙 Dark Mode Support:** Built-in theme toggle with custom Tailwind navy and gold color palettes.

---

## 🧭 Guiding Strategy Documents (Not Part of the Binder)

The [`strategy/`](./strategy) folder holds internal planning documents that inform *what goes into* the binder — they are not submission exhibits and are not exposed as binder tabs.

* [`strategy/Master_Strategy_Brief_v2_July_2026.md`](./strategy/Master_Strategy_Brief_v2_July_2026.md) — the current master strategy brief (supersedes the July 2026 Three-Stage Bridge Brief), covering the sequenced action plan across the outland TRP, bounded visitor entry, POE TRP fallback, and in-Canada H&C tracks. Update the binder's contents against this brief as the case progresses.

---

## 📂 Binder Structure & Tab Breakdown
