#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Add .js extensions to relative imports in Prisma generated files
const prismaDirs = [
  path.join(__dirname, '..', 'src', 'generated', 'prisma'),
  path.join(__dirname, '..', 'generated', 'prisma') // old generated directory
].filter(dir => fs.existsSync(dir));

function addJsExtensions(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative imports and exports: add .js extension for runtime
  // Match import ... from "..." and export ... from "..."
  content = content.replace(
    /((?:import|export)\s+.*?\s+from\s+['"]\.[^'"]+?)(\.ts)?(['"])/g,
    (match, statement, ext, quote) => {
      // Remove .ts if present and add .js
      const cleanStatement = statement.replace(/\.ts$/, '');
      if (!cleanStatement.endsWith('.js')) {
        return cleanStatement + '.js' + quote;
      }
      return match;
    }
  );
  
  fs.writeFileSync(filePath, content);
}

// Process all .ts files in the prisma directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      addJsExtensions(filePath);
      console.log(`Processed: ${filePath}`);
    }
  }
}

for (const dir of prismaDirs) {
  console.log(`Processing directory: ${dir}`);
  processDirectory(dir);
}

console.log('Done adding .js extensions to Prisma generated files');