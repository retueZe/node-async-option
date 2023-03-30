#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { Option, program } from 'commander'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exit } from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function* readDirRec(path) {
    for (const _subpath of readdirSync(path)) {
        const subpath = join(path, _subpath)
        const stats = statSync(subpath)

        if (stats.isFile())
            yield subpath
        else if (stats.isDirectory())
            yield* readDirRec(subpath)
    }
}
function buildNamespaces() {
    const packageName = 'async-option'
    const entryPoints = new Set([...readDirRec('dist')]
        .filter(file => !file.includes('.chunks'))
        .map(file => file.replace(/\.[^\\/]+$/, ''))
        .filter(file => !file.endsWith('index')))
    const packageTemplate = readFileSync(join(__dirname, 'build/package-template.json'), {encoding: 'utf-8'})

    for (const entryPoint of entryPoints) {
        const namespacePathSegments = entryPoint.split(/[\\/]/)
        const indexPathSegments = [...namespacePathSegments]
        namespacePathSegments.shift()
        const namespacePath = namespacePathSegments.join('/')
        indexPathSegments.unshift(...Array.from({length: indexPathSegments.length - 1}, () => '..'))
        const indexPath = indexPathSegments.join('/')
        const packageContent = packageTemplate
            .replaceAll('<(PACKAGE_NAME)', packageName)
            .replaceAll('<(NAMESPACE_PATH)', namespacePath)
            .replaceAll('<(INDEX_PATH)', indexPath)
        const packagePath = join(namespacePath, 'package.json')

        mkdirSync(namespacePath, {recursive: true})
        writeFileSync(packagePath, packageContent)
    }
}

program
    .addOption(new Option('-c, --config <configiration>').choices(['dev', 'development', 'prod', 'production', 'test']))
    .option('-r, --retrain')
    .action(({config, retrain: _retrain}) => {
        try {
            config ??= 'dev'
            const isDevelopment = config !== 'prod' && config !== 'production'
            const tscConfig = config === 'test'
                ? 'tsconfig.test.json'
                : 'tsconfig.json'
            const retrain = _retrain ?? false

            if (!retrain) execSync(join(__dirname, 'build-cleanup.mjs'))
            if (isDevelopment) {
                execSync(`tsc -p ${tscConfig} --outDir dist --module commonjs --inlineSourceMap`)
            } else {
                execSync('rollup -c')
                buildNamespaces()
            }
        } catch (error) {
            if (typeof error !== 'object') return
            if (typeof error.stdout !== 'undefined')
                process.stderr.write(error.stdout)
            else if (error instanceof Error)
                process.stderr.write(`${error.name}: ${error.message}`)
            if (typeof error.stderr !== 'undefined')
                process.stderr.write(error.stderr)

            exit(1)
        }
    })
    .parse()
