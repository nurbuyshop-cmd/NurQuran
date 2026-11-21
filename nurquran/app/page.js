import PrayerHeader from "@/components/PrayerHeader";
import FeatureGrid from "@/components/FeatureGrid";
import DesktopExtras from "@/components/DesktopExtras";
import HomeQuranSettings from "@/components/HomeQuranSettings";
import ContinueReading from "@/components/ContinueReading";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <PrayerHeader />
      <main>
        <h2 className="sec-title desk-only">Explore</h2>
        <FeatureGrid />
        <ContinueReading className="m" />
        <HomeQuranSettings />
        <DesktopExtras />
        <SiteFooter />
      </main>
    </>
  );
}
