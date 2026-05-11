const fs = require('fs');
const path = require('path');

const IGNORE_LIST = [
  'node_modules',
  '.next',
  '.git',
  'package-lock.json',
  'favicon.ico',
  '.gitignore',
  'generate-summary.js' 
];

const OUTPUT_FILE = 'projeto_completo.txt';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (IGNORE_LIST.includes(file)) return;

    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function generateTxt() {
  const allFiles = walk(process.cwd());
  let content = `ESTRUTURA DO PROJETO: ${path.basename(process.cwd())}\n`;
  content += `Gerado em: ${new Date().toLocaleString()}\n\n`;
  content += `================================================\n\n`;

  allFiles.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    const fileData = fs.readFileSync(file, 'utf8');

    content += `ARQUIVO: ${relativePath}\n`;
    content += `--- INÍCIO DO CÓDIGO ---\n`;
    content += fileData;
    content += `\n--- FIM DO CÓDIGO ---\n\n`;
    content += `================================================\n\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`✅ Sucesso! O arquivo "${OUTPUT_FILE}" foi gerado com toda a sua estrutura.`);
}

generateTxt();