import { useEffect, useState } from "react";
import { LevelSelect } from "./components/LevelSelect";
import { LevelView } from "./components/LevelView";
import { StoryView } from "./components/StoryView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { TitleScreen } from "./components/TitleScreen";
import { levelManifest } from "../content/levelManifest";
import { isLevelUnlocked } from "./engine/economy";
import { usePlayerStore } from "./state/usePlayerStore";

function App() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const name = usePlayerStore((s) => s.name);
  const progress = usePlayerStore((s) => s.progress);
  const lastPlayedLevelId = usePlayerStore((s) => s.lastPlayedLevelId);
  const setName = usePlayerStore((s) => s.setName);
  const setLastPlayedLevel = usePlayerStore((s) => s.setLastPlayedLevel);
  const resetProfile = usePlayerStore((s) => s.resetProfile);

  // Shown once per app session for a returning player (CR-111) - a
  // brand-new player (WelcomeScreen's onStart) skips it entirely, since
  // there's nothing yet to "continue".
  const [titleAcknowledged, setTitleAcknowledged] = useState(false);

  const selectedIndex = levelManifest.findIndex(
    (e) => e.id === selectedLevelId,
  );
  const selectedEntry =
    selectedIndex >= 0 ? levelManifest[selectedIndex] : undefined;
  const nextEntry =
    selectedIndex >= 0 ? levelManifest[selectedIndex + 1] : undefined;
  const levelIds = levelManifest.map((e) => e.id);

  // Never open a level the player hasn't unlocked yet, even if
  // selectedLevelId somehow points at one (CR-109) - LevelSelect already
  // disables the button, this is the defensive second check.
  const canOpenSelected =
    selectedEntry && isLevelUnlocked(levelIds, progress, selectedEntry.id);

  useEffect(() => {
    if (selectedEntry && canOpenSelected) {
      setLastPlayedLevel(selectedEntry.id);
    }
  }, [selectedEntry, canOpenSelected, setLastPlayedLevel]);

  const lastPlayedTitle = levelManifest.find(
    (e) => e.id === lastPlayedLevelId,
  )?.title;

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
        selectedEntry.kind === "story" ? (
          <StoryView
            story={selectedEntry.story}
            onBack={() => setSelectedLevelId(null)}
            nextLevel={nextEntry}
            onNextLevel={
              nextEntry ? () => setSelectedLevelId(nextEntry.id) : undefined
            }
          />
        ) : (
          <LevelView
            level={selectedEntry.level}
            onBack={() => setSelectedLevelId(null)}
            nextLevel={nextEntry}
            onNextLevel={
              nextEntry ? () => setSelectedLevelId(nextEntry.id) : undefined
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
