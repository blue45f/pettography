// Backend has its own eslint.config.mjs and is verified separately; the root
// eslint can't type-lint backend/ files per-file (projectService sees both the
// root and backend tsconfig as candidates). So route backend files to prettier
// only here and let frontend files go through the root eslint.
const isBackend = (f) => /(^|\/)backend\//.test(f)
const q = (files) => files.map((f) => JSON.stringify(f)).join(' ')

export default {
  '*.{ts,tsx,js,jsx}': (files) => {
    const frontend = files.filter((f) => !isBackend(f))
    const cmds = []
    if (frontend.length) cmds.push(`eslint --fix ${q(frontend)}`)
    cmds.push(`prettier --write ${q(files)}`)
    return cmds
  },
  '*.{json,md,css,html,yml,yaml}': (files) => [`prettier --write ${q(files)}`],
}
