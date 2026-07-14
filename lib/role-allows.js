// Single source of the per-role path authorization map.
//
// Imported by BOTH middleware.js (the gate on protected HTML routes) and
// api/pdf.js (the PDF-download authorizer). Keeping it in one module means a
// role tightened here changes both call sites at once — there is no second copy
// to drift out of sync.
//
// Each role may view only its own page and that page's `/<slug>-` sub-pages.
// The predicate is matched against the PUBLIC URL path (e.g. '/corporate.html'),
// never the private/ file path.
export const ROLE_ALLOWS = {
  corporate: (p) => p === '/corporate.html' || p.startsWith('/corporate-'),
  alex0349: (p) => p === '/alex0349.html' || p.startsWith('/alex0349-'),
  july4: (p) => p === '/july4.html' || p.startsWith('/july4-'),
  july4v2: (p) => p === '/july4v2.html' || p.startsWith('/july4v2-'),
  gp250corp: (p) => p === '/gp250corp.html' || p.startsWith('/gp250corp-'),
  gp250gov: (p) => p === '/gp250gov.html' || p.startsWith('/gp250gov-'),
  gp250sponsor: (p) => p === '/gp250sponsor.html' || p.startsWith('/gp250sponsor-'),
  july4p2: (p) => p === '/july4p2.html' || p.startsWith('/july4p2-'),
  newdam1: (p) => p === '/newdam1.html' || p.startsWith('/newdam1-'),
  newdamv2: (p) => p === '/newdamv2.html' || p.startsWith('/newdamv2-'),
  imaritravel: (p) => p === '/imaritravel.html' || p.startsWith('/imaritravel-'),
  imariinvestors: (p) => p === '/imariinvestors.html' || p.startsWith('/imariinvestors-'),
  imariinvestord: (p) => p === '/imariinvestord.html' || p.startsWith('/imariinvestord-'),
  rocktravel: (p) => p === '/rocktravel.html' || p.startsWith('/rocktravel-'),
  tag: (p) => p === '/tag.html' || p.startsWith('/tag-'),
  stfl3: (p) => p === '/stfl3.html' || p.startsWith('/stfl3-'),
  aba: (p) => p === '/aba.html' || p.startsWith('/aba-'),
  imariinfo26: (p) => p === '/imariinfo26.html' || p.startsWith('/imariinfo26-'),
  recovery: (p) => p === '/recovery.html' || p.startsWith('/recovery-'),
  execbranch: (p) => p === '/execbranch.html' || p.startsWith('/execbranch-'),
  stats: (p) => p === '/stats.html' || p.startsWith('/stats-'),
};
