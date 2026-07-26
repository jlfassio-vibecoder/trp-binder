import { useEffect, useState } from 'react';

/**
 * Tab bar + tab-panel show/hide behavior.
 *
 * State-sharing choice: the 8 tab panels (#content-master, #content-tab1..7)
 * hold a large amount of static legal/exhibit text, so they stay as plain
 * Astro-rendered markup rather than being pulled into a React tree (that
 * would balloon this island's hydrated bundle for content that never
 * changes). Only this one island needs to know which tab is active, so a
 * cross-island store (nanostores) isn't needed here — a single component
 * with local `useState` plus the same imperative DOM class-toggling the
 * original vanilla `switchTab()` used is the simplest faithful port.
 *
 * For backwards compatibility with the static markup elsewhere on the page
 * (e.g. the Master Index "Read Brief" button, which needs to jump to Tab 2),
 * this component also exposes `window.switchTab(tabId)` — identical call
 * signature to the original inline `onclick="switchTab('tab2')"`.
 */
const TABS = [
  { id: 'master', icon: 'fa-solid fa-list-check', label: 'Master Index', badge: null },
  { id: 'tab1', icon: null, label: 'Forms & Fees', badge: '1' },
  { id: 'tab2', icon: null, label: 'Legal Submission Brief', badge: '2' },
  { id: 'tab3', icon: null, label: 'BIOC & Custody', badge: '3' },
  { id: 'tab4', icon: null, label: 'U.S. Trust & Assets', badge: '4' },
  { id: 'tab5', icon: null, label: 'Financial Provenance', badge: '5' },
  { id: 'tab6', icon: null, label: 'GCMS ATIP Rebuttal', badge: '6' },
  { id: 'tab7', icon: null, label: 'AI Legal Suite & Simulator', badge: null, ai: true },
];

declare global {
  interface Window {
    switchTab?: (tabId: string) => void;
  }
}

export default function TabBar() {
  const [active, setActive] = useState('tab2');

  useEffect(() => {
    window.switchTab = (tabId: string) => setActive(tabId);
    return () => {
      delete window.switchTab;
    };
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.tab-content').forEach((el) => {
      el.classList.add('hidden');
    });
    const target = document.getElementById('content-' + active);
    if (target) target.classList.remove('hidden');
  }, [active]);

  return (
    <div className="no-print flex overflow-x-auto scrollbar-thin space-x-1 sm:space-x-2 border-b border-slate-300 dark:border-slate-700 pb-0">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const baseClasses =
          'tab-btn px-3 sm:px-4 py-2.5 rounded-t-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 border-t border-x';
        const activeClasses =
          'active bg-white dark:bg-slate-800 text-navy-900 dark:text-gold-400 border-t-2 border-t-navy-800 dark:border-t-gold-500 border-x-slate-300 dark:border-x-slate-700';
        const inactiveClasses =
          'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-navy-900 border-x-transparent';
        const aiInactive =
          'bg-slate-200 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:text-purple-900 border-x-transparent';

        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            id={`tab-btn-${tab.id}`}
            className={`${baseClasses} ${isActive ? activeClasses : tab.ai ? aiInactive : inactiveClasses}`}
          >
            {tab.icon && <i className={`${tab.icon} text-navy-600 dark:text-navy-400`}></i>}
            {tab.ai && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold">
                <i className="fa-solid fa-brain"></i>
              </span>
            )}
            {tab.badge && (
              <span
                className={
                  tab.id === 'tab2'
                    ? 'px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-700 dark:text-gold-300 text-xs font-bold'
                    : 'px-1.5 py-0.5 rounded bg-slate-300 dark:bg-slate-700 text-xs font-bold'
                }
              >
                {tab.badge}
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
