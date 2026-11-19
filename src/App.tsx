import { copy } from "./config/site";
import { lazy, Suspense, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Projects, ProjectModal } from "./components/Projects";
import { World } from "./components/World";
import { Interests, InterestModal } from "./components/Interests";
import { Contacts, Footer } from "./components/Contacts";
import { Effects } from "./components/Effects";
import { Settings } from "./components/Settings";
import { usePreferences, publishedProfile } from "./config/profile";
import "./styles/global.css";
import "./styles/sections.css";
import "./styles/responsive.css";
import { projects, interests } from "./config/site";
const OwnerPanel = lazy(() => import("./owner/OwnerPanel"));
export default function App() {
  const { prefs, setPrefs, reduced, systemReduce } = usePreferences();
  const profile = publishedProfile;
  const [settings, setSettings] = useState(false),
    [owner, setOwner] = useState(false),
    [project, setProject] = useState<number | null>(null),
    [interest, setInterest] = useState<number | null>(null);
  return (
    <>
      <a href="#main" className="skip-link">
        {copy["interface.text05"]}
      </a>
      <Header onSettings={() => setSettings(true)} />
      <main id="main">
        <Hero
          name={profile.name}
          reduced={reduced}
          overlay={owner || settings || project !== null || interest !== null}
        />
        <About name={profile.name} />
        <Projects onOpen={setProject} />
        <World name={profile.name} />
        <Interests onOpen={setInterest} />
        <Contacts profile={profile} />
      </main>
      <Footer onOwner={() => setOwner(true)} />
      <Effects cursor={prefs.cursor} reduced={reduced} />
      {settings && (
        <Settings
          prefs={prefs}
          setPrefs={setPrefs}
          systemReduce={systemReduce}
          onClose={() => setSettings(false)}
        />
      )}{" "}
      {owner && (
        <Suspense fallback={null}>
          <OwnerPanel profile={profile} onClose={() => setOwner(false)} />
        </Suspense>
      )}
      {project !== null && projects[project] && (
        <ProjectModal
          index={project}
          onStep={(d) =>
            setProject(
              (i) => ((i ?? 0) + d + projects.length) % projects.length,
            )
          }
          onClose={() => setProject(null)}
        />
      )}{" "}
      {interest !== null && (
        <InterestModal
          index={interest}
          onStep={(d) =>
            setInterest(
              (i) => ((i ?? 0) + d + interests.length) % interests.length,
            )
          }
          onClose={() => setInterest(null)}
        />
      )}
    </>
  );
}

import "./styles/owner-and-gestures.css";

import "./styles/projects-media.css";
