// CSU-02.06.001-SRC-TitleScreen_r1
// TLCSC-02-UI: the title screen (CR-111) - shown once per app session
// to a returning player (someone with a name already saved from a
// previous visit), before level-select. A brand-new player never sees
// this; WelcomeScreen takes them straight to level-select instead.
import { useState } from "react";

export interface TitleScreenProps {
  name: string;
  lastPlayedTitle?: string;
  onContinue: () => void;
  onNewGame: () => void;
}

export function TitleScreen({
  name,
  lastPlayedTitle,
  onContinue,
  onNewGame,
}: TitleScreenProps) {
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6 text-slate-100">
      <h1 className="text-3xl font-bold">Merge Conflict</h1>
      <p className="mt-4 text-slate-300">Welcome back, {name}.</p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="rounded bg-sky-600 px-4 py-3 text-left font-medium"
        >
          Continue
          {lastPlayedTitle && (
            <span className="block text-sm font-normal text-sky-100/80">
              Last played: {lastPlayedTitle}
            </span>
          )}
        </button>

        {confirmingNewGame ? (
          <div className="rounded border border-rose-600 bg-rose-950/40 p-4">
            <p className="text-sm text-rose-300">
              This wipes your name, budget, and all progress. Are you sure?
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={onNewGame}
                className="rounded border border-rose-600 px-3 py-1 text-sm text-rose-300 hover:border-rose-400"
              >
                Yes, start over
              </button>
              <button
                type="button"
                onClick={() => setConfirmingNewGame(false)}
                className="rounded border border-slate-600 px-3 py-1 text-sm hover:border-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingNewGame(true)}
            className="rounded border border-slate-600 px-4 py-3 text-left hover:border-slate-400"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
}
