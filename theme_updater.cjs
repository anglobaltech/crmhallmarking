const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = ['FireAssaying.jsx', 'Customers.jsx', 'Reports.jsx', 'GoldExchange.jsx', 'LaserCutting.jsx', 'XRFTesting.jsx', 'Soldering.jsx', 'SettingsPage.jsx'];

const replacements = [
  { p: /bg-slate-900/g, r: 'bg-white' },
  { p: /bg-slate-800\/80/g, r: 'bg-slate-100' },
  { p: /bg-slate-800\/50/g, r: 'glass-panel' },
  { p: /bg-slate-800/g, r: 'bg-slate-50' },
  { p: /border-slate-700\/50/g, r: 'border-slate-200' },
  { p: /border-slate-700/g, r: 'border-slate-200' },
  { p: /border-slate-600/g, r: 'border-slate-300' },
  { p: /text-white/g, r: 'text-slate-800' },
  { p: /text-slate-400/g, r: 'text-slate-600' },
  { p: /text-slate-300/g, r: 'text-slate-700' },
  { p: /hover:text-white/g, r: 'hover:text-slate-900' },
  { p: /hover:bg-slate-800/g, r: 'hover:bg-slate-100' },
  { p: /bg-black\/70/g, r: 'bg-slate-900/40' },
  { p: /divide-slate-700\/30/g, r: 'divide-slate-100' },
  { p: /bg-transparent text-sm text-white/g, r: 'bg-transparent text-sm text-slate-800' },
  { p: /className="page-enter space-y-6"/g, r: 'className="page-enter flex flex-col gap-6 pb-12"' }
];

files.forEach(f => {
  const filePath = path.join(dir, f);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(rep => {
    content = content.replace(rep.p, rep.r);
  });
  
  // Also bump padding inside tables
  content = content.replace(/px-4 py-3/g, 'px-6 py-5');
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + f);
});
