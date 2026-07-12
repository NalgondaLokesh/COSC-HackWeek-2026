#!/usr/bin/env node

// secret-scanner - finds leaked secrets in your codebase
// usage: node scanner.js <path-to-scan>

const fs = require('fs');
const path = require('path');

// load config file if exists
let config = {
  customPatterns: [],
  severityOverrides: {},
  ignorePatterns: [],
  ignoreFiles: [],
  ignoreDirs: []
};

const configPath = path.join(process.cwd(), 'kavach.config.json');
if (fs.existsSync(configPath)) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  } catch (err) {
    console.error('Warning: Failed to parse config file, using defaults');
  }
}

// regex patterns for common secret types
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'HIGH'
  },
  {
    name: 'AWS Secret Key',
    regex: /(?:aws_secret_access_key|aws_secret)\s*[=:]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    severity: 'HIGH'
  },
  {
    name: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
    severity: 'HIGH'
  },
  {
    name: 'Generic API Key',
    regex: /(?:api[_-]?key|apikey)\s*[=:]\s*["']([A-Za-z0-9_\-]{20,})["']/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'Generic Secret',
    regex: /(?:secret|secret[_-]?key)\s*[=:]\s*["']([A-Za-z0-9_\-]{8,})["']/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'Password in Code',
    regex: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"']{4,})["']/gi,
    severity: 'HIGH'
  },
  {
    name: 'Private Key Header',
    regex: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE KEY-----/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Slack Webhook',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{24,}/g,
    severity: 'HIGH'
  },
  {
    name: 'Stripe Key',
    regex: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}/g,
    severity: 'HIGH'
  },
  {
    name: 'JWT Token',
    regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    severity: 'MEDIUM'
  },
  {
    name: 'Database Connection String',
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"']{10,}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Bearer Token',
    regex: /(?:bearer|authorization)\s*[=:]\s*["']?Bearer\s+[A-Za-z0-9_\-.]{20,}["']?/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'HIGH'
  },
  {
    name: 'Heroku API Key',
    regex: /[hH]eroku[A-Za-z_]*[=:]\s*["']?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}["']?/g,
    severity: 'HIGH'
  },
  {
    name: 'SendGrid API Key',
    regex: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
    severity: 'HIGH'
  },
  {
    name: 'Twilio API Key',
    regex: /SK[0-9a-fA-F]{32}/g,
    severity: 'MEDIUM'
  },
  {
    name: 'Hardcoded IP with Port',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}\b/g,
    severity: 'LOW'
  },
  {
    name: 'Email Credentials',
    regex: /(?:smtp|mail|email)[_-]?(?:password|pass|pwd)\s*[=:]\s*["']([^"']{4,})["']/gi,
    severity: 'HIGH'
  }
];

// merge custom patterns from config
if (config.customPatterns && config.customPatterns.length > 0) {
  config.customPatterns.forEach(customPattern => {
    if (customPattern.name && customPattern.regex && customPattern.severity) {
      SECRET_PATTERNS.push({
        name: customPattern.name,
        regex: new RegExp(customPattern.regex, 'g'),
        severity: customPattern.severity.toUpperCase()
      });
    }
  });
}

// apply severity overrides
if (config.severityOverrides) {
  for (const patternName in config.severityOverrides) {
    const pattern = SECRET_PATTERNS.find(p => p.name === patternName);
    if (pattern) {
      pattern.severity = config.severityOverrides[patternName].toUpperCase();
    }
  }
}

// files/dirs we should never scan
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'vendor', ...config.ignoreDirs];
const SKIP_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.pyc'];

// colors for terminal output
const colors = {
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  bgRed: (t) => `\x1b[41m\x1b[37m${t}\x1b[0m`,
  bgYellow: (t) => `\x1b[43m\x1b[30m${t}\x1b[0m`,
  bgGreen: (t) => `\x1b[42m\x1b[30m${t}\x1b[0m`,
};

function severityColor(severity) {
  if (severity === 'CRITICAL') return colors.bgRed(` ${severity} `);
  if (severity === 'HIGH') return colors.red(severity);
  if (severity === 'MEDIUM') return colors.yellow(severity);
  return colors.gray(severity);
}

// recursively collect all files
function getFiles(dirPath) {
  let results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (let entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.includes(entry.name)) continue;
        results = results.concat(getFiles(fullPath));
      } else {
        let ext = path.extname(entry.name).toLowerCase();
        if (SKIP_EXTENSIONS.includes(ext)) continue;
        
        // check if file is in ignore list
        const fileName = entry.name;
        const relativePath = path.relative(process.cwd(), fullPath);
        if (config.ignoreFiles && config.ignoreFiles.some(ignore => fileName === ignore || relativePath.includes(ignore))) {
          continue;
        }
        
        results.push(fullPath);
      }
    }
  } catch (err) {
    // permission denied or something, just skip
  }
  return results;
}

// scan a single file for secrets
function scanFile(filePath) {
  let findings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let pattern of SECRET_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // check if line matches any ignore pattern
        if (config.ignorePatterns && config.ignorePatterns.length > 0) {
          let shouldIgnore = false;
          for (let ignorePattern of config.ignorePatterns) {
            try {
              const ignoreRegex = new RegExp(ignorePattern, 'i');
              if (ignoreRegex.test(line)) {
                shouldIgnore = true;
                break;
              }
            } catch (err) {
              // invalid regex, skip this pattern
            }
          }
          if (shouldIgnore) continue;
        }
        
        // reset regex state
        pattern.regex.lastIndex = 0;
        let match;
        while ((match = pattern.regex.exec(line)) !== null) {
          // mask the secret value for display
          let secret = match[0];
          let masked = secret.substring(0, 6) + '...' + secret.substring(secret.length - 4);
          if (secret.length < 12) masked = secret.substring(0, 3) + '***';

          findings.push({
            file: filePath,
            line: i + 1,
            type: pattern.name,
            severity: pattern.severity,
            match: masked,
            context: line.trim().substring(0, 120)
          });
        }
      }
    }
  } catch (err) {
    // binary file or encoding issue, skip it
  }

  return findings;
}

// animation helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeText(text, color = colors.bold, delay = 30) {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(color(text[i]));
    await sleep(delay);
  }
  console.log('');
}

async function showBanner() {
  console.log('');
  await typeText('  ╔══════════════════════════════════════╗', colors.bold, 10);
  await typeText('  ║     �️  Kavach                      ║', colors.bold, 15);
  await typeText('  ║     Detect leaked secrets in code    ║', colors.cyan, 15);
  await typeText('  ╚══════════════════════════════════════╝', colors.bold, 10);
  console.log('');
}

async function showSpinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  return new Promise(resolve => {
    const interval = setInterval(() => {
      process.stdout.write(`\r  ${colors.cyan(frames[i])} ${message}`);
      i = (i + 1) % frames.length;
    }, 80);
    
    resolve(() => {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(message.length + 4) + '\r');
    });
  });
}

// main
async function main() {
  const args = process.argv.slice(2);

  await showBanner();

  if (args.length === 0) {
    console.log('  Usage: node scanner.js <path-to-scan>');
    console.log('  Example: node scanner.js ./my-project');
    console.log('');
    process.exit(0);
  }

  const targetPath = path.resolve(args[0]);

  if (!fs.existsSync(targetPath)) {
    console.error(colors.red(`  Error: Path not found: ${targetPath}`));
    process.exit(1);
  }

  // collect files
  let files = [];
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    files = getFiles(targetPath);
  } else {
    files = [targetPath];
  }

  const stopSpinner = await showSpinner(`Scanning ${files.length} files...`);
  await sleep(500);
  stopSpinner();

  console.log(colors.cyan(`  ✓ Found ${files.length} files to scan`));
  console.log(colors.gray(`  └─ Path: ${targetPath}`));
  console.log(colors.gray(`  └─ Patterns: ${SECRET_PATTERNS.length} secret types`));
  console.log('');

  let allFindings = [];
  let scannedCount = 0;

  for (let file of files) {
    let findings = scanFile(file);
    allFindings = allFindings.concat(findings);
    scannedCount++;
    
    // show progress every 10 files
    if (scannedCount % 10 === 0) {
      process.stdout.write(`\r  ${colors.cyan('⏳')} Progress: ${scannedCount}/${files.length} files`);
    }
  }
  
  // clear progress line
  if (files.length >= 10) {
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }

  // display results
  if (allFindings.length === 0) {
    console.log(colors.bgGreen(' CLEAN ') + colors.green(' No secrets detected! Your code is clean.'));
    console.log('');
  } else {
    console.log(colors.bgRed(` ALERT `) + colors.red(` Found ${allFindings.length} potential secret(s)!`));
    console.log('');

    // group by file
    let grouped = {};
    for (let f of allFindings) {
      if (!grouped[f.file]) grouped[f.file] = [];
      grouped[f.file].push(f);
    }

    for (let file in grouped) {
      let relPath = path.relative(targetPath, file) || file;
      console.log(colors.bold(`  📄 ${relPath}`));

      for (let finding of grouped[file]) {
        console.log(`     Line ${colors.cyan(String(finding.line))} │ ${severityColor(finding.severity)} │ ${colors.bold(finding.type)}`);
        console.log(`     ${colors.gray('Match:')} ${colors.yellow(finding.match)}`);
        console.log(`     ${colors.gray('Context:')} ${finding.context}`);
        console.log('');
      }
    }
  }

  // summary
  let critical = allFindings.filter(f => f.severity === 'CRITICAL').length;
  let high = allFindings.filter(f => f.severity === 'HIGH').length;
  let medium = allFindings.filter(f => f.severity === 'MEDIUM').length;
  let low = allFindings.filter(f => f.severity === 'LOW').length;

  console.log(colors.bold('  ── Summary ──────────────────────────'));
  console.log(`  Files scanned:  ${colors.cyan(String(scannedCount))}`);
  console.log(`  Secrets found:  ${allFindings.length > 0 ? colors.red(String(allFindings.length)) : colors.green('0')}`);
  if (allFindings.length > 0) {
    console.log(`  Critical: ${critical}  High: ${high}  Medium: ${medium}  Low: ${low}`);
  }
  console.log('');

  // exit with error code if secrets found (useful for CI/CD)
  process.exit(allFindings.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(colors.red('Error:'), err.message);
  process.exit(1);
});
