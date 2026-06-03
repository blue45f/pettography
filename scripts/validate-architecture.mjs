import fs from 'node:fs'

const ROOT = process.cwd()
const packageJsonPath = `${ROOT}/package.json`
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, `utf8`))
const scripts = pkg.scripts || {}

const requiredPaths = ['README.md', 'docs/ARCHITECTURE.md', 'docs/DEVELOPMENT.md', 'package.json']

const requiredScripts = ['verify', 'ci']

const missing = []
for (const file of requiredPaths) {
  if (!fs.existsSync(`${ROOT}/${file}`)) {
    missing.push(`file://${file}`)
  }
}

for (const script of requiredScripts) {
  if (!scripts[script]) {
    missing.push(`script://${script}`)
  }
}

// pettography uses a root-level web app (src/ + vite.config.ts) alongside a
// separate backend/ (socket.io, no DB) wired together via pnpm-workspace.yaml.
// Assert this documented layout directly — package.json has no `workspaces`
// field (pnpm workspaces are declared in pnpm-workspace.yaml), so we must not
// gate the structure check on it.
const requiredLayout = ['backend', 'src', 'vite.config.ts', 'pnpm-workspace.yaml']

for (const entry of requiredLayout) {
  if (!fs.existsSync(`${ROOT}/${entry}`)) {
    missing.push(`layout://${entry}`)
  }
}

if (missing.length > 0) {
  console.error(`architecture validation failed: ${missing.length} issue(s)`)
  for (const item of missing) {
    console.error(` - missing: ${item}`)
  }
  process.exit(1)
}

console.log('architecture validation passed: required files and scripts are present')
