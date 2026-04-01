/**
 * One-shot script: migrates temp.json profile.collections from v2 → v3 schema.
 * Usage: node scripts/migrate-json-to-v3.mjs <input.json> [output.json]
 * Output defaults to the same file (in-place).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateCollectionsStateFromV2ToV3 } from '../web/src/budget/core/pure.js'

const inputPath = resolve(process.argv[2] ?? 'temp.json')
const outputPath = resolve(process.argv[3] ?? inputPath)

const raw = readFileSync(inputPath, 'utf8')
const snapshot = JSON.parse(raw)

if (!snapshot?.profile?.collections) {
  console.error('[migrate] No profile.collections found in input file.')
  process.exit(1)
}

const [migratedCollections, migrationError] = migrateCollectionsStateFromV2ToV3(snapshot.profile.collections)
if (migrationError || !migratedCollections) {
  console.error('[migrate] Migration failed:', migrationError)
  process.exit(1)
}

const migratedSnapshot = {
  ...snapshot,
  profile: {
    ...snapshot.profile,
    collections: migratedCollections
  }
}

writeFileSync(outputPath, JSON.stringify(migratedSnapshot, null, 2), 'utf8')
console.info(`[migrate] Done. schemaVersion → ${migratedCollections.schemaVersion}`)
console.info(`  records:     ${migratedCollections.records.length}`)
console.info(`  instruments: ${migratedCollections.instruments.length}`)
console.info(`  goals:       ${migratedCollections.goals.length}`)
console.info(`  personas:    ${migratedCollections.personas.length}`)
console.info(`  Output:      ${outputPath}`)
