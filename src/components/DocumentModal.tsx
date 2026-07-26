import { useEffect, useState } from 'react';

/**
 * Document inspection modal — ports the original `viewDoc(docId)` /
 * `closeDocModal()` pair. The "Inspect" buttons live in static Astro markup
 * scattered across every tab, so (matching the TabBar approach) this island
 * exposes `window.viewDoc(docId)` for those buttons' existing
 * `onclick="viewDoc('1.1')"` attributes to keep calling, instead of requiring
 * every exhibit card to be rewritten as React.
 */
interface DocInfo {
  title: string;
  ref: string;
  desc: string;
}

const docDetails: Record<string, DocInfo> = {
  '1.1': { title: 'Official Document Checklist (IMM 5557 / IMM 5939)', ref: 'Tab 1.1', desc: 'Mandatory TRP document checklist covering inland and consular submission requirements.' },
  '1.2': { title: 'TRP Application Form (IMM 5708 / Consular)', ref: 'Tab 1.2', desc: 'Duly executed application requesting temporary residence under IRPA s. 24(1) with barcode page on top.' },
  '1.3': { title: 'Use of a Representative Form (IMM 5476)', ref: 'Tab 1.3', desc: 'Formal legal representation agreement designating Ocana Law Group as counsel of record.' },
  '1.4': { title: 'IRCC Fee Payment Receipt ($229.77 / $246.25 CAD)', ref: 'Tab 1.4', desc: 'Official eReceipt confirming payment of statutory TRP processing fee.' },
  '3.1': { title: 'BC Supreme Court Order (Kelowna File No. 139323)', ref: 'Tab 3.1', desc: 'Certified court order granting 50/50 joint physical custody with Term 16 non-relocation restriction.' },
  '3.2': { title: 'Ava’s Academic Enrollment & Activity Records', ref: 'Tab 3.2', desc: 'Official enrollment confirmation from Kelowna School District establishing primary schooling.' },
  '3.3': { title: 'Co-Parenting Calendar & Sworn Schedule Log', ref: 'Tab 3.3', desc: 'Sworn statutory declaration and 2024-2026 detailed parenting schedule logs.' },
  '4.1': { title: 'California Revocable Living Trust Abstract ($2.3M Aptos Estate)', ref: 'Tab 4.1', desc: 'Santa Cruz County assessor records establishing primary beneficiary status over Aptos real estate.' },
  '4.2': { title: 'Active Power of Attorney Legal Designation', ref: 'Tab 4.2', desc: 'State of California legal instrument granting fiduciary power over mother’s estate.' },
  '4.3': { title: 'Chico & Shasta Lake Real Estate Holdings', ref: 'Tab 4.3', desc: 'Public deeds and assessor records for California properties.' },
  '4.4': { title: 'VA Disability Pension & IRS Tax Filings', ref: 'Tab 4.4', desc: 'Official U.S. Dept of Veterans Affairs lifetime pension verification ($2,300/mo CAD).' },
  '5.1': { title: 'Vehicle Equity Sale Paper Trail', ref: 'Tab 5.1', desc: 'Bill of Sale ($26k), Lender Payoff ($7k), and bank deposit receipts establishing $14.3k net liquid equity.' },
  '5.2': { title: 'Mother’s Sworn Rent Support Affidavit', ref: 'Tab 5.2', desc: 'Sworn statutory declaration committing $2,200/mo CAD for Kelowna housing.' },
  '5.3': { title: '6-Month Bank Statements & VA Verification', ref: 'Tab 5.3', desc: 'Complete bank statements demonstrating seasoned liquidity and continuous financial standing.' },
  '6.1': { title: 'CBSA ATIP Disclosure Release P-2026-30692', ref: 'Tab 6.1', desc: 'Full GCMS officer record release containing the Osoyoos POE examination notes.' },
  '6.2': { title: 'Proof of Voluntary Departure — Sept 23, 2024 VR Refusal', ref: 'Tab 6.2', desc: 'Official IRCC portal record and CBP entry stamp confirming immediate voluntary exit.' },
  '6.3': { title: 'Proof of Voluntary Departure — June 3, 2026 Form IMM 1282', ref: 'Tab 6.3', desc: 'Executed Allowed to Leave form confirming voluntary compliance at Osoyoos POE.' },
};

declare global {
  interface Window {
    viewDoc?: (docId: string) => void;
    closeDocModal?: () => void;
  }
}

export default function DocumentModal() {
  const [open, setOpen] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    window.viewDoc = (id: string) => {
      setDocId(id);
      setOpen(true);
    };
    window.closeDocModal = () => setOpen(false);
    return () => {
      delete window.viewDoc;
      delete window.closeDocModal;
    };
  }, []);

  if (!open || !docId) return null;

  const info = docDetails[docId] || {
    title: 'Document Detail',
    ref: `Tab ${docId}`,
    desc: 'Detailed submission document.',
  };

  return (
    <div
      id="docModal"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-gold-500 text-navy-950 font-extrabold rounded text-xs uppercase">
              {info.ref}
            </span>
            <h3 className="font-bold text-base text-white">{info.title}</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold p-1">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
              <span>
                Verification Status:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">Verified & Included in Binder</strong>
              </span>
              <span>Doc ID: {docId}</span>
            </div>
            <p className="text-sm font-sans text-slate-800 dark:text-slate-200 leading-relaxed">{info.desc}</p>
            <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-navy-900 dark:text-gold-400 block mb-1">Legal Relevance:</strong>
              Directly supports IRPA Section 24(1) TRP eligibility, validating compliance history, child's best
              interests, or U.S. domicile ties.
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-500">Official IRPA Submission Binder Document</span>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
