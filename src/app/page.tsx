"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { Preloader } from "@/components/site/preloader";
import { CustomCursor } from "@/components/site/cursor";
import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { Projects } from "@/components/site/projects";
import { DigitalWorld } from "@/components/site/digital-world";
import { Interests } from "@/components/site/interests";
import { Contacts } from "@/components/site/contacts";
import { Footer } from "@/components/site/footer";
import { MascotCompanion } from "@/components/site/mascot-companion";

export default function Home() {
  const [loading, setLoading] = React.useState(true);

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <CustomCursor />
      <Navbar />

      <main className="flex-1">
        <Hero active={!loading} />
        <About />
        <Projects />
        <DigitalWorld />
        <Interests />
        <Contacts />
      </main>

      <Footer />
      <MascotCompanion active={!loading} />
    </div>
  );
}
