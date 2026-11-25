// Sizzle & Serve — hand-in program for the make.fun cooking-game bounty.
//
// What this file does, in order:
//   1. Pre-flight: walk game/ and screenshots/ and refuse to hand in an
//      entry the gate would refuse — too many game files, a game folder
//      that is too heavy, the wrong number of screenshots, or one
//      screenshot over its size cap. Failing here, loudly, beats failing
//      on the site after the deadline.
//   2. Copy game/ and screenshots/ into the output directory.
//   3. Ask the vendored make.fun library for the dossier — the summary
//      the judge reads — and write it as dossier.json, last, so the
//      scorer can rebuild it from the copied files and compare bytes.
//
// The output directory is /output inside the grader; anywhere else,
// MAKEFUN_OUTPUT_DIR names it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for this competition, restated as this program's law.
const GAME_FILE_LIMIT = 993;
const GAME_BYTE_LIMIT = 50_331_648;
const SHOT_MIN = 3;
const SHOT_MAX = 4;
const SHOT_BYTE_LIMIT = 262_144;
const IMAGE_NAME = /\.(png|jpe?g)$/i;

function refuse(message: string): never {
  console.error(`sizzle-and-serve: refusing to hand in: ${message}`);
  process.exit(1);
}

/** Count files and bytes under a directory, following no symlinks. */
function weigh(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      const inner = weigh(path);
      files += inner.files;
      bytes += inner.bytes;
    } else if (info.isFile()) {
      files += 1;
      bytes += info.size;
    }
  }
  return { files, bytes };
}

// — pre-flight: the game folder —
const gameDir = join(root, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  refuse('game/index.html is missing: there is no game to hand in');
}
const gameWeight = weigh(gameDir);
if (gameWeight.files > GAME_FILE_LIMIT) {
  refuse(`game/ holds ${gameWeight.files} files, over the ${GAME_FILE_LIMIT}-file cap`);
}
if (gameWeight.bytes > GAME_BYTE_LIMIT) {
  refuse(`game/ weighs ${gameWeight.bytes} bytes, over the ${GAME_BYTE_LIMIT}-byte cap`);
}

// — pre-flight: the screenshots —
const shotsDir = join(root, 'screenshots');
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => IMAGE_NAME.test(name) && !name.startsWith('.'))
  : [];
if (shotNames.length < SHOT_MIN || shotNames.length > SHOT_MAX) {
  refuse(`screenshots/ holds ${shotNames.length} images: the gate wants ${SHOT_MIN} or ${SHOT_MAX}`);
}
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > SHOT_BYTE_LIMIT) {
    refuse(`screenshots/${name} is ${size} bytes, over the ${SHOT_BYTE_LIMIT}-byte cap`);
  }
}

// — hand it in —
mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163_840,
  screenshots: { max: SHOT_MAX, max_bytes: SHOT_BYTE_LIMIT },
  game_max_files: GAME_FILE_LIMIT,
  game_max_bytes: GAME_BYTE_LIMIT,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(
  `sizzle-and-serve: handed in ${gameWeight.files} game files (${gameWeight.bytes} bytes), ` +
    `${shotNames.length} screenshots and a ${Buffer.byteLength(dossier)}-byte dossier under ${outDir}`,
);
