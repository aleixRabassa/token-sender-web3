import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { transformSync } from 'esbuild';

const setupFile = process.argv[2];
if (!setupFile) {
  console.error('Usage: compute-hash.mjs <setup-file>');
  process.exit(1);
}

const sourceCode = readFileSync(setupFile, 'utf8');

function extractFunctionBody(source) {
  const funcStart = source.search(/defineWalletSetup\s*\([^,]*,\s*async\s*\(/);
  if (funcStart === -1) return null;
  const arrowIndex = source.indexOf('=>', funcStart);
  if (arrowIndex === -1) return null;
  const bodyStart = source.indexOf('{', arrowIndex);
  if (bodyStart === -1) return null;
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(bodyStart, i + 1);
    }
  }
  return null;
}

const body = extractFunctionBody(sourceCode);
if (!body) {
  console.error('Could not extract function');
  process.exit(1);
}

const functionString = `async () => ${body}`;
const { code } = transformSync(functionString, {
  format: "esm",
  minifyWhitespace: true,
  target: "es2022",
  drop: ["console", "debugger"],
  loader: "ts",
  logLevel: "silent",
  platform: "node"
});
const hash = createHash("shake256", { outputLength: 10 });
process.stdout.write(hash.update(code).digest('hex') + '\n');
