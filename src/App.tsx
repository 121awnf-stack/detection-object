import { Masthead, Marquee, TopBar } from "./components/Masthead";
import { PlateStage } from "./components/PlateStage";
import { Reference } from "./components/Reference";
import { Workbench } from "./components/Workbench";
import { useDetector } from "./lib/detector";

export default function App() {
  const detector = useDetector();

  return (
    <div className="min-h-screen bg-paper">
      <TopBar status={detector.status} />
      <main>
        <Masthead />
        <Marquee />
        <PlateStage detector={detector} />
        <Workbench detector={detector} />
        <Reference status={detector.status} />
      </main>
    </div>
  );
}
