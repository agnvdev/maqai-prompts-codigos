import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Showcase } from "@/components/landing/Showcase";
import { Segments } from "@/components/landing/Segments";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Positioning } from "@/components/landing/Positioning";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { getActiveLpMediaMap } from "@/lib/supabase/lpMedia";
import { getActiveLpBeforeAfterPairs, type LpBeforeAfterPair } from "@/lib/supabase/lpBeforeAfter";
import { getActiveLpShowcaseItems, type LpShowcaseItem } from "@/lib/supabase/lpShowcase";

export const revalidate = 60;

export default async function Home() {
  let heroMedia: Record<string, string> = {};
  let segmentsMedia: Record<string, string> = {};
  let finalCtaMedia: Record<string, string> = {};
  let beforeAfterPairs: LpBeforeAfterPair[] = [];
  let showcaseItems: LpShowcaseItem[] = [];

  try {
    [heroMedia, segmentsMedia, finalCtaMedia] = await Promise.all([
      getActiveLpMediaMap("hero"),
      getActiveLpMediaMap("segments"),
      getActiveLpMediaMap("final_cta"),
    ]);
  } catch (error) {
    // A misconfigured/unreachable Supabase must not fail this page's
    // prerender - the components already fall back to the static images.
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

  try {
    // Independent try/catch: lp_showcase_items is a newer table, so its
    // migration might not be applied yet in some environment - the
    // Showcase section hides itself when empty either way.
    showcaseItems = await getActiveLpShowcaseItems();
  } catch (error) {
    console.error("Failed to load showcase items from Supabase:", error);
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero imageUrl={heroMedia.hero} />
        <BeforeAfter pairs={beforeAfterPairs} />
        <Showcase items={showcaseItems} />
        <Segments imageOverrides={segmentsMedia} />
        <Benefits />
        <HowItWorks />
        <Positioning />
        <FinalCta imageUrl={finalCtaMedia.final_cta} />
      </main>
      <Footer />
    </>
  );
}
