import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Examples } from "@/components/landing/Examples";
import { Segments } from "@/components/landing/Segments";
import { Categories } from "@/components/landing/Categories";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <Examples />
        <Segments />
        <Categories />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
