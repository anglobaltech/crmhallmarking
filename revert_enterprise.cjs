const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const replacements = [
  // Revert layout gaps and padding
  { p: /className="page-enter space-y-4"/g, r: 'className="page-enter flex flex-col gap-8 pb-12"' },
  { p: /gap-4/g, r: 'gap-8' },
  { p: /p-4 md:p-5/g, r: 'p-6 md:p-8' },
  { p: /p-4 md:p-6/g, r: 'p-6 md:p-10 lg:p-12' },
  { p: /p-4/g, r: 'p-6' },
  { p: /p-5/g, r: 'p-8' },
  
  // Revert oversized table padding
  { p: /px-4 py-3/g, r: 'px-6 py-5' },
  
  // Convert overly heavy text sizing
  { p: /text-2xl font-bold/g, r: 'text-3xl font-extrabold' },
  { p: /rounded-lg/g, r: 'rounded-2xl' },
  { p: /rounded-md/g, r: 'rounded-xl' },
  
  // Convert blue highlights to amber
  { p: /blue/g, r: 'amber' },
  { p: /bg-amber-600 hover:bg-amber-700/g, r: 'bg-gradient-to-r from-amber-500 to-amber-600' },
  { p: /bg-amber-500 hover:bg-amber-600/g, r: 'bg-gradient-to-r from-amber-400 to-amber-500' },
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
