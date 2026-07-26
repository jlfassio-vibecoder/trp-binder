import { useState } from 'react';

// Runtime/user-provided Gemini API key placeholder — intentionally left blank.
// In the original static page this was auto-injected by the preview runtime,
// or supplied by whoever hosts the page. Do NOT wire up a server-side proxy;
// this is meant to keep the exact client-side, bring-your-own-key pattern.
const apiKey = '';

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        if (i === maxRetries - 1) return res;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      return res;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('unreachable');
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function pcmToWav(pcm16Array: Int16Array, sampleRate = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcm16Array.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm16Array.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm16Array.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm16Array.length; i++, offset += 2) {
    view.setInt16(offset, pcm16Array[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatGeminiText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n- /g, '<br>• ');
}

// Tailwind (v4) only generates classes it can find as literal strings at build
// time, so per-tool accent colors are looked up from this fully-literal map
// rather than interpolated (e.g. `text-${color}-600` would silently produce no
// CSS rule and unstyled icons/badges).
const TOOL_COLOR_CLASSES = {
  purple: { text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/60' },
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/60' },
  teal: { text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-100 dark:bg-teal-900/60' },
  rose: { text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 dark:bg-rose-900/60' },
  amber: { text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/60' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/60' },
} as const;

const TOOLS = [
  { id: 'sim', label: 'Officer Simulator', sub: 'Adjudication risk model.', icon: 'fa-solid fa-user-shield', tag: 'JSON', color: 'purple' },
  { id: 'search', label: 'Policy & Case Search', sub: 'Google Grounded Search.', icon: 'fa-solid fa-globe', tag: 'Search', color: 'indigo' },
  { id: 'vision', label: 'Exhibit OCR & Inspection', sub: 'Image upload analysis.', icon: 'fa-solid fa-eye', tag: 'Vision', color: 'teal' },
  { id: 'draft', label: 'Affidavit Drafter', sub: 'Custom legal drafting.', icon: 'fa-solid fa-pen-nib', tag: 'Draft', color: 'rose' },
  { id: 'tts', label: 'Audio Oral Briefing', sub: 'Gemini spoken audio.', icon: 'fa-solid fa-volume-high', tag: 'TTS', color: 'amber' },
  { id: 'img', label: 'Evidence Diagram', sub: 'Imagen 4.0 visualizer.', icon: 'fa-solid fa-image', tag: 'Imagen', color: 'emerald' },
] as const;

type ToolId = (typeof TOOLS)[number]['id'];

export default function AiLegalSuite() {
  const [activeTool, setActiveTool] = useState<ToolId>('sim');

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Powered by Gemini 3 Flash &amp; Imagen 4.0</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Legal Analysis, Multimodal Vision &amp; Research Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Interactive intelligent suite for adjudication risk modeling, grounded case law search, multimodal
            document verification, custom legal drafting, and audio prep.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-full font-semibold">
            <i className="fa-solid fa-microchip mr-1"></i> Gemini 3 Flash &amp; Grounding
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`ai-tool-btn p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'active-ai-tool bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div>
                <div className={`flex items-center justify-between mb-1 ${TOOL_COLOR_CLASSES[tool.color].text}`}>
                  <i className={`${tool.icon} text-lg`}></i>
                  <span className={`text-[9px] font-bold uppercase px-1 rounded ${TOOL_COLOR_CLASSES[tool.color].badge}`}>
                    {tool.tag}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">{tool.label}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{tool.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {activeTool === 'sim' && <OfficerSimulator />}
      {activeTool === 'search' && <GroundedSearch />}
      {activeTool === 'vision' && <VisionInspector />}
      {activeTool === 'draft' && <LegalDrafter />}
      {activeTool === 'tts' && <AudioBriefing />}
      {activeTool === 'img' && <EvidenceDiagram />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 1: ADJUDICATION SIMULATOR                                     */
/* ---------------------------------------------------------------------- */

interface SimResult {
  approvalScore: number;
  recommendationStatus: string;
  summaryRationale: string;
  strengths: string[];
  vulnerabilities: string[];
  gcmsOfficerNotes: string;
}

function OfficerSimulator() {
  const [focus, setFocus] = useState('All Tabs Balanced');
  const [persona, setPersona] = useState('Standard Senior IRCC Decision-Maker');
  const [customObj, setCustomObj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const run = async () => {
    setLoading(true);
    const systemPrompt = `You are a Senior Immigration Officer at IRCC or CBSA conducting a formal s. 24(1) TRP Risk vs. Need assessment under ENF 23 guidelines.
Analyze the case of Justin Louis Hardy FASSIO (UCI: 11-2962-5822), father of 6-year-old Canadian Citizen child Ava FASSIO in Kelowna, BC under a BC Supreme Court 50/50 custody order (File 139323).
Focus: ${focus}. Persona: ${persona}. Custom Objection: ${customObj || 'None'}.
Return a JSON object adhering strictly to the requested schema.`;

    const userPrompt = `Evaluate the TRP binder evidence:
1. BIOC: BC Supreme Court Order Term 16 forbids relocation outside BC. Ava is age 6 in Kelowna school.
2. GCMS Rebuttal: Rebutting Osoyoos POE officer's uncodified requirement ("majority of time outside Canada") and blank s.41(a) field. Dual intent under Jewell v Canada (2015 FC 1046) & Williams v Canada (2020 FC 8).
3. US Domicile: Beneficiary of $2.3M Santa Cruz California Living Trust and Active Power of Attorney for mother's estate. VA Pension ~$2,300 CAD/mo.
4. Financials: $14,300 net liquid savings seasoned from vehicle equity sale + $2,200 CAD/mo mother rent support.
5. Compliance: 100% voluntary compliance history (departed Sept 2024 VR refusal immediately, signed IMM 1282 Allowed to Leave June 2026).`;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            approvalScore: { type: 'INTEGER' },
            recommendationStatus: { type: 'STRING' },
            summaryRationale: { type: 'STRING' },
            strengths: { type: 'ARRAY', items: { type: 'STRING' } },
            vulnerabilities: { type: 'ARRAY', items: { type: 'STRING' } },
            gcmsOfficerNotes: { type: 'STRING' },
          },
          required: ['approvalScore', 'recommendationStatus', 'summaryRationale', 'strengths', 'vulnerabilities', 'gcmsOfficerNotes'],
        },
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result_ = await response.json();
      const jsonText = result_.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        setResult(JSON.parse(jsonText));
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              IRCC Senior Officer Adjudication Risk Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Generates a structured risk score, legal strengths, weak points, and officer decision notes using{' '}
              <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">gemini-3-flash-preview</code> JSON output.
            </p>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Analyzing File...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-play"></i>
                <span>Run Adjudication Simulation</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Focus Area</label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="All Tabs Balanced">Comprehensive Balanced Assessment (Tabs 1-6)</option>
              <option value="BIOC & Custody Focus">BIOC &amp; BC Supreme Court Mandate Focus</option>
              <option value="GCMS ATIP Rebuttal Focus">GCMS Uncodified Rule &amp; Legal Test Rebuttal</option>
              <option value="U.S. Domicile & Fiduciary Ties Focus">U.S. Trust &amp; Fiduciary Ties Focus</option>
              <option value="Financial Seasoning Focus">Financial Provenance &amp; Vehicle Equity Audit</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Officer Persona / Rigor Level
            </label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="Standard Senior IRCC Decision-Maker">Senior IRCC Decision-Maker (Standard ENF 23)</option>
              <option value="Strict CBSA POE Enforcement Officer">Strict CBSA POE Officer (Program Integrity Heavy)</option>
              <option value="Humanitarian & BIOC Specialist Officer">BIOC / Humanitarian Specialist Officer</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Specific Officer Objection to Test
            </label>
            <input
              type="text"
              value={customObj}
              onChange={(e) => setCustomObj(e.target.value)}
              placeholder="e.g. Applicant previously spent extended time in BC..."
              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center font-extrabold text-2xl border-4 text-emerald-600 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40">
                <span>{result.approvalScore}%</span>
                <span className="text-[9px] font-normal uppercase text-slate-500">Approval</span>
              </div>
              <div>
                <span className="px-2.5 py-1 text-xs font-bold uppercase rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {result.recommendationStatus}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Simulated Adjudication Outcome</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{result.summaryRationale}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl space-y-3">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i> Primary Key Strengths Identified
              </h4>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-4">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 rounded-xl space-y-3">
              <h4 className="font-bold text-amber-900 dark:text-amber-400 text-sm flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i> Remaining Vulnerabilities &amp; Mitigation
              </h4>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-4">
                {result.vulnerabilities.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-3 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-gold-400 font-bold">OFFICIAL SIMULATED GCMS DECISION NARRATIVE</span>
              <span className="text-slate-400 text-[10px]">ENF 23 Risk vs. Need Assessment</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">{result.gcmsOfficerNotes}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 2: GROUNDED LEGAL & IRCC POLICY SEARCH ENGINE                  */
/* ---------------------------------------------------------------------- */

interface SearchSource {
  uri: string;
  title: string;
}

function GroundedSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchSource[]>([]);

  const run = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setLoading(true);

    const systemPrompt = `You are an expert Canadian Immigration Law Researcher.
Analyze the user's query regarding Federal Court case law, IRCC Program Delivery Instructions (PDIs), CBSA manuals, or IRPA statutes.
Provide grounded, cited, authoritative legal explanations.`;

    const payload = {
      contents: [{ parts: [{ text: q }] }],
      tools: [{ google_search: {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const text = candidate.content.parts[0].text;

        let newSources: SearchSource[] = [];
        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
          newSources = groundingMetadata.groundingAttributions
            .map((attribution: any) => ({
              uri: attribution.web?.uri,
              title: attribution.web?.title,
            }))
            .filter((source: SearchSource) => source.uri && source.title);
        }

        setResponseHtml(formatGeminiText(text));
        setSources(newSources);
      }
    } catch (err) {
      console.error('Grounded Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const askPreset = (prompt: string) => {
    setQuery(prompt);
    run(prompt);
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
            <i className="fa-solid fa-earth-americas"></i>
            <span>Real-Time Google Search Grounding Enabled</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
            Live Case Law, IRCC Policy &amp; Operational Manual Search
          </h3>
          <p className="text-xs text-slate-500">
            Query live Federal Court jurisprudence, recent IRCC Program Delivery Instructions (PDIs), or CBSA
            bulletins using <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">gemini-3-flash-preview</code>{' '}
            with active Google Search grounding.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() =>
              askPreset(
                'Find recent Federal Court decisions on IRPA Section 24(1) TRP refusals and Best Interests of the Child (BIOC).'
              )
            }
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-300"
          >
            ⚖️ Federal Court TRP &amp; BIOC Rulings
          </button>
          <button
            onClick={() =>
              askPreset(
                'What are the official IRCC operational guidelines regarding dual intent for U.S. citizens seeking temporary entry?'
              )
            }
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-300"
          >
            📘 IRCC Dual Intent Guidelines (IRPA s.22(2))
          </button>
          <button
            onClick={() =>
              askPreset('Search CBSA ENF 23 manual provisions on temporary resident permits for parents of Canadian citizen children.')
            }
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-300"
          >
            🛡️ CBSA ENF 23 Manual Provisions
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Federal Court cases, IRCC manuals, or Canadian immigration precedents..."
            className="flex-grow p-3 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => run()}
            disabled={loading}
            className="px-5 py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center gap-2"
          >
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-magnifying-glass"></i>
                <span className="hidden sm:inline">Grounded Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {responseHtml && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved"></i> Grounded Jurisprudential Findings
            </span>
            <span className="text-slate-400 text-[10px]">Source Verified</span>
          </div>
          <div
            className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3 font-serif"
            dangerouslySetInnerHTML={{ __html: `<p>${responseHtml}</p>` }}
          />

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Verified Sources &amp; Citations:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-link text-[10px]"></i>
                  <span className="truncate max-w-[200px]">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 3: MULTIMODAL EXHIBIT VISION INSPECTOR                        */
/* ---------------------------------------------------------------------- */

function VisionInspector() {
  const [prompt, setPrompt] = useState(
    'Analyze this exhibit image for IRPA Section 24(1) TRP submission relevance. Extract key names, dates, amounts, court seals, or border stamp text, and evaluate compliance status.'
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB — Ready for inspection`);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const run = async () => {
    if (!base64) return;
    setLoading(true);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: base64 } }],
        },
      ],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setResponseHtml(formatGeminiText(text));
      }
    } catch (err) {
      console.error('Vision Analysis Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Multimodal Document, Stamp &amp; Exhibit Vision Inspector
          </h3>
          <p className="text-xs text-slate-500">
            Upload or capture an image of a passport stamp, court seal, receipt, or bank deposit to extract text and
            verify IRPA statutory compliance using{' '}
            <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">gemini-3-flash-preview</code> image
            understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
              Select / Upload Exhibit Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Upload JPG/PNG of CBP entry stamp, court order seal, vehicle bill of sale, or bank receipt.
            </p>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
              Inspection Focus / Prompt
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {preview && (
          <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center space-x-4">
            <img src={preview} className="w-24 h-24 object-cover rounded border" alt="Preview" />
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">{fileName}</span>
              <span className="text-[10px] text-slate-500 block">{fileSize}</span>
            </div>
          </div>
        )}

        <button
          onClick={run}
          disabled={!base64 || loading}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Inspecting Image with Gemini Vision...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-eye"></i>
              <span>Analyze Exhibit Image with Gemini Vision</span>
            </>
          )}
        </button>
      </div>

      {responseHtml && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <i className="fa-solid fa-microscope"></i> Vision Inspection &amp; Compliance Audit
            </span>
          </div>
          <div
            className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3 font-serif"
            dangerouslySetInnerHTML={{ __html: `<p>${responseHtml}</p>` }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 4: CUSTOM LEGAL BRIEF & AFFIDAVIT DRAFTER                      */
/* ---------------------------------------------------------------------- */

const draftTemplates: Record<string, string> = {
  affidavit:
    "Draft a formal Sworn Statutory Declaration from Justin Louis Hardy FASSIO detailing his daily parenting duties for 6-year-old Ava FASSIO under BC Supreme Court Order 139323, highlighting emergency contact status and school participation.",
  rebuttal:
    "Draft a formal counsel submission rebuttal paragraph challenging Officer MW228113's uncodified requirement that an applicant 'must spend the majority of his time outside of Canada', citing Stemijon Investments (2011 FCA 299) and Vavilov.",
  financial:
    "Draft a Sworn Rent Support Affidavit from the applicant's mother committing $2,200 CAD/month for housing in Kelowna, replacing Airbnb expenses and proving sustainable co-living.",
};

function LegalDrafter() {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);

  const run = async () => {
    const text = instructions.trim();
    if (!text) return;
    setLoading(true);

    const systemPrompt = `You are a Senior Barrister & Solicitor at Ocana Law Group in Kelowna, BC drafting formal legal submission documents for a Section 24(1) TRP package under IRPA.
Applicant: Justin Louis Hardy FASSIO (UCI: 11-2962-5822). Child: Ava FASSIO (Age 6). Court File: BCSC Kelowna No. 139323.`;

    const payload = {
      contents: [{ parts: [{ text }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const respText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (respText) {
        setResponseHtml(
          respText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '</p><p class="mt-2">')
        );
      }
    } catch (err) {
      console.error('Drafting error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = () => {
    const el = document.getElementById('draftResponseBody');
    const text = el?.textContent || '';
    navigator.clipboard?.writeText(text).catch(() => {
      /* fallback: rely on execCommand path for older browsers */
      document.execCommand('copy');
    });
    alert('Legal draft copied to clipboard.');
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Custom Legal Affidavit &amp; Submission Brief Drafter
          </h3>
          <p className="text-xs text-slate-500">
            Draft formal statutory declarations, counsel argument paragraphs, or rebuttal letters customized for
            updated facts using <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">gemini-3-flash-preview</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setInstructions(draftTemplates.affidavit)}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left bg-white dark:bg-slate-800 hover:border-rose-500 text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">📜 Sworn Parent Affidavit</strong>
            <span className="text-slate-500 text-[10px]">Statutory declaration detailing parenting involvement.</span>
          </button>
          <button
            onClick={() => setInstructions(draftTemplates.rebuttal)}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left bg-white dark:bg-slate-800 hover:border-rose-500 text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">⚖️ Uncodified Rule Rebuttal</strong>
            <span className="text-slate-500 text-[10px]">Counsel response to majority time rule.</span>
          </button>
          <button
            onClick={() => setInstructions(draftTemplates.financial)}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left bg-white dark:bg-slate-800 hover:border-rose-500 text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">💵 Financial Seasoning Affidavit</strong>
            <span className="text-slate-500 text-[10px]">Mother's sworn rent support commitment.</span>
          </button>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
            Drafting Instructions &amp; Specific Facts
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide specific factual details or custom legal instructions for the draft..."
            className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-sans leading-relaxed"
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Drafting Document...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-pen-nib"></i>
              <span>Generate Formal Legal Draft</span>
            </>
          )}
        </button>
      </div>

      {responseHtml && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <i className="fa-solid fa-file-signature"></i> Generated Legal Draft
            </span>
            <button onClick={copyDraft} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
              <i className="fa-regular fa-copy"></i> Copy Draft
            </button>
          </div>
          <div
            id="draftResponseBody"
            className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3 font-serif bg-amber-50/20 dark:bg-slate-950 p-4 rounded border border-slate-200 dark:border-slate-800"
            dangerouslySetInnerHTML={{ __html: `<p>${responseHtml}</p>` }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 5: AUDIO HEARING PREP (TTS)                                    */
/* ---------------------------------------------------------------------- */

const ttsPresets: Record<string, string> = {
  brief:
    "This application requests a Temporary Resident Permit under IRPA Subsection 24(1) for Justin Louis Hardy Fassio, UCI 11-2962-5822. The applicant is the joint-guardian of a six-year-old Canadian child, Ava, under a binding Supreme Court of British Columbia custody order requiring equal parenting time in Kelowna. The compelling need to fulfill court-ordered parental duties far outweighs any temporary non-compliance concern under ENF 23 guidelines.",
  poe:
    "Examining Officer: Mr. Fassio, what is the purpose of your entry today?\nApplicant: I am entering to fulfill my court-ordered parenting time with my 6-year-old daughter Ava in Kelowna, under British Columbia Supreme Court Order 139323.\nExamining Officer: You previously stayed in Canada for an extended period.\nApplicant: Yes, officer, every period was fully authorized by IRCC via approved Visitor Records, and I have voluntarily departed Canada whenever required, including my September 2024 departure and June 2026 Allowed to Leave.",
  bioc:
    "Under Kanthasamy v Canada, the Best Interests of the Child must be given significant weight. Six-year-old Ava Fassio is enrolled in elementary school in Kelowna. Excluding her father creates a legal paradox that deprives a Canadian child of her court-ordered equal parent.",
  custom: '',
};

function AudioBriefing() {
  const [preset, setPreset] = useState('brief');
  const [voice, setVoice] = useState('Kore');
  const [text, setText] = useState(ttsPresets.brief);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const onPresetChange = (key: string) => {
    setPreset(key);
    setText(ttsPresets[key] ?? '');
  };

  const run = async () => {
    const script = text.trim();
    if (!script) return;
    setLoading(true);

    const payload = {
      contents: [{ parts: [{ text: script }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/L16;rate=24000';

      if (base64Audio) {
        let sampleRate = 24000;
        const match = mimeType.match(/rate=(\d+)/);
        if (match) sampleRate = parseInt(match[1], 10);

        const pcmBuffer = base64ToArrayBuffer(base64Audio);
        const pcm16Array = new Int16Array(pcmBuffer);
        const wavBlob = pcmToWav(pcm16Array, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      }
    } catch (err) {
      console.error('TTS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Audio Oral Briefing &amp; POE Practice Studio</h3>
          <p className="text-xs text-slate-500">
            Uses <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">gemini-2.5-flash-preview-tts</code> to
            convert case summaries and practice interview scenarios into clear spoken audio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">Audio Script Preset</label>
            <select
              value={preset}
              onChange={(e) => onPresetChange(e.target.value)}
              className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="brief">30-Second Counsel Oral Briefing (For Senior Officer)</option>
              <option value="poe">Simulated Port of Entry Interview Scenario Q&amp;A</option>
              <option value="bioc">Ava's Best Interests Overview Speech</option>
              <option value="custom">Custom Text Prompt</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">Voice Selection</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full p-2 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="Kore">Kore (Firm &amp; Formal Counsel)</option>
              <option value="Zephyr">Zephyr (Bright &amp; Professional)</option>
              <option value="Puck">Puck (Upbeat &amp; Clear)</option>
              <option value="Charon">Charon (Informative &amp; Steady)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">Text Script for Audio Generation</label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-serif leading-relaxed"
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Generating Audio with Gemini TTS...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-volume-high"></i>
              <span>Generate Audio with Gemini TTS</span>
            </>
          )}
        </button>
      </div>

      {audioUrl && (
        <div className="p-6 bg-amber-50/50 dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-slate-700 space-y-4 text-center">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
            <i className="fa-solid fa-circle-play mr-1"></i> Generated Spoken Audio
          </span>
          <audio controls autoPlay src={audioUrl} className="w-full max-w-xl mx-auto"></audio>
          <div className="flex justify-center items-center gap-3 text-xs">
            <a
              href={audioUrl}
              download="TRP_Brief_Audio.wav"
              className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <i className="fa-solid fa-download"></i> Download WAV Container
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SUB-TOOL 6: EVIDENCE DIAGRAM GENERATOR                                  */
/* ---------------------------------------------------------------------- */

const diagramPrompts: Record<string, string> = {
  'co-parenting':
    'A high-end professional legal infographic diagram showing the co-parenting flow between Kelowna, British Columbia and Santa Cruz, California for a 6-year-old child under a Supreme Court order, clean corporate vector art style, navy and gold legal presentation palette.',
  financial:
    'A professional financial audit flowchart showing $26,000 vehicle sale netting $14,300 seasoned liquid savings and $2,200 monthly rent support, clean corporate accounting diagram style.',
  trust:
    'An architectural estate trust diagram representing a $2.3M California Revocable Living Trust and active Power of Attorney fiduciary duty, clean legal vector infographic.',
};

function EvidenceDiagram() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const run = async (overridePrompt?: string) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p) return;
    setLoading(true);

    const payload = {
      instances: [{ prompt: p }],
      parameters: { sampleCount: 1 },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    try {
      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;
      if (base64Data) {
        setImageUrl(`data:image/png;base64,${base64Data}`);
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const usePreset = (type: string) => {
    setPrompt(diagramPrompts[type]);
    run(diagramPrompts[type]);
  };

  return (
    <div className="ai-subtool space-y-6">
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Visual Evidence Diagram &amp; Infographic Studio</h3>
          <p className="text-xs text-slate-500">
            Uses <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">imagen-4.0-generate-001</code> to
            synthesize visual evidence charts and infographics for binder presentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => usePreset('co-parenting')}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left hover:border-emerald-500 bg-white dark:bg-slate-800 transition text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">🗺️ Co-Parenting Map</strong>
            <span className="text-slate-500 text-[11px]">Kelowna to California parenting journey diagram.</span>
          </button>
          <button
            onClick={() => usePreset('financial')}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left hover:border-emerald-500 bg-white dark:bg-slate-800 transition text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">📊 Financial Provenance Flow</strong>
            <span className="text-slate-500 text-[11px]">Vehicle sale equity to liquid savings audit chart.</span>
          </button>
          <button
            onClick={() => usePreset('trust')}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-left hover:border-emerald-500 bg-white dark:bg-slate-800 transition text-xs"
          >
            <strong className="block text-slate-900 dark:text-white font-bold">🏛️ U.S. Estate &amp; Trust Chart</strong>
            <span className="text-slate-500 text-[11px]">$2.3M Aptos Living Trust &amp; POA structure.</span>
          </button>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">Custom Visual Prompt</label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the visual evidence diagram or legal infographic you wish to generate..."
            className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-sans"
          />
        </div>

        <button
          onClick={() => run()}
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>Generating Diagram with Imagen 4.0...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Generate Visual Evidence Diagram</span>
            </>
          )}
        </button>
      </div>

      {imageUrl && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 text-center">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              <i className="fa-solid fa-file-image mr-1"></i> Generated Evidence Infographic
            </span>
            <a href={imageUrl} download="Evidence_Infographic.png" className="text-xs text-navy-600 dark:text-gold-400 font-bold hover:underline">
              <i className="fa-solid fa-download"></i> Download PNG
            </a>
          </div>
          <div className="relative min-h-[250px] flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden">
            <img src={imageUrl} className="max-h-[500px] w-auto mx-auto object-contain rounded shadow-lg" alt="Generated Legal Diagram" />
          </div>
        </div>
      )}
    </div>
  );
}
