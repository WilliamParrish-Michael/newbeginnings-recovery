// Prefix internal links with the deploy base path (e.g. /newbeginnings-recovery/
// on GitHub Pages, / on the real domain). External / tel / mailto / hash pass through.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p: string): string => {
  if (/^(https?:|tel:|mailto:|#)/.test(p)) return p;
  const path = p.startsWith('/') ? p : '/' + p;
  return (base + path) || '/';
};
