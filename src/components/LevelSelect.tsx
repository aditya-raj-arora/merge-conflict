// CSU-02.03.001-SRC-LevelSelect_r3
// TLCSC-02-UI: the level-select screen. Originally shipped with no
// progress tracking or unlock gating at all (CR-058) - CR-109 adds
// sequential unlock gating, a passed badge, and the player's name/budget
// header, reading usePlayerStore directly rather than via props so App
// doesn't have to thread player state through. CR-110 exposes
// usePlayerStore's resetProfile() (added but deliberately unexposed at
// CR-109) as a "Reset progress" control, behind an inline confirm step
// since it's destructive and irreversible.
import { useState } from "react";
import type { ManifestEntry } from "../../content/levelManifest";
import { isLevelUnlocked } from "../engine/economy";
import { usePlayerStore } from "../state/usePlayerStore";

export interface LevelSelectProps {
  entries: ManifestEntry[];
  onSelect: (id: string) => void;
}

export function LevelSelect({ entries, onSelect }: LevelSelectProps) {
  const chapterIds = [...new Set(entries.map((e) => e.chapterId))];
  const name = usePlayerStore((s) => s.name);
  const budget = usePlayerStore((s) => s.budget);
  const progress = usePlayerStore((s) => s.progress);
  const resetProfile = usePlayerStore((s) => s.resetProfile);

  const levelIds = entries.map((e) => e.id);

  const [confirmingReset, setConfirmingReset] = useState(false);

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

      {chapterIds.map((chapterId) => (
        <section key={chapterId} className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
            {chapterId}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {entries
              .filter((e) => e.chapterId === chapterId)
              .map((entry) => {
                const unlocked = isLevelUnlocked(levelIds, progress, entry.id);
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
                        <span aria-label="Passed" className="text-emerald-400">
                          ✓
                        </span>
                      ) : !unlocked ? (
                        <span aria-label="Locked" className="text-slate-500">
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
