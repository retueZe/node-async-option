#!/usr/bin/env node
import { rmSync } from 'node:fs'

const buildDirs = ['dist', 'coverage', 'async', 'iteration', 'parsers', 'utils']

for (const buildDir of buildDirs)
    rmSync(buildDir, {recursive: true, force: true})
