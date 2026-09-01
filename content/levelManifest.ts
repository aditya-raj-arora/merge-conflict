// LLCSC-04-*-CH*: the list of levels a player can actually pick from.
// New chapters/levels register themselves here - this is the only place
// App.tsx needs to know nothing about individual level files (CR-058).
// Entries are polymorphic over kind (CR-091): "quiz" is the original
// single-question-over-a-graph mechanic (level.ts/LevelView), "story" is
// the newer branching multi-stage mechanic (story.ts/StoryView).
import { parseLevel, type Level } from "../src/engine/mechanics/level";
import { parseStory, type Story } from "../src/engine/mechanics/story";
import rawLvl0601 from "./chapters/ch06-build-release/LVL-06-01-which-tag-lied.json";
import rawStory0101 from "./chapters/ch01-identification/STORY-01-01-which-one-shipped.json";
import rawStory0201 from "./chapters/ch02-version-control/STORY-02-01-whose-fix-made-it.json";
import rawStory0301 from "./chapters/ch03-change-control/STORY-03-01-who-skipped-review.json";
import rawStory0401 from "./chapters/ch04-status-accounting/STORY-04-01-what-does-prod-actually-run.json";
import rawStory0501 from "./chapters/ch05-configuration-audit/STORY-05-01-does-it-still-match.json";

export interface QuizManifestEntry {
  kind: "quiz";
  id: string;
  chapterId: string;
  title: string;
  level: Level;
}

export interface StoryManifestEntry {
  kind: "story";
  id: string;
  chapterId: string;
  title: string;
  story: Story;
}

export type ManifestEntry = QuizManifestEntry | StoryManifestEntry;

function toQuizEntry(raw: unknown): QuizManifestEntry {
  const level = parseLevel(raw);
  return {
    kind: "quiz",
    id: level.id,
    chapterId: level.chapterId,
    title: level.title,
    level,
  };
}

function toStoryEntry(raw: unknown): StoryManifestEntry {
  const story = parseStory(raw);
  return {
    kind: "story",
    id: story.id,
    chapterId: story.chapterId,
    title: story.title,
    story,
  };
}

export const levelManifest: ManifestEntry[] = [
  toStoryEntry(rawStory0101),
  toStoryEntry(rawStory0201),
  toStoryEntry(rawStory0301),
  toStoryEntry(rawStory0401),
  toStoryEntry(rawStory0501),
  toQuizEntry(rawLvl0601),
];
