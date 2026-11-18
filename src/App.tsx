import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects, ProjectModal } from "./components/Projects";
import { World } from "./components/World";
import { Interests, InterestModal } from "./components/Interests";
import { Contacts, Footer } from "./components/Contacts";
import { Effects } from "./components/Effects";
import { Settings } from "./components/Settings";
import { usePreferences, useProfile } from "./config/profile";
import "./styles/global.css";
import "./styles/sections.css";
import "./styles/responsive.css";
export default function App() {
  const { prefs, setPrefs, reduced, systemReduce } = usePreferences(),
    { profile, save, reset } = useProfile();
  const [settings, setSettings] = useState<"ui" | "profile" | null>(null),
    [project, setProject] = useState<number | null>(null),
    [interest, setInterest] = useState<number | null>(null);
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержанию
      </a>
      <Header onSettings={() => setSettings("ui")} />
      <main id="main">
        <Hero
          name={profile.name}
          reduced={reduced}
          overlay={settings !== null || project !== null || interest !== null}
        />
        <About name={profile.name} onEdit={() => setSettings("profile")} />
        <Projects onOpen={setProject} />
        <World name={profile.name} />
        <Interests onOpen={setInterest} />
        <Contacts profile={profile} onEdit={() => setSettings("profile")} />
      </main>
      <Footer />
      <Effects cursor={prefs.cursor} reduced={reduced} />
      {settings && (
        <Settings
          key={settings}
          initialTab={settings}
          profile={profile}
          prefs={prefs}
          setPrefs={setPrefs}
          save={save}
          reset={reset}
          systemReduce={systemReduce}
          onClose={() => setSettings(null)}
        />
      )}{" "}
      {project !== null && (
        <ProjectModal index={project} onClose={() => setProject(null)} />
      )}{" "}
      {interest !== null && (
        <InterestModal index={interest} onClose={() => setInterest(null)} />
      )}
    </>
  );
}
