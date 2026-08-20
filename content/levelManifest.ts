// LLCSC-04-*-CH*: the list of levels a player can actually pick from.
// New chapters/levels register themselves here - this is the only place
// App.tsx needs to know nothing about individual level files (CR-058).
import { parseLevel, type Level } from "../src/engine/mechanics/level";
import rawLvl0101 from "./chapters/ch01-identification/LVL-01-01-which-one-shipped.json";
import rawLvl0201 from "./chapters/ch02-version-control/LVL-02-01-whose-fix-made-it.json";

export interface ManifestEntry {
  id: string;
  chapterId: string;
  title: string;
  level: Level;
}

function toEntry(raw: unknown): ManifestEntry {
  const level = parseLevel(raw);
  return {
    id: level.id,
    chapterId: level.chapterId,
    title: level.title,
    level,
  };
}

export const levelManifest: ManifestEntry[] = [
  toEntry(rawLvl0101),
  toEntry(rawLvl0201),
];
