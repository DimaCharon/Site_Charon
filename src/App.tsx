import { lazy, Suspense, useState, useEffect } from "react";
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
import { copy, projects, interests, publishedContent } from "./config/site";
import { useRoute, pageHref } from "./config/routes";
import { pageMeta } from "../shared/routes.mjs";
import {
  Catalog,
  ProductPage,
  PageLead,
  NotePage,
  Manual,
} from "./components/Showroom";
import { CoverLab, LabInvitation } from "./components/CoverLab";
import "./styles/global.css";
import "./styles/sections.css";
import "./styles/responsive.css";
import "./styles/owner-and-gestures.css";
import "./styles/projects-media.css";
import "./styles/atelier.css";
const OwnerPanel = lazy(() => import("./owner/OwnerPanel"));
function Edition({ path }: { path: string }) {
  const { prefs, setPrefs, reduced, systemReduce } = usePreferences();
  const profile = publishedProfile;
  const [settings, setSettings] = useState(false),
    [owner, setOwner] = useState(false),
    [project, setProject] = useState<number | null>(null),
    [interest, setInterest] = useState<number | null>(null);
  const p = projects.find((x) => path === "products/" + x.id),
    n = interests.findIndex((x) => path === "journal/" + x.kind);
  useEffect(() => {
    document.title = pageMeta(path, publishedContent, profile).title;
    const syncAnchor = () => {
      const h = location.hash;
      if (!path && (h === "#interests" || h === "#world")) {
        location.replace(pageHref("journal", h.slice(1)));
        return;
      }
      if (!__CHARON_OFFLINE__) return;
      const id = h.startsWith("#/") ? h.split("@")[1] : h.slice(1);
      requestAnimationFrame(() => {
        if (id)
          document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
        else window.scrollTo({ top: 0, behavior: "instant" });
      });
    };
    syncAnchor();
    window.addEventListener("hashchange", syncAnchor);
    return () => window.removeEventListener("hashchange", syncAnchor);
  }, [path, profile]);
  return (
    <>
      <div id="page-top" />
      <a href={pageHref(path, "main")} className="skip-link">
        {copy["interface.text05"]}
      </a>
      <Header onSettings={() => setSettings(true)} />
      <main id="main">
        {!path ? (
          <>
            <Hero
              name={profile.name}
              reduced={reduced}
              overlay={
                owner || settings || project !== null || interest !== null
              }
            />
            <Projects onOpen={setProject} />
            <LabInvitation />
            <About name={profile.name} />
            <Contacts profile={profile} />
          </>
        ) : path === "products" ? (
          <Catalog />
        ) : p ? (
          <ProductPage p={p} />
        ) : path === "lab" ? (
          <CoverLab />
        ) : path === "journal" ? (
          <>
            <div className="shell journal-lead">
              <PageLead
                kicker={copy["library.notesKicker"]}
                title={copy["library.notes"]}
                description={copy["library.notesIntro"]}
              />
            </div>
            <Interests onOpen={setInterest} />
            <World name={profile.name} />
          </>
        ) : n >= 0 ? (
          <NotePage index={n} />
        ) : path === "guide" || path === "updates" ? (
          <Manual updates={path === "updates"} />
        ) : (
          <div className="shell paper-view">
            <PageLead
              title={copy["store.missing"]}
              kicker={copy["store.wordmark"]}
            />
          </div>
        )}
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
      )}
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
      )}
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
export default function App() {
  const path = useRoute();
  return <Edition key={path} path={path} />;
}
