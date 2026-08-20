// CSU-02.03.001-SRC-LevelSelect_r1
// TLCSC-02-UI: the level-select screen (CR-058). No progress tracking or
// unlock gating - every level is always selectable, on purpose, per that
// CR's Risk section.
import type { ManifestEntry } from "../../content/levelManifest";

export interface LevelSelectProps {
  entries: ManifestEntry[];
  onSelect: (id: string) => void;
}

export function LevelSelect({ entries, onSelect }: LevelSelectProps) {
  const chapterIds = [...new Set(entries.map((e) => e.chapterId))];

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      <h1 className="text-2xl font-bold">Merge Conflict</h1>
      <p className="mt-3 text-slate-300">Pick a level.</p>

      {chapterIds.map((chapterId) => (
        <section key={chapterId} className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
            {chapterId}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {entries
              .filter((e) => e.chapterId === chapterId)
              .map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry.id)}
                    className="w-full rounded border border-slate-600 px-4 py-3 text-left hover:border-slate-400"
                  >
                    {entry.title}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
