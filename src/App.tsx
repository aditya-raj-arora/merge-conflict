import { useEffect, useState } from "react";
import { LevelSelect } from "./components/LevelSelect";
import { LevelView } from "./components/LevelView";
import { StoryView } from "./components/StoryView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { TitleScreen } from "./components/TitleScreen";
import { ProjectBriefScreen } from "./components/ProjectBriefScreen";
import { levelManifest, TIERS } from "../content/levelManifest";
import { isLevelUnlockedWithTiers } from "./engine/economy";
import { usePlayerStore } from "./state/usePlayerStore";

function App() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const name = usePlayerStore((s) => s.name);
  const progress = usePlayerStore((s) => s.progress);
  const totalEarned = usePlayerStore((s) => s.totalEarned);
  const lastPlayedLevelId = usePlayerStore((s) => s.lastPlayedLevelId);
  const setName = usePlayerStore((s) => s.setName);
  const setLastPlayedLevel = usePlayerStore((s) => s.setLastPlayedLevel);
  const resetProfile = usePlayerStore((s) => s.resetProfile);

  // Shown once per app session for a returning player (CR-111) - a
  // brand-new player (WelcomeScreen's onStart) skips it entirely, since
  // there's nothing yet to "continue".
  const [titleAcknowledged, setTitleAcknowledged] = useState(false);

  // Which level's project brief has already been shown this "visit"
  // (CR-112) - compared against the currently selected level's id, not
  // just a boolean, so opening a different level (including via the
  // Next Level shortcut) shows its own brief again, but replaying the
  // same level ("Play again") doesn't re-show it.
  const [briefAcknowledgedFor, setBriefAcknowledgedFor] = useState<
    string | null
  >(null);

  const selectedIndex = levelManifest.findIndex(
    (e) => e.id === selectedLevelId,
  );
  const selectedEntry =
    selectedIndex >= 0 ? levelManifest[selectedIndex] : undefined;
  const nextEntry =
    selectedIndex >= 0 ? levelManifest[selectedIndex + 1] : undefined;

  // Never open a level the player hasn't unlocked yet, even if
  // selectedLevelId somehow points at one (CR-109) - LevelSelect already
  // disables the button, this is the defensive second check. Uses the
  // same tiered gate LevelSelect does (CR-118) - sequential within a
  // tier, money-gated at a tier's first chapter.
  const canOpenSelected =
    selectedEntry &&
    isLevelUnlockedWithTiers(
      levelManifest,
      progress,
      TIERS,
      totalEarned,
      selectedEntry.id,
    );

  // The Next Level shortcut only makes sense if the next chapter is
  // actually unlocked (CR-118) - clearing the last chapter in a tier no
  // longer guarantees the next one is, if the player hasn't earned
  // enough yet. When it isn't, onNextLevel below is left undefined and
  // the views simply don't render the button - the player goes back to
  // level select and sees the tier's earn-more-to-unlock hint instead.
  const nextEntryUnlocked =
    nextEntry &&
    isLevelUnlockedWithTiers(
      levelManifest,
      progress,
      TIERS,
      totalEarned,
      nextEntry.id,
    );

  useEffect(() => {
    if (selectedEntry && canOpenSelected) {
      setLastPlayedLevel(selectedEntry.id);
    }
  }, [selectedEntry, canOpenSelected, setLastPlayedLevel]);

  const lastPlayedTitle = levelManifest.find(
    (e) => e.id === lastPlayedLevelId,
  )?.title;

  const needsBrief =
    selectedEntry?.project && briefAcknowledgedFor !== selectedEntry.id;

  return (
    <main className="min-h-screen bg-slate-900">
      {!name ? (
        <WelcomeScreen
          onStart={(playerName) => {
            setName(playerName);
            setTitleAcknowledged(true);
          }}
        />
      ) : !titleAcknowledged ? (
        <TitleScreen
          name={name}
          lastPlayedTitle={lastPlayedTitle}
          onContinue={() => setTitleAcknowledged(true)}
          onNewGame={resetProfile}
        />
      ) : selectedEntry && canOpenSelected ? (
        needsBrief ? (
          <ProjectBriefScreen
            project={selectedEntry.project!}
            onBegin={() => setBriefAcknowledgedFor(selectedEntry.id)}
            onBack={() => setSelectedLevelId(null)}
          />
        ) : selectedEntry.kind === "story" ? (
          <StoryView
            story={selectedEntry.story}
            onBack={() => setSelectedLevelId(null)}
            nextLevel={nextEntry}
            onNextLevel={
              nextEntryUnlocked
                ? () => setSelectedLevelId(nextEntry.id)
                : undefined
            }
          />
        ) : (
          <LevelView
            level={selectedEntry.level}
            onBack={() => setSelectedLevelId(null)}
            nextLevel={nextEntry}
            onNextLevel={
              nextEntryUnlocked
                ? () => setSelectedLevelId(nextEntry.id)
                : undefined
            }
          />
        )
      ) : (
        <LevelSelect entries={levelManifest} onSelect={setSelectedLevelId} />
      )}
    </main>
  );
}

export default App;
