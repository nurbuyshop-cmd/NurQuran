import "./globals.css";

export const metadata = { title: "Nur Quran Admin", robots: { index: false, follow: false } };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0d1b3e" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
