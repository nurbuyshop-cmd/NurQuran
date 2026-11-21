import "./globals.css";
import AlarmRunner from "@/components/AlarmRunner";
import FontSync from "@/components/FontSync";
import SiteFavicon from "@/components/SiteFavicon";

export const metadata = {
  title: "Quran",
  description: "Read the Holy Quran, prayer times, Qibla, Tasbeeh, Hifz and more.",
  icons: { icon: "/favicon.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1b3e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AlarmRunner />
        <FontSync />
        <SiteFavicon />
      </body>
    </html>
  );
}
