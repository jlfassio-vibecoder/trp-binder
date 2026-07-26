import { useEffect, useState } from 'react';

export interface SectionTab {
  id: string;
  badge: string;
  label: string;
}

/**
 * Tab bar + tab-panel show/hide behavior for the Strategy Brief page.
 * Mirrors TabBar.tsx's approach on the binder page: the panels hold large
 * static prose blocks rendered by Astro at build time, so they stay as plain
 * markup and this island only toggles their visibility (same imperative
 * `.hidden` class-toggling the binder's TabBar and the original vanilla
 * `switchTab()` both use). Tabs are passed in as a prop since the brief's
 * sections are parsed from markdown at build time rather than hardcoded.
 */
export default function SectionTabBar({ tabs }: { tabs: SectionTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.brief-tab-content').forEach((el) => {
      el.classList.add('hidden');
    });
    const target = document.getElementById('content-' + active);
    if (target) target.classList.remove('hidden');
  }, [active]);

  return (
    <div className="no-print flex overflow-x-auto scrollbar-thin space-x-1 sm:space-x-2 border-b border-slate-300 dark:border-slate-700 pb-0">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const baseClasses =
          'tab-btn px-3 sm:px-4 py-2.5 rounded-t-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 border-t border-x';
        const activeClasses =
          'active bg-white dark:bg-slate-800 text-navy-900 dark:text-gold-400 border-t-2 border-t-navy-800 dark:border-t-gold-500 border-x-slate-300 dark:border-x-slate-700';
        const inactiveClasses =
          'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-gold-300 border-x-transparent';

        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            id={`tab-btn-${tab.id}`}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            <span
              className={
                isActive
                  ? 'px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-700 dark:text-gold-300 text-xs font-bold'
                  : 'px-1.5 py-0.5 rounded bg-slate-300 dark:bg-slate-700 text-xs font-bold'
              }
            >
              {tab.badge}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
