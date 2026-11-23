import { lazy, Suspense, useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { About, AboutTeaser, WhyChoose } from "./components/About";
import { Projects, ProjectModal } from "./components/Projects";
import { World } from "./components/World";
import { Interests, InterestModal } from "./components/Interests";
import { BriefDesk } from "./components/BriefDesk";
import { References } from "./components/References";
import { Snow } from "./components/Snow";
import { Footer } from "./components/Contacts";
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
import { CoverLab } from "./components/CoverLab";
import "./styles/global.css";
import "./styles/sections.css";
import "./styles/responsive.css";
import "./styles/owner-and-gestures.css";
import "./styles/projects-media.css";
import "./styles/atelier.css";
import "./styles/desk.css";
import "./styles/edition.css";
const OwnerPanel = lazy(() => import("./owner/OwnerPanel"));
function Edition({
  path,
  appearance,
}: {
  path: string;
  appearance: ReturnType<typeof usePreferences>;
}) {
  const { prefs, setPrefs, reduced, systemReduce } = appearance;
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
      if (!path && h === "#contacts") {
        location.replace(pageHref("contacts"));
        return;
      }
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
      <Header
        onSettings={() => setSettings(true)}
        snowOn={prefs.snow && !reduced}
        snowLocked={reduced}
        toggleSnow={() => setPrefs((p) => ({ ...p, snow: !p.snow }))}
      />
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
            <AboutTeaser />
          </>
        ) : path === "contacts" ? (
          <BriefDesk />
        ) : path === "references" ? (
          <References />
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
        ) : path === "about" ? (
          <>
            <div className="shell journal-lead">
              <PageLead
                kicker={copy["about.text01"]}
                title={copy["about.title"]}
                description={copy["about.description"]}
              />
            </div>
            <About name={profile.name} />
            <WhyChoose />
          </>
        ) : n >= 0 ? (
          <NotePage index={n} />
        ) : path === "guide" ? (
          <Manual />
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
      {prefs.snow && !reduced && <Snow />}
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
  const appearance = usePreferences();
  return <Edition key={path} path={path} appearance={appearance} />;
}
