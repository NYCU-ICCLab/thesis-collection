import { readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const out = [];

// 1) submodule-backed theses
const thesesDir = path.join(ROOT, 'theses');
if (existsSync(thesesDir)) {
  for (const slug of await readdir(thesesDir)) {
    const metaPath = path.join(thesesDir, slug, 'thesis.json');
    if (!existsSync(metaPath)) continue;
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));
    meta.slug ??= slug;
    meta.source = 'submodule';
    if (meta.archive) {
      await cp(path.join(thesesDir, slug), path.join(ROOT, 'archive', slug), {
        recursive: true,
        filter: (s) => !s.split(path.sep).includes('.git'),
      });
      meta.archiveUrl = `archive/${slug}/`;
    }
    out.push(meta);
  }
}

// 2) external theses (links only, no local copy)
const manualPath = path.join(ROOT, 'data', 'manual.json');
if (existsSync(manualPath)) {
  for (const m of JSON.parse(await readFile(manualPath, 'utf8'))) {
    m.source ??= 'external';
    out.push(m);
  }
}

// 3) sort newest-first, then alphabetical; write
out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
await writeFile(path.join(ROOT, 'data', 'theses.json'), JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} theses to data/theses.json`);
