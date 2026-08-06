import { LevelView } from "./components/LevelView";
import { parseLevel } from "./engine/mechanics/level";
import rawLevel from "../content/chapters/ch01-identification/LVL-01-01-which-one-shipped.json";

const level = parseLevel(rawLevel);

function App() {
  return (
    <main className="min-h-screen bg-slate-900">
      <LevelView level={level} />
    </main>
  );
}

export default App;
