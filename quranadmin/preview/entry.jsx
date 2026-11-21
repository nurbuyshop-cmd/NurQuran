import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import { useRoute } from "./router";
import Dashboard from "@/app/page";
import Login from "@/app/login/page";
import Pages from "@/app/pages/page";
import Edit from "@/app/pages/edit/page";
import Surahs from "@/app/surahs/page";
import Settings from "@/app/settings/page";
import Admins from "@/app/admins/page";
import Backup from "@/app/backup/page";
import Activity from "@/app/activity/page";
import Images from "@/app/images/page";
import Reciters from "@/app/reciters/page";
import SitePages from "@/app/site-pages/page";
import Tajweed from "@/app/tajweed/page";
import General from "@/app/general/page";
import LESSONS from "@/public/tajweed/lessons.json";

const ROUTES = { "/": Dashboard, "/login/": Login, "/pages/": Pages, "/pages/edit/": Edit, "/surahs/": Surahs,
  "/settings/": Settings, "/admins/": Admins, "/backup/": Backup, "/activity/": Activity, "/images/": Images, "/reciters/": Reciters, "/site-pages/": SitePages, "/tajweed/": Tajweed, "/general/": General };
function App() {
  const r = useRoute();
  const P = ROUTES[r.split("?")[0]] || Dashboard;
  return <P key={r} />;
}
window.__MOCK_API__ = true;
window.__TAJ_LESSONS__ = LESSONS;
createRoot(document.getElementById("root")).render(<App />);
