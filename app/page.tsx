import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Examples } from "@/components/landing/Examples";
import { Segments } from "@/components/landing/Segments";
import { Categories } from "@/components/landing/Categories";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";
import { getActiveLpBeforeAfterPairs, type LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";

export const revalidate = 60;

export default async function Home() {
  let heroMedia: Record<string, string> = {};
  let segmentsMedia: Record<string, string> = {};
  let examplesMedia: Record<string, string> = {};
  let beforeAfterPairs: LpBeforeAfterPair[] = [];

  try {
    [heroMedia, segmentsMedia, examplesMedia] = await Promise.all([
      getActiveLpMediaMap("hero"),
      getActiveLpMediaMap("segments"),
      getActiveLpMediaMap("examples"),
    ]);
  } catch (error) {
    // A misconfigured/unreachable Supabase must not fail this page's
    // prerender — the components already fall back to the static images.
    console.error("Failed to load LP media from Supabase:", error);
  }

  try {
    // Independent try/catch: the before/after section hides itself when
    // empty (see BeforeAfter.tsx), so a failure here must not take down
    // the rest of the page.
    beforeAfterPairs = await getActiveLpBeforeAfterPairs();
  } catch (error) {
    console.error("Failed to load before/after pairs from Supabase:", error);
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero imageUrl={heroMedia.hero} />
        <TrustStrip />
        <HowItWorks />
        <BeforeAfter pairs={beforeAfterPairs} />
        <Examples imageOverrides={examplesMedia} />
        <Segments imageOverrides={segmentsMedia} />
        <Categories />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
