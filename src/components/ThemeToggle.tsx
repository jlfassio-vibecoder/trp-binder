import { useEffect, useState } from 'react';

/**
 * Dark-mode toggle. Ports the original inline `themeToggle` click handler
 * (`document.documentElement.classList.toggle('dark')`) into a React island.
 * Persists the choice to localStorage so it matches the anti-flash inline
 * script in BaseLayout.astro.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (e) {
      /* ignore */
    }
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      className="p-1.5 bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white rounded border border-navy-700 transition"
      title="Toggle Dark Mode"
    >
      {isDark ? (
        <i className="fa-solid fa-sun text-gold-400"></i>
      ) : (
        <i className="fa-solid fa-moon"></i>
      )}
    </button>
  );
}
