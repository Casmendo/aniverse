const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./frontend');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace src={a.cover || picsum} with src={a.cover}
  content = content.replace(/\|\|\s*[`"']https:\/\/picsum\.photos\/seed\/[^`"']+[`"']/g, '');

  // Replace setSrc(picsum) with setSrc('')
  content = content.replace(/setSrc\([`"']https:\/\/picsum\.photos\/seed\/[^`"']+[`"']\)/g, "setSrc('')");

  // Replace onError src=picsum with style.display='none'
  content = content.replace(/onError=\{e\s*=>\s*\{\s*\(\s*e\.target\s+as\s+HTMLImageElement\s*\)\.src\s*=\s*[`"']https:\/\/picsum\.photos\/seed\/[^`"']+[`"']\s*;\s*\}\}/g, 
    "onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}");

  // Handle some edge cases where it's wrapped in a template literal like src={cover || `https...`}
  content = content.replace(/cover\s*\|\|\s*[`"']https:\/\/picsum\.photos[^`"']+[`"']/g, 'cover');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
