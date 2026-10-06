const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docFiles = [
  'ARCHITECTURE.md',
  'DATABASE_SCHEMA.md',
  'API_SPEC.md',
  'AI_PIPELINE.md',
  'SECURITY.md',
  'TEST_PLAN.md',
  'DEVELOPMENT_PHASES.md',
];

docFiles.forEach((file) => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(docsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> docs/${file}`);
  }
});
