import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import Home from "@/app/page";
import TasbeehPage from "@/app/tasbeeh/page";
import PrayerTimesPage from "@/app/prayer-times/page";
import QiblaPage from "@/app/qibla/page";
import QuranPage from "@/app/quran/page";
import AlarmRunner from "@/components/AlarmRunner";

const ROUTES = { "": Home, tasbeeh: TasbeehPage, "prayer-times": PrayerTimesPage, qibla: QiblaPage, quran: QuranPage };

function App() {
  const read = () => location.hash.replace(/^#/, "");
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const Page = ROUTES[route] || Home;
  return <><Page /><AlarmRunner /></>;
}
createRoot(document.getElementById("root")).render(<App />);
