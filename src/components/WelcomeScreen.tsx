// CSU-02.05.001-SRC-WelcomeScreen_r1
// TLCSC-02-UI: the first-launch screen (CR-109) - introduces the budget
// economy before the player ever sees a level, and collects their name.
// Shown only when usePlayerStore has no name yet; App.tsx skips straight
// to LevelSelect for a returning player.
import { useState } from "react";
import { STARTING_BUDGET } from "../engine/economy";

export interface WelcomeScreenProps {
  onStart: (name: string) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const start = () => {
    if (!trimmed) return;
    onStart(trimmed);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6 text-slate-100">
      <h1 className="text-3xl font-bold">Merge Conflict</h1>
      <p className="mt-4 text-slate-300">
        You're the new hire responsible for keeping this codebase under control
        - across six chapters covering the disciplines of Software Configuration
        Management: identification, version control, change control, status
        accounting, configuration audit, and build &amp; release management.
      </p>

      <div className="mt-6 rounded border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="font-semibold text-sky-300">The budget</h2>
        <p className="mt-2 text-slate-300">
          Your company starts with a budget of{" "}
          <span className="font-semibold text-slate-100">
            {STARTING_BUDGET.toLocaleString()}
          </span>
          . Every choice you make in a level changes it: the best call earns the
          most, a small mistake costs less, and a bad one can cost you real
          money. There's no game over - the budget is a running record of how
          well you've actually done, not a lockout.
        </p>
      </div>

      <div className="mt-6 rounded border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="font-semibold text-sky-300">Progression</h2>
        <p className="mt-2 text-slate-300">
          Chapters unlock in order. You'll need to pass one before the next
          becomes available - a quiz level by answering correctly, a story level
          by reaching a good ending. Anything short of that, you can always try
          again.
        </p>
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-medium text-slate-300">
          What should we call you?
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start();
          }}
          placeholder="Your name"
          maxLength={40}
          className="mt-2 w-full rounded border border-slate-600 bg-slate-900 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={start}
        disabled={!trimmed}
        className="mt-4 rounded bg-sky-600 px-4 py-2 font-medium disabled:opacity-40"
      >
        Start
      </button>
    </div>
  );
}
