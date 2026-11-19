import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Check,
  Download,
  Layers3,
  Type,
  UserRound,
  FileCheck2,
  LockKeyhole,
} from "lucide-react";
import { Modal } from "../components/ui";
import {
  publishedContent,
  type SiteDocument,
  type Content,
  type Project,
} from "../config/site";
import {
  contactNames,
  type Profile,
  type ContactKey,
} from "../../shared/profile-schema.mjs";
import { imageHashes } from "../../shared/edition.mjs";
import { preparePacket, OWNER_WORKFLOW, OWNER_DRAFTS } from "./signing";
import { type MediaBank } from "./media";
import { ProjectEditor } from "./ProjectEditor";
import { TextEditor } from "./TextEditor";
import { Field, StudioHeading } from "./Inputs";
import "../styles/editor.css";
const screens = [
  ["projects", "Проекты", Layers3],
  ["copy", "Тексты сайта", Type],
  ["profile", "Профиль", UserRound],
] as const;
export function StudioEditor({
  session,
  profile,
  onClose,
}: {
  session: CryptoKey;
  profile: Profile;
  onClose: () => void;
}) {
  const original = useRef<SiteDocument>({
    profile,
    content: publishedContent,
  }).current;
  const [draft, setDraft] = useState<{ doc: SiteDocument; images: MediaBank }>(
    () => ({ doc: structuredClone(original), images: {} }),
  );
  const { doc, images } = draft;
  const [tab, setTab] = useState<(typeof screens)[number][0]>("projects"),
    [selected, select] = useState(doc.content.projects[0]?.id || ""),
    [pending, setPending] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [warn, setWarn] = useState(false),
    [result, setResult] = useState<Awaited<
      ReturnType<typeof preparePacket>
    > | null>(null),
    [copied, setCopied] = useState(false),
    [clock, setClock] = useState(Date.now);
  const scroller = useRef<HTMLDivElement>(null),
    packetInput = useRef<HTMLTextAreaElement>(null),
    alive = useRef(true);
  const changed = JSON.stringify(doc) !== JSON.stringify(original);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [tab, result, warn]);
  useEffect(() => {
    if (!result) return;
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, [result]);
  const update = (
    fn: (a: SiteDocument) => SiteDocument,
    photo?: { hash: string; base64: string },
  ) => {
    setError("");
    setDraft((prev) => {
      const next = fn(prev.doc),
        keep = new Set(imageHashes(next)),
        bank = photo
          ? { ...prev.images, [photo.hash]: photo.base64 }
          : prev.images;
      return {
        doc: next,
        images: Object.fromEntries(
          Object.entries(bank).filter(([k]) => keep.has(k)),
        ),
      };
    });
  };
  const content = (patch: Partial<Content>) =>
    update((d) => ({ ...d, content: { ...d.content, ...patch } }));
  const edit = (
    id: string,
    patch: Partial<Project>,
    photo?: { hash: string; base64: string },
  ) =>
    update(
      (d) => ({
        ...d,
        content: {
          ...d.content,
          projects: d.content.projects.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        },
      }),
      photo,
    );
  const prepare = async () => {
    if (pending || loading) return;
    setPending(true);
    setError("");
    try {
      const p = await preparePacket(session, original, doc, images);
      if (alive.current) {
        setResult(p);
        setClock(Date.now());
        setCopied(false);
      }
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error ? e.message : "Не удалось подготовить публикацию.",
        );
    } finally {
      if (alive.current) setPending(false);
    }
  };
  const openClose = () => {
    if (loading || pending) return;
    if (changed && !result) setWarn(true);
    else onClose();
  };
  const copyValue = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        result.file ? result.name : result.text,
      );
      setCopied(true);
    } catch {
      packetInput.current?.focus();
      packetInput.current?.select();
      setError("Текст выделен. Скопируйте его вручную.");
    }
  };
  const saveFile = () => {
    if (!result?.file) return;
    const url = URL.createObjectURL(result.file),
      a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const label = result?.file ? "Имя файла для GitHub" : "Пакет изменений";
  return (
    <Modal
      onClose={openClose}
      title={
        warn
          ? "Закрыть редактор?"
          : result
            ? "Подтверждение публикации"
            : "Панель владельца"
      }
      eyebrow={
        result ? "OWNER STUDIO / PUBLICATION" : "CHARON / CONTENT STUDIO"
      }
      className={
        "owner-modal " + (warn || result ? "cms-review-modal" : "cms-modal")
      }
    >
      {warn ? (
        <div className="cms-exit">
          <p>
            Изменения пока только в этой вкладке. Если выйти, черновик и новые
            фотографии будут удалены.
          </p>
          <div className="form-actions">
            <button className="button secondary" onClick={onClose}>
              Выйти без сохранения
            </button>
            <button className="button primary" onClick={() => setWarn(false)}>
              Продолжить редактирование
            </button>
          </div>
        </div>
      ) : result ? (
        <div className="owner-review">
          <div className="owner-notice">
            <FileCheck2 size={18} />
            <span>
              Черновик проверен и подписан. Чтобы изменения увидели посетители,
              подтвердите их в GitHub.
            </span>
          </div>
          <p className="cms-summary">
            {[
              result.patch.projects &&
                `Галерея: ${doc.content.projects.length} карточек`,
              result.count > 0 && `Новых фото: ${result.count}`,
              result.patch.copy &&
                `Изменено подписей: ${Object.keys(result.patch.copy).length}`,
              result.patch.directions && "Направления",
              result.patch.worlds && "Орбиты",
              result.patch.interests && "Заметки",
              result.patch.profile && "Профиль",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {result.file ? (
            <>
              <ol>
                <li>
                  <strong>Скачайте файл публикации.</strong> В нём уже есть
                  текст и все новые обложки.
                </li>
                <li>
                  Под аккаунтом <strong>DimaCharon</strong> откройте{" "}
                  <a
                    className="cms-text-link"
                    href={OWNER_DRAFTS + "/new"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    новый черновик релиза ↗
                  </a>{" "}
                  или свой существующий черновик. Прикрепите файл без
                  переименования, дождитесь загрузки и нажмите{" "}
                  <strong>Save draft</strong>, не Publish release. Для нового
                  черновика можно указать тег и название из имени файла без
                  .json.
                </li>
                <li>
                  Скопируйте имя файла ниже. В GitHub Actions нажмите{" "}
                  <strong>Run workflow</strong> на <code>main</code>, вставьте
                  имя и подтвердите запуск.
                </li>
              </ol>
              <button
                className="button secondary cms-download"
                disabled={clock >= result.expires}
                onClick={saveFile}
              >
                <Download size={15} />
                Скачать файл публикации{" "}
                <small>{Math.ceil(result.file.size / 1024)} КиБ</small>
              </button>
            </>
          ) : (
            <ol>
              <li>Скопируйте пакет изменений ниже.</li>
              <li>
                Откройте GitHub под аккаунтом <strong>DimaCharon</strong> и
                нажмите <strong>Run workflow</strong>.
              </li>
              <li>
                Оставьте ветку <code>main</code>, вставьте пакет и подтвердите
                запуск. После проверки GitHub Pages пересоберёт сайт.
              </li>
            </ol>
          )}
          <label htmlFor="owner-packet">{label}</label>
          <textarea
            id="owner-packet"
            ref={packetInput}
            aria-label={label}
            value={result.file ? result.name : result.text}
            readOnly
            rows={result.file ? 1 : 3}
            spellCheck={false}
            onFocus={(e) => e.target.select()}
          />
          <p className="owner-expiry mono">
            {clock >= result.expires
              ? "СРОК ИСТЁК · ВЕРНИТЕСЬ И ПОДГОТОВЬТЕ НОВЫЙ ПАКЕТ"
              : "ДЕЙСТВИТЕЛЕН ДО " +
                new Date(result.expires).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={clock >= result.expires}
              onClick={() => void copyValue()}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
              {copied
                ? "Скопировано"
                : result.file
                  ? "Скопировать имя"
                  : "Скопировать"}
            </button>
            <a
              className="button primary"
              href={OWNER_WORKFLOW}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть GitHub
              <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            className="owner-back"
            onClick={() => {
              setError("");
              setResult(null);
            }}
          >
            <ArrowLeft size={13} />
            Вернуться к редактированию
          </button>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <nav className="cms-tabs" aria-label="Разделы редактора">
            {screens.map(([id, name, Icon]) => (
              <button
                key={id}
                disabled={loading || pending}
                aria-pressed={tab === id}
                onClick={() => {
                  setTab(id);
                  setError("");
                }}
              >
                <Icon size={15} />
                {name}
                {id === "projects" && (
                  <span>
                    {String(doc.content.projects.length).padStart(2, "0")}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="cms-scroll" ref={scroller}>
            {tab === "projects" ? (
              <ProjectEditor
                content={doc.content}
                images={images}
                edit={edit}
                replace={(projects) => content({ projects })}
                selected={selected}
                select={select}
                loading={loading}
                setLoading={setLoading}
              />
            ) : tab === "copy" ? (
              <TextEditor content={doc.content} update={content} />
            ) : (
              <>
                <StudioHeading
                  kicker="IDENTITY / 02"
                  title="Профиль и контакты"
                  description="Пустые каналы останутся без ссылки. Посетители не могут менять эти данные."
                />
                <div className="cms-fields cms-profile">
                  <Field
                    label="Имя или псевдоним"
                    value={doc.profile.name}
                    max={32}
                    required
                    onChange={(name) =>
                      update((d) => ({ ...d, profile: { ...d.profile, name } }))
                    }
                  />
                  {(Object.keys(contactNames) as ContactKey[]).map((k) => (
                    <Field
                      key={k}
                      label={contactNames[k]}
                      value={doc.profile.contacts[k]}
                      max={k === "email" ? 254 : 384}
                      type={k === "email" ? "email" : "url"}
                      placeholder={
                        {
                          telegram: "https://t.me/…",
                          email: "Ваш email",
                          github: "https://github.com/…",
                          social: "https://…",
                        }[k]
                      }
                      onChange={(v) =>
                        update((d) => ({
                          ...d,
                          profile: {
                            ...d.profile,
                            contacts: { ...d.profile.contacts, [k]: v },
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="cms-bottom">
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div>
              <span>
                <LockKeyhole size={14} />
                {changed ? "Приватный черновик" : "Опубликованная версия"}
              </span>
              <button
                className="button primary"
                disabled={pending || loading || !changed}
                onClick={() => void prepare()}
              >
                {pending ? "Проверяем…" : "Подготовить публикацию"}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
