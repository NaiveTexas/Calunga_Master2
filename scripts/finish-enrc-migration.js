// Run only after packing: verify every package before moving PNGs to local backup.
import { readFileSync, readdirSync, statSync, mkdirSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, basename } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const source = join(root, 'public/enrc-static');
const backup = join(root, 'tmp/enrc-png-backup');
const catalog = JSON.parse(readFileSync(join(source, 'pdf-charts.json'), 'utf8'));
if (catalog.charts.length !== 18) throw new Error('Expected 18 charts');
for (const chart of catalog.charts) {
    if (chart.format !== 'pmtiles') throw new Error(`Not migrated: ${chart.chart}`);
    const path = resolve(root, 'public', '.' + chart.url);
    if (!path.startsWith(source + '\\') && !path.startsWith(source + '/')) throw new Error('Invalid archive path');
    const bytes = readFileSync(path);
    if (bytes.length !== chart.archiveBytes || createHash('sha256').update(bytes).digest('hex') !== chart.archiveSha256)
        throw new Error(`Invalid archive: ${chart.chart}`);
}
mkdirSync(backup, { recursive: true });
const activeArchives = new Set(catalog.charts.map(chart => basename(chart.url)));
const archivedPackages = join(backup, 'superseded-pmtiles');
for (const name of readdirSync(join(source, 'pmtiles'))) {
    if (!name.endsWith('.pmtiles') || activeArchives.has(name)) continue;
    mkdirSync(archivedPackages, { recursive: true });
    if (existsSync(join(archivedPackages, name))) throw new Error(`Backup already exists: ${name}`);
    renameSync(join(source, 'pmtiles', name), join(archivedPackages, name));
}
let moved = 0;
for (const name of readdirSync(source)) {
    if (!/^(?:pdf-|\d{4}-\d{2}-\d{2})/.test(name) || !statSync(join(source, name)).isDirectory()) continue;
    const destination = join(backup, name);
    if (existsSync(destination)) throw new Error(`Backup already exists: ${name}`);
    renameSync(join(source, name), destination);
    moved++;
}
writeFileSync(join(source, 'manifest.json'), JSON.stringify(catalog, null, 2));
writeFileSync(join(source, 'pdf-pilot.json'), JSON.stringify(catalog.charts.find(c => c.chart === 'ENRC_L3'), null, 2));
console.log(`Verified 18 archives; moved ${moved} PNG directories to ${backup}`);
