import { useState } from "react";
import { LevelSelect } from "./components/LevelSelect";
import { LevelView } from "./components/LevelView";
import { levelManifest } from "../content/levelManifest";

function App() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const selectedEntry = levelManifest.find((e) => e.id === selectedLevelId);

  return (
    <main className="min-h-screen bg-slate-900">
      {selectedEntry ? (
        <LevelView
          level={selectedEntry.level}
          onBack={() => setSelectedLevelId(null)}
        />
      ) : (
        <LevelSelect entries={levelManifest} onSelect={setSelectedLevelId} />
      )}
    </main>
  );
}

export default App;
