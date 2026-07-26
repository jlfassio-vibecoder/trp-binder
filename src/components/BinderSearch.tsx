import { useState } from 'react';

/**
 * Master Index search filter. The table itself stays as static Astro markup
 * (#content-master tbody tr) for content fidelity, so this island filters it
 * imperatively via the DOM — an exact port of the original vanilla
 * `binderSearch` input listener.
 */
export default function BinderSearch() {
  const [value, setValue] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setValue(query);
    const lower = query.toLowerCase();
    const rows = document.querySelectorAll<HTMLTableRowElement>('#content-master tbody tr');
    rows.forEach((row) => {
      const text = (row.innerText || row.textContent || '').toLowerCase();
      row.style.display = text.includes(lower) ? '' : 'none';
    });
  };

  return (
    <div className="relative min-w-[220px]">
      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      <input
        type="text"
        id="binderSearch"
        placeholder="Search exhibits or law..."
        value={value}
        onChange={onChange}
        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500"
      />
    </div>
  );
}
