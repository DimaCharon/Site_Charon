import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Send,
  Check,
  FileText,
} from "lucide-react";
import { copy as w } from "../config/site";
import { pageHref, readBriefReference } from "../config/routes";
import { publishedProfile } from "../config/profile";
import { referenceIndex } from "../config/references";
import { PublishedChannels } from "./Contacts";
import {
  briefLimits,
  briefText,
  checkBrief,
  type BriefField,
  type BriefFields,
} from "../../shared/brief.mjs";
const blank = () => ({ name: "", brand: "", task: "", reply: "" });
const errorKeys: Record<BriefField, string> = {
  name: "brief.errName",
  brand: "brief.errBrand",
  task: "brief.errTask",
  reply: "brief.errReply",
  reference: "brief.errForm",
  consent: "brief.errConsent",
  form: "brief.errForm",
};
const endpoint = __CHARON_OFFLINE__ ? "" : __CHARON_CONTACT_ENDPOINT__;
export function BriefDesk() {
  const items = referenceIndex();
  const initial = () => {
    const id = readBriefReference();
    return items.some((r) => r.id === id) ? id : "";
  };
  const [fields, setFields] = useState(blank),
    [reference, setReference] = useState(initial),
    [consent, setConsent] = useState(false),
    [trap, setTrap] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState<BriefField | null>(null),
    [notice, setNotice] = useState("");
  const active = useRef<AbortController | null>(null),
    success = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setReady(true);
    const follow = () => {
      if (__CHARON_OFFLINE__) setReference(initial());
    };
    window.addEventListener("hashchange", follow);
    return () => {
      window.removeEventListener("hashchange", follow);
      active.current?.abort();
      active.current = null;
    };
  }, []);
  useEffect(() => {
    if (done) success.current?.focus({ preventScroll: true });
  }, [done]);
  const refTitle = items.find((r) => r.id === reference)?.title || "";
  const data = (): BriefFields => ({
    ...fields,
    reference: refTitle
      ? `${refTitle} [${reference}]`.slice(0, briefLimits.reference)
      : "",
  });
  const edit = (k: keyof typeof fields, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (error === k) setError(null);
    setNotice("");
  };
  const alert = (k: BriefField) => {
    setError(k);
    setNotice("");
    document.getElementById("brief-" + k)?.focus();
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || !endpoint || active.current || done) return;
    const payload = { ...data(), website: trap, consent };
    const check = checkBrief(payload);
    if (!check.ok) {
      alert(check.field);
      return;
    }
    setError(null);
    setNotice("");
    const ctrl = new AbortController();
    active.current = ctrl;
    setBusy(true);
    const timer = window.setTimeout(() => ctrl.abort(), 12000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...check.value, consent: true, website: "" }),
        signal: ctrl.signal,
      });
      if (response.status === 429) {
        setNotice(w["brief.errBusy"]);
        return;
      }
      if (response.status === 503) {
        setNotice(w["brief.errUnavailable"]);
        return;
      }
      if (
        response.status !== 200 ||
        (await response.json())?.delivered !== true
      )
        throw Error("unconfirmed");
      setDone(true);
      setFields(blank());
      setConsent(false);
      setTrap("");
      setReference("");
    } catch {
      if (active.current === ctrl) setNotice(w["brief.errDelivery"]);
    } finally {
      clearTimeout(timer);
      if (active.current === ctrl) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  function save() {
    const val = data(),
      blob = new Blob(["\uFEFF" + briefText(val)], {
        type: "text/plain;charset=utf-8",
      }),
      url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "charon-brief.txt";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice(w["brief.saved"]);
  }
  const problem = (key: BriefField) =>
    error === key ? (
      <small className="field-problem" id={"err-" + key}>
        {w[errorKeys[key]]}
      </small>
    ) : null;
  const attrs = (key: BriefField) => ({
    id: "brief-" + key,
    "aria-invalid": error === key || undefined,
    "aria-describedby": error === key ? "err-" + key : undefined,
  });
  return (
    <section className="shell brief-desk" aria-labelledby="contacts-title">
      <a className="folio-back" href={pageHref("")}>
        <ArrowLeft size={14} />
        {w["store.home"]}
      </a>
      <header className="brief-intro">
        <div className="folio-code">
          <i />
          {w["brief.kicker"]}
        </div>
        <h1 id="contacts-title">
          {w["contacts.title1"]} <em>{w["contacts.title2"]}</em>
        </h1>
        <p>
          {w["contacts.intro1"]} {w["contacts.intro2"]}
        </p>
      </header>
      {done ? (
        <div className="brief-paper sent-paper">
          <div className="sent-seal">
            <Check size={26} />
          </div>
          <h2 ref={success} tabIndex={-1}>
            {w["brief.received"]}
          </h2>
          <p>{w["brief.receivedText"]}</p>
          <button
            className="button secondary"
            onClick={() => {
              setDone(false);
              setNotice("");
              requestAnimationFrame(() =>
                document.getElementById("brief-name")?.focus(),
              );
            }}
          >
            {w["brief.again"]}
            <ArrowUpRight size={14} />
          </button>
        </div>
      ) : (
        <form
          className="brief-paper"
          method="post"
          aria-busy={busy}
          noValidate
          autoComplete="off"
          onSubmit={submit}
        >
          <div className="paper-bar">
            <h2>
              <FileText size={17} strokeWidth={1.5} />
              {w["brief.paper"]}
            </h2>
            <span className={"desk-state" + (endpoint ? " connected" : "")}>
              <i />
              {w[endpoint ? "brief.on" : "brief.local"]}
            </span>
          </div>
          {!endpoint && (
            <p className="delivery-info">
              {w[__CHARON_OFFLINE__ ? "brief.offline" : "brief.off"]}
            </p>
          )}
          <noscript>{w["brief.noJs"]}</noscript>
          <fieldset disabled={busy} className="brief-fields">
            <div className="brief-pair">
              {(["name", "brand"] as const).map((key) => (
                <div className="brief-field" key={key}>
                  <label htmlFor={"brief-" + key}>
                    {w["brief." + key]}
                    {key === "brand" && <small>{w["brief.optional"]}</small>}
                  </label>
                  <input
                    {...attrs(key)}
                    required={key === "name"}
                    autoComplete={
                      key === "name" ? "given-name" : "organization"
                    }
                    maxLength={briefLimits[key]}
                    value={fields[key]}
                    onChange={(e) => edit(key, e.target.value)}
                    placeholder={w["brief." + key + "Hint"]}
                  />
                  {problem(key)}
                </div>
              ))}
            </div>
            <div className="brief-field">
              <label htmlFor="brief-task">{w["brief.task"]}</label>
              <textarea
                {...attrs("task")}
                required
                rows={4}
                maxLength={briefLimits.task}
                value={fields.task}
                onChange={(e) => edit("task", e.target.value)}
                placeholder={w["brief.taskHint"]}
              />
              {problem("task")}
            </div>
            <div className="brief-field">
              <label htmlFor="brief-reply">{w["brief.reply"]}</label>
              <input
                {...attrs("reply")}
                required
                value={fields.reply}
                maxLength={briefLimits.reply}
                onChange={(e) => edit("reply", e.target.value)}
                placeholder={w["brief.replyHint"]}
                autoCapitalize="none"
                spellCheck={false}
              />
              {problem("reply")}
            </div>
            <div className="brief-field">
              <div className="reference-line">
                <label htmlFor="brief-reference">{w["brief.reference"]}</label>
                <a
                  href={pageHref("references")}
                  target={__CHARON_OFFLINE__ ? undefined : "_blank"}
                  rel="noopener noreferrer"
                >
                  {w["brief.seeRefs"]}
                  <ArrowUpRight size={12} />
                </a>
              </div>
              <select
                id="brief-reference"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setNotice("");
                }}
              >
                <option value="">{w["brief.noRef"]}</option>
                {items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div hidden aria-hidden="true">
              <label>
                Website
                <input
                  value={trap}
                  onChange={(e) => setTrap(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
            {endpoint && (
              <div className="brief-consent">
                <label>
                  <input
                    type="checkbox"
                    {...attrs("consent")}
                    checked={consent}
                    required
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setError(null);
                    }}
                  />
                  <span>{w["brief.consent"]}</span>
                </label>
                {problem("consent")}
                <p>{w["brief.privacy"]}</p>
              </div>
            )}
          </fieldset>
          <div className="brief-submit">
            <button
              className="button primary"
              type="submit"
              disabled={!ready || !endpoint || busy}
            >
              <Send size={15} />
              {w[busy ? "brief.sending" : "brief.send"]}
            </button>
            <button
              type="button"
              className="brief-save"
              disabled={
                busy || !ready || !Object.values(fields).some((s) => s.trim())
              }
              onClick={save}
            >
              <Download size={14} />
              {w["brief.draft"]}
            </button>
          </div>
          <div role="status" aria-live="polite" className="brief-status">
            {error ? w[errorKeys[error]] : notice}
          </div>
        </form>
      )}
      <PublishedChannels profile={publishedProfile} />
    </section>
  );
}
