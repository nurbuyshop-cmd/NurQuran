import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import Home from "@/app/page";
import TasbeehPage from "@/app/tasbeeh/page";
import PrayerTimesPage from "@/app/prayer-times/page";
import QiblaPage from "@/app/qibla/page";
import QuranPage from "@/app/quran/page";
import SearchP from "@/app/search/page";
import NotifP from "@/app/notifications/page";
import SettingsP from "@/app/settings/page";
import TajweedP from "@/app/tajweed/page";
import PremiumP from "@/app/premium/page";
import AlarmRunner from "@/components/AlarmRunner";
import AboutP from "@/app/about/page";
import PrivacyP from "@/app/privacy-policy/page";
import ContactP from "@/app/contact/page";
import SiteFavicon from "@/components/SiteFavicon";

const ROUTES = { "": Home, tasbeeh: TasbeehPage, "prayer-times": PrayerTimesPage, qibla: QiblaPage, quran: QuranPage, search: SearchP, notifications: NotifP, settings: SettingsP, tajweed: TajweedP, premium: PremiumP, about: AboutP, "privacy-policy": PrivacyP, contact: ContactP };

function App() {
  const read = () => location.hash.replace(/^#/, "");
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const Page = ROUTES[route.split(/[/?]/)[0]] || Home;
  return <><Page /><AlarmRunner /><SiteFavicon /></>;
}
createRoot(document.getElementById("root")).render(<App />);
