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

const ROUTES = { "/": Dashboard, "/login/": Login, "/pages/": Pages, "/pages/edit/": Edit, "/surahs/": Surahs,
  "/settings/": Settings, "/admins/": Admins, "/backup/": Backup, "/activity/": Activity, "/images/": Images };
function App() {
  const r = useRoute();
  const P = ROUTES[r.split("?")[0]] || Dashboard;
  return <P key={r} />;
}
window.__MOCK_API__ = true;
createRoot(document.getElementById("root")).render(<App />);
