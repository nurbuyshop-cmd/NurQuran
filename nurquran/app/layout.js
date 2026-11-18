import "./globals.css";
import AlarmRunner from "@/components/AlarmRunner";

export const metadata = {
  title: "Quran",
  description: "Read the Holy Quran, prayer times, Qibla, Tasbeeh, Hifz and more.",
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
      </body>
    </html>
  );
}
