import { rmSync } from 'node:fs'

const buildDirs = ['dist', 'async', 'iteration', 'parsers', 'utils']

for (const buildDir of buildDirs)
    rmSync(buildDir, {recursive: true, force: true})
