const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const replacements = [
  // Beautiful balanced gaps
  { p: /className="page-enter flex flex-col gap-8 pb-12"/g, r: 'className="page-enter space-y-6 pb-12"' },
  { p: /gap-8/g, r: 'gap-6' },
  { p: /p-6 md:p-10 lg:p-12/g, r: 'p-6 md:p-8' },
  { p: /p-8/g, r: 'p-6' },
  
  // Balanced table padding (between dense and huge)
  { p: /px-6 py-5/g, r: 'px-5 py-3.5' },
  
  // Refined text sizing
  { p: /text-3xl font-extrabold/g, r: 'text-2xl font-bold tracking-tight' },
  { p: /rounded-2xl/g, r: 'rounded-xl' },
  
  // Premium soft gradients
  { p: /bg-gradient-to-r from-amber-500 to-amber-600/g, r: 'bg-gradient-to-tr from-amber-500 to-amber-400 shadow-sm shadow-amber-500/20 text-white' },
  { p: /bg-gradient-to-r from-amber-400 to-amber-500/g, r: 'bg-gradient-to-tr from-amber-400 to-amber-300 shadow-sm shadow-amber-500/20 text-white' },
];

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(rep => {
    content = content.replace(rep.p, rep.r);
  });
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + f);
});
