const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const replacements = [
  // Revert layout gaps and padding
  { p: /className="page-enter flex flex-col gap-6 pb-12"/g, r: 'className="page-enter space-y-4"' },
  { p: /className="page-enter flex flex-col gap-8 pb-12"/g, r: 'className="page-enter space-y-4"' },
  { p: /gap-8/g, r: 'gap-4' },
  { p: /gap-6/g, r: 'gap-4' },
  { p: /p-6 md:p-8/g, r: 'p-4 md:p-5' },
  { p: /p-6 md:p-10 lg:p-12/g, r: 'p-4 md:p-6' },
  { p: /p-6/g, r: 'p-4' },
  { p: /p-8/g, r: 'p-5' },
  
  // Revert oversized table padding
  { p: /px-6 py-5/g, r: 'px-4 py-3' },
  
  // Convert overly heavy text sizing
  { p: /text-3xl font-extrabold/g, r: 'text-2xl font-bold' },
  { p: /rounded-2xl/g, r: 'rounded-lg' },
  { p: /rounded-xl/g, r: 'rounded-md' },
  
  // Convert amber highlights to professional blue
  { p: /amber/g, r: 'blue' },
  { p: /from-blue-500 to-blue-600/g, r: 'bg-blue-600 hover:bg-blue-700' },
  { p: /from-blue-400 to-blue-500/g, r: 'bg-blue-500 hover:bg-blue-600' },
  { p: /bg-gradient-to-r/g, r: '' },
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
