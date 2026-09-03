// LLCSC-04-*-CH*: the list of levels a player can actually pick from.
// New chapters/levels register themselves here - this is the only place
// App.tsx needs to know nothing about individual level files (CR-058).
// Entries are polymorphic over kind (CR-091): "quiz" is the original
// single-question-over-a-graph mechanic (level.ts/LevelView), "story" is
// the newer branching multi-stage mechanic (story.ts/StoryView). As of
// CR-108 every registered chapter is story-format - the quiz mechanic
// itself isn't removed (level.ts/useGameStore/LevelView are still live
// code, still covered by their own tests), it just has no active content
// right now. toQuizEntry/QuizManifestEntry stay exported so a future
// quiz-format level can register here without re-adding this plumbing.
// CR-112 adds an optional project-brief (`project`), surfaced uniformly
// on every entry regardless of kind, so App.tsx doesn't need to know
// which mechanic a level uses just to decide whether to show one.
import { parseLevel, type Level } from "../src/engine/mechanics/level";
import { parseStory, type Story } from "../src/engine/mechanics/story";
import type { ProjectBrief } from "../src/engine/project";
import type { TierDefinition } from "../src/engine/economy";
import rawStory0101 from "./chapters/ch01-identification/STORY-01-01-which-one-shipped.json";
import rawStory0201 from "./chapters/ch02-version-control/STORY-02-01-whose-fix-made-it.json";
import rawStory0301 from "./chapters/ch03-change-control/STORY-03-01-who-skipped-review.json";
import rawStory0401 from "./chapters/ch04-status-accounting/STORY-04-01-what-does-prod-actually-run.json";
import rawStory0501 from "./chapters/ch05-configuration-audit/STORY-05-01-does-it-still-match.json";
import rawStory0601 from "./chapters/ch06-build-release/STORY-06-01-which-tag-lied.json";

export interface QuizManifestEntry {
  kind: "quiz";
  id: string;
  chapterId: string;
  title: string;
  level: Level;
  project?: ProjectBrief;
}

export interface StoryManifestEntry {
  kind: "story";
  id: string;
  chapterId: string;
  title: string;
  story: Story;
  project?: ProjectBrief;
}

export type ManifestEntry = QuizManifestEntry | StoryManifestEntry;

export function toQuizEntry(raw: unknown): QuizManifestEntry {
  const level = parseLevel(raw);
  return {
    kind: "quiz",
    id: level.id,
    chapterId: level.chapterId,
    title: level.title,
    level,
    project: level.project,
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
    project: story.project,
  };
}

export const levelManifest: ManifestEntry[] = [
  toStoryEntry(rawStory0101),
  toStoryEntry(rawStory0201),
  toStoryEntry(rawStory0301),
  toStoryEntry(rawStory0401),
  toStoryEntry(rawStory0501),
  toStoryEntry(rawStory0601),
];

// CR-118: three tiers of two chapters each, gating progression on total
// budget earned (not just on having passed the previous chapter) once a
// player crosses a tier boundary - see economy.ts's isLevelUnlockedWithTiers
// for exactly how these thresholds get applied. Tier 1's threshold is
// nominal (isChapterTierUnlocked always treats tier index 0 as unlocked),
// kept at 0 here for clarity, not because the number does anything.
// Tiers 2 and 3's thresholds are set to exactly what two clean "good
// ending" chapter clears earn (2 x REWARD.storyGood, and 4 x, per
// src/engine/economy.ts) - a player who plays each tier's two chapters
// well crosses the next gate right as they finish, without needing to
// grind or replay anything extra.
export const TIERS: TierDefinition[] = [
  {
    name: "Foundations",
    chapterIds: ["ch01-identification", "ch02-version-control"],
    unlockThreshold: 0,
  },
  {
    name: "Operations",
    chapterIds: ["ch03-change-control", "ch04-status-accounting"],
    unlockThreshold: 2_000,
  },
  {
    name: "Governance",
    chapterIds: ["ch05-configuration-audit", "ch06-build-release"],
    unlockThreshold: 4_000,
  },
];
