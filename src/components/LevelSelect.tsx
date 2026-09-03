// CSU-02.03.001-SRC-LevelSelect_r4
// TLCSC-02-UI: the level-select screen. Originally shipped with no
// progress tracking or unlock gating at all (CR-058) - CR-109 adds
// sequential unlock gating, a passed badge, and the player's name/budget
// header, reading usePlayerStore directly rather than via props so App
// doesn't have to thread player state through. CR-110 exposes
// usePlayerStore's resetProfile() (added but deliberately unexposed at
// CR-109) as a "Reset progress" control, behind an inline confirm step
// since it's destructive and irreversible. CR-118 groups chapters under
// tier headers and gates a tier's first chapter on total money earned
// instead of just "was the previous chapter passed" - a locked tier
// shows how much more the player needs, rather than a silent lock icon.
// A chapter not listed in any of `TIERS` (e.g. the synthetic fixtures
// this component's own tests use) falls back to one implicit, always-
// unlocked group with no tier header, so the tier concept never applies
// to content that isn't part of it.
import { useState } from "react";
import type { ManifestEntry } from "../../content/levelManifest";
import { TIERS } from "../../content/levelManifest";
import {
  isLevelUnlockedWithTiers,
  isChapterTierUnlocked,
} from "../engine/economy";
import { usePlayerStore } from "../state/usePlayerStore";

export interface LevelSelectProps {
  entries: ManifestEntry[];
  onSelect: (id: string) => void;
}

export function LevelSelect({ entries, onSelect }: LevelSelectProps) {
  const chapterIds = [...new Set(entries.map((e) => e.chapterId))];
  const name = usePlayerStore((s) => s.name);
  const budget = usePlayerStore((s) => s.budget);
  const totalEarned = usePlayerStore((s) => s.totalEarned);
  const progress = usePlayerStore((s) => s.progress);
  const resetProfile = usePlayerStore((s) => s.resetProfile);

  const [confirmingReset, setConfirmingReset] = useState(false);

  // Group consecutive chapters that share a tier under one heading
  // (CR-118). A chapter absent from TIERS - every chapter, for the
  // synthetic fixtures this component's own tests render - falls into
  // an untiered group instead, rendered exactly as before CR-118: no
  // tier header, no earn-more hint.
  const chapterGroups: {
    tier: (typeof TIERS)[number] | null;
    chapterIds: string[];
  }[] = [];
  for (const chapterId of chapterIds) {
    const tier = TIERS.find((t) => t.chapterIds.includes(chapterId)) ?? null;
    const last = chapterGroups[chapterGroups.length - 1];
    if (last && last.tier === tier) {
      last.chapterIds.push(chapterId);
    } else {
      chapterGroups.push({ tier, chapterIds: [chapterId] });
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Merge Conflict</h1>
        <div className="text-right text-sm">
          {name && <p className="text-slate-400">{name}</p>}
          <p
            className={`font-semibold ${budget < 0 ? "text-rose-400" : "text-emerald-400"}`}
          >
            Budget: {budget.toLocaleString()}
          </p>
        </div>
      </div>
      <p className="mt-3 text-slate-300">Pick a level.</p>

      {chapterGroups.map((group, groupIndex) => {
        const tierLocked =
          group.tier !== null &&
          !isChapterTierUnlocked(TIERS, totalEarned, group.tier.chapterIds[0]);
        return (
          <div key={group.tier?.name ?? `untiered-${groupIndex}`}>
            {group.tier && (
              <div className="mt-8 border-t border-slate-800 pt-4 first:mt-0 first:border-t-0 first:pt-0">
                <h2 className="text-lg font-semibold text-slate-200">
                  {group.tier.name}
                </h2>
                {tierLocked && (
                  <p className="mt-1 text-sm text-amber-400">
                    Unlocks at {group.tier.unlockThreshold.toLocaleString()}{" "}
                    earned — you have {totalEarned.toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {group.chapterIds.map((chapterId) => (
              <section key={chapterId} className="mt-6">
                <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
                  {chapterId}
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {entries
                    .filter((e) => e.chapterId === chapterId)
                    .map((entry) => {
                      const unlocked = isLevelUnlockedWithTiers(
                        entries,
                        progress,
                        TIERS,
                        totalEarned,
                        entry.id,
                      );
                      const passed = progress[entry.id]?.passed ?? false;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(entry.id)}
                            disabled={!unlocked}
                            className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left ${
                              unlocked
                                ? "border-slate-600 hover:border-slate-400"
                                : "cursor-not-allowed border-slate-800 text-slate-500"
                            }`}
                          >
                            <span>{entry.title}</span>
                            {passed ? (
                              <span
                                aria-label="Passed"
                                className="text-emerald-400"
                              >
                                ✓
                              </span>
                            ) : !unlocked ? (
                              <span
                                aria-label="Locked"
                                className="text-slate-500"
                              >
                                🔒
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        );
      })}

      <div className="mt-8 border-t border-slate-800 pt-4">
        {confirmingReset ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-rose-300">
              This wipes your name, budget, and all progress. Are you sure?
            </p>
            <button
              type="button"
              onClick={() => {
                resetProfile();
                setConfirmingReset(false);
              }}
              className="rounded border border-rose-600 bg-rose-950/40 px-3 py-1 text-sm text-rose-300 hover:border-rose-400"
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="rounded border border-slate-600 px-3 py-1 text-sm hover:border-slate-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
