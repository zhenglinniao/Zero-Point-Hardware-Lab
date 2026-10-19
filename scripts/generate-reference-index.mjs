import fs from 'node:fs';
import { manifest } from '../lib/manifest.ts';
import { levels } from '../lib/levels.ts';
import { sources } from '../lib/sources.ts';

// Run with Node's --experimental-strip-types after changing the catalogue.
const rows = manifest.map((component) => {
  const refs = component.sources
    .map((id) => `[${sources[id].name}](${sources[id].url})`)
    .join(' · ');
  return `| ${component.id} | ${component.name} | ${levels[component.level].name} | ${refs} |`;
});
fs.writeFileSync(
  new URL('../docs/component-references.md', import.meta.url),
  [
    '# Component reference index',
    '',
    'Reviewed 2026-09-19. Generated from the same catalogue used in the app.',
    '',
    'Manufacturer documents support component roles, architecture or construction. They do not establish exact geometry or the parts fitted to a particular product. See [scope and limitations](../SOURCES.md#current-component-reference-audit).',
    '',
    '| ID | Component | Inspection scale | References |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n'),
);
