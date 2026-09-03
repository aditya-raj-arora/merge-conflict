import { useState } from "react";
import { LevelSelect } from "./components/LevelSelect";
import { LevelView } from "./components/LevelView";
import { StoryView } from "./components/StoryView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { levelManifest } from "../content/levelManifest";
import { isLevelUnlocked } from "./engine/economy";
import { usePlayerStore } from "./state/usePlayerStore";

function App() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const name = usePlayerStore((s) => s.name);
  const progress = usePlayerStore((s) => s.progress);
  const setName = usePlayerStore((s) => s.setName);

  const selectedEntry = levelManifest.find((e) => e.id === selectedLevelId);
  const levelIds = levelManifest.map((e) => e.id);

  // Never open a level the player hasn't unlocked yet, even if
  // selectedLevelId somehow points at one (CR-109) - LevelSelect already
  // disables the button, this is the defensive second check.
  const canOpenSelected =
    selectedEntry && isLevelUnlocked(levelIds, progress, selectedEntry.id);

  return (
    <main className="min-h-screen bg-slate-900">
      {!name ? (
        <WelcomeScreen onStart={setName} />
      ) : selectedEntry && canOpenSelected ? (
        selectedEntry.kind === "story" ? (
          <StoryView
            story={selectedEntry.story}
            onBack={() => setSelectedLevelId(null)}
          />
        ) : (
          <LevelView
            level={selectedEntry.level}
            onBack={() => setSelectedLevelId(null)}
          />
        )
      ) : (
        <LevelSelect entries={levelManifest} onSelect={setSelectedLevelId} />
      )}
    </main>
  );
}

export default App;
