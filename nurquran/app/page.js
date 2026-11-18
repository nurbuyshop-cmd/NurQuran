import PrayerHeader from "@/components/PrayerHeader";
import FeatureGrid from "@/components/FeatureGrid";
import DesktopExtras from "@/components/DesktopExtras";

export default function Home() {
  return (
    <>
      <PrayerHeader />
      <main>
        <h2 className="sec-title desk-only">Explore</h2>
        <FeatureGrid />
        <DesktopExtras />
      </main>
    </>
  );
}
