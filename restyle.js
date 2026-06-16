const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const dirs = [
  'frontend/app/manga',
  'frontend/components/manga'
];

let files = [];
dirs.forEach(d => {
  if (fs.existsSync(d)) files = files.concat(walk(d));
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/radial-gradient\(ellipse at top, #0f0204 0%, #06141B 40%\)/g, 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 40%)');
  content = content.replace(/radial-gradient\(ellipse at center, #1a0a0a 0%, #06141B 50%, #000 100%\)/g, 'radial-gradient(ellipse at center, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)');
  content = content.replace(/linear-gradient\(135deg, #1a0205, #06141B\)/g, 'linear-gradient(135deg, #f1f5f9, #ffffff)');
  content = content.replace(/bg-\[#06141B\]/g, 'bg-white');
  content = content.replace(/bg-\[#0f0204\]/g, 'bg-slate-50');
  content = content.replace(/bg-\[#0d0204\]/g, 'bg-white');
  content = content.replace(/bg-\[#0d0505\]/g, 'bg-white');

  // Red Backgrounds
  content = content.replace(/bg-red-950\/10/g, 'bg-blue-50');
  content = content.replace(/bg-red-950\/15/g, 'bg-blue-50');
  content = content.replace(/bg-red-950\/20/g, 'bg-blue-50');
  content = content.replace(/bg-red-950\/30/g, 'bg-blue-100');
  content = content.replace(/bg-red-950\/60/g, 'bg-blue-100');
  
  content = content.replace(/bg-red-900\/20/g, 'bg-blue-100');
  content = content.replace(/bg-red-900\/30/g, 'bg-blue-100');
  content = content.replace(/bg-red-900\/40/g, 'bg-blue-200');
  content = content.replace(/bg-red-900\/60/g, 'bg-blue-200');

  content = content.replace(/bg-red-600/g, 'bg-blue-600');
  content = content.replace(/bg-red-500/g, 'bg-blue-500');
  content = content.replace(/bg-red-800/g, 'bg-blue-800');
  content = content.replace(/bg-red-700/g, 'bg-blue-700');
  
  // Borders
  content = content.replace(/border-red-900\/10/g, 'border-blue-200');
  content = content.replace(/border-red-900\/15/g, 'border-blue-200');
  content = content.replace(/border-red-900\/20/g, 'border-blue-200');
  content = content.replace(/border-red-900\/30/g, 'border-blue-300');
  content = content.replace(/border-red-900\/40/g, 'border-blue-300');
  content = content.replace(/border-red-800\/30/g, 'border-blue-400');
  content = content.replace(/border-red-800\/40/g, 'border-blue-400');
  content = content.replace(/border-red-700\/30/g, 'border-blue-400');
  content = content.replace(/border-red-700\/40/g, 'border-blue-400');
  content = content.replace(/border-red-950\/20/g, 'border-blue-200');
  content = content.replace(/border-red-950\/25/g, 'border-blue-200');
  content = content.replace(/border-red-950\/30/g, 'border-blue-200');
  content = content.replace(/border-red-600/g, 'border-blue-600');

  // Text colors
  content = content.replace(/text-red-900/g, 'text-blue-900');
  content = content.replace(/text-red-800/g, 'text-blue-800');
  content = content.replace(/text-red-600\/60/g, 'text-blue-600/60');
  content = content.replace(/text-red-600/g, 'text-blue-600');
  content = content.replace(/text-red-500\/60/g, 'text-blue-500/60');
  content = content.replace(/text-red-500/g, 'text-blue-500');
  content = content.replace(/text-red-400\/70/g, 'text-blue-600/70');
  content = content.replace(/text-red-400/g, 'text-blue-600');
  content = content.replace(/text-red-300/g, 'text-blue-700');
  
  // Specific text swaps for light mode
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-100/g, 'text-slate-800');
  content = content.replace(/text-slate-200/g, 'text-slate-800');
  content = content.replace(/text-slate-300/g, 'text-slate-700');
  content = content.replace(/text-slate-400/g, 'text-slate-600');
  content = content.replace(/text-slate-500/g, 'text-slate-500');
  
  // Undo text-slate-900 back to text-white if it's inside a blue button
  content = content.replace(/bg-blue-600 text-slate-900/g, 'bg-blue-600 text-white');
  content = content.replace(/bg-blue-500 text-slate-900/g, 'bg-blue-500 text-white');
  
  // Background transparencies for light mode
  content = content.replace(/bg-black\/30/g, 'bg-slate-100');
  content = content.replace(/bg-black\/20/g, 'bg-slate-50');
  content = content.replace(/bg-black\/70/g, 'bg-white/90');
  content = content.replace(/bg-black\/80/g, 'bg-white/95');
  
  // Shadows
  content = content.replace(/rgba\(225,29,72,/g, 'rgba(37,99,235,');

  // Any other stray "red"
  content = content.replace(/from-red-600 to-red-900/g, 'from-blue-600 to-blue-800');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Updated " + file);
  }
});
