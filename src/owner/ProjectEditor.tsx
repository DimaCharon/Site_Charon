import { blankOffer } from "../../shared/offer.mjs";
import { useRef, useState, useEffect } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  ImagePlus,
  RotateCcw,
  Check,
  Eye,
  ArrowLeft,
} from "lucide-react";
import {
  artKinds,
  MAX_PROJECTS,
  statusValues,
  type Project,
  type Content,
} from "../../shared/content-schema.mjs";
import { ProjectCard, ProjectDossier } from "../components/Projects";
import { statusLabel } from "../config/site";
import { Field, Select, StudioHeading } from "./Inputs";
import { processPhoto, previewPhoto, type MediaBank } from "./media";
const names = {
  identity: "Фирменный знак",
  ai: "Нейросеть",
  code: "Программирование",
  trading: "Рельеф данных",
  product: "Слои продукта",
  design: "Форма",
  automation: "Автоматизация",
  technology: "Технологии",
  experiments: "Эксперимент",
};
const finishes = {
  original: "Оригинал",
  lavender: "Лаванда",
  ice: "Лёд",
  steel: "Сталь",
};
const sample = (id: string): Project => ({
  id,
  name: "Новый проект",
  offer: blankOffer(),
  caption: "",
  category: "",
  status: "Концепция",
  art: "experiments",
  short: "",
  description: "",
  details: [],
  tags: [],
  cover: null,
  theme: "original",
});
type Props = {
  content: Content;
  images: MediaBank;
  selected: string;
  select: (id: string) => void;
  replace: (projects: Project[]) => void;
  edit: (
    id: string,
    patch: Partial<Project>,
    image?: { hash: string; base64: string },
  ) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
};
export function ProjectEditor({
  content,
  images,
  selected,
  select,
  replace,
  edit,
  loading,
  setLoading,
}: Props) {
  const { projects, copy } = content;
  const index = Math.max(
      0,
      projects.findIndex((r) => r.id === selected),
    ),
    p = projects[index];
  const [remove, setRemove] = useState(false),
    [dossier, setDossier] = useState(false),
    [notice, setNotice] = useState(""),
    [problem, setProblem] = useState("");
  const upload = useRef<HTMLInputElement>(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setRemove(false);
    setDossier(false);
    setProblem("");
    setNotice("");
  }, [selected]);
  const add = () => {
    const item = sample("p-" + crypto.randomUUID());
    replace([...projects, item]);
    select(item.id);
  };
  const move = (delta: number) => {
    const arr = projects.slice(),
      i = index + delta;
    if (i < 0 || i >= arr.length) return;
    [arr[index], arr[i]] = [arr[i], arr[index]];
    replace(arr);
    setNotice("Позиция в галерее: " + (i + 1) + " из " + arr.length + ".");
  };
  const erase = () => {
    const arr = projects.filter((r) => r.id !== p.id);
    replace(arr);
    select(arr[Math.min(index, arr.length - 1)]?.id || "");
    setRemove(false);
  };
  const photo = async (file?: File) => {
    if (!file || loading) return;
    setProblem("");
    setNotice("");
    setLoading(true);
    const id = p.id;
    try {
      const result = await processPhoto(file);
      if (alive.current) {
        edit(
          id,
          {
            cover: {
              hash: result.hash,
              alt: p.cover?.alt || "",
              fit: p.cover?.fit || "cover",
              x: p.cover?.x ?? 50,
              y: p.cover?.y ?? 50,
            },
          },
          result,
        );
        setNotice(`Обложка готова · ${result.width} × ${result.height} px`);
      }
    } catch (e) {
      if (alive.current)
        setProblem(
          e instanceof Error ? e.message : "Не удалось обработать фото.",
        );
    } finally {
      if (alive.current) setLoading(false);
    }
  };
  return (
    <>
      <StudioHeading
        kicker="PROJECT ARCHIVE / 01"
        title="Мои проекты"
        description="Соберите карточку и проверьте, как она будет выглядеть в галерее."
        action={
          <button
            className="cms-action solid"
            disabled={loading || projects.length >= MAX_PROJECTS}
            onClick={add}
          >
            <Plus size={15} />
            Добавить проект
          </button>
        }
      />
      {!p ? (
        <div className="cms-blank">
          <span className="cms-kicker mono">ARCHIVE / 00</span>
          <h4>Пока нет карточек</h4>
          <p>
            Добавьте первый проект. Пустая галерея на публичном сайте тоже
            поддерживается.
          </p>
        </div>
      ) : (
        <>
          <div className="cms-selector">
            <Select label="Выбранный проект" value={p.id} onChange={select}>
              {projects.map((r, i) => (
                <option key={r.id} value={r.id}>
                  {String(i + 1).padStart(2, "0")} / {r.name || "Без названия"}
                </option>
              ))}
            </Select>
            <div className="cms-order">
              <button
                aria-label="Переместить раньше"
                title="Переместить раньше"
                className="cms-square"
                disabled={!index || loading}
                onClick={() => move(-1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label="Переместить позже"
                title="Переместить позже"
                className="cms-square"
                disabled={index === projects.length - 1 || loading}
                onClick={() => move(1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                aria-label="Удалить проект"
                title="Удалить проект"
                className="cms-square danger"
                disabled={loading}
                onClick={() => setRemove(true)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {remove && (
            <div
              className="cms-confirm"
              role="group"
              aria-label="Подтверждение удаления"
            >
              <p>
                Убрать «{p.name}» из галереи? На сайте карточка исчезнет только
                после публикации.
              </p>
              <div>
                <button className="cms-action danger" onClick={erase}>
                  Да, убрать карточку
                </button>
                <button className="cms-action" onClick={() => setRemove(false)}>
                  Отмена
                </button>
              </div>
            </div>
          )}
          <button
            className="cms-mobile-jump"
            onClick={() =>
              document
                .querySelector(".cms-preview")
                ?.scrollIntoView({ block: "start" })
            }
          >
            <Eye size={14} />
            Посмотреть карточку
          </button>
          <div className="cms-project-grid">
            <div className="cms-fields">
              <Field
                label="Название проекта"
                value={p.name}
                max={90}
                required
                onChange={(name) => edit(p.id, { name })}
              />
              <Field
                label="Краткое описание"
                value={p.short}
                max={400}
                multi
                onChange={(short) => edit(p.id, { short })}
              />
              <div className="cms-pair">
                <Select
                  label="Статус"
                  value={p.status}
                  onChange={(v) =>
                    edit(p.id, { status: v as Project["status"] })
                  }
                >
                  {statusValues.map((v) => (
                    <option key={v} value={v}>
                      {statusLabel(v, copy)}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Категория"
                  value={p.category}
                  max={60}
                  placeholder="Например, Digital product"
                  onChange={(category) => edit(p.id, { category })}
                />
              </div>
              <details className="cms-disclosure offer-config">
                <summary>Демо, цена и продажа</summary>
                <div>
                  <Field
                    label="Для кого продукт"
                    value={p.offer.audience}
                    max={400}
                    multi
                    onChange={(v) =>
                      edit(p.id, { offer: { ...p.offer, audience: v } })
                    }
                  />
                  <Field
                    label="Что получит посетитель"
                    value={p.offer.result}
                    max={900}
                    multi
                    onChange={(v) =>
                      edit(p.id, { offer: { ...p.offer, result: v } })
                    }
                  />
                  <Select
                    label="Способ продажи"
                    value={p.offer.sale}
                    onChange={(v) =>
                      edit(p.id, {
                        offer: {
                          ...p.offer,
                          sale: v as Project["offer"]["sale"],
                          ...(v === "showcase"
                            ? { price: "", terms: "", buyUrl: "" }
                            : v === "inquiry"
                              ? { buyUrl: "" }
                              : {}),
                        },
                      })
                    }
                  >
                    <option value="showcase">
                      Только витрина — без продажи
                    </option>
                    <option value="inquiry">
                      По запросу через контакты профиля
                    </option>
                    <option value="checkout">
                      Покупка на внешней странице
                    </option>
                  </Select>
                  {p.offer.sale !== "showcase" && (
                    <>
                      <Field
                        label="Цена и валюта"
                        value={p.offer.price}
                        max={90}
                        hint="Для покупки обязательна. Укажите полную цену и период, если это подписка."
                        onChange={(v) =>
                          edit(p.id, { offer: { ...p.offer, price: v } })
                        }
                      />
                      {p.offer.sale === "checkout" && (
                        <Field
                          label="HTTPS-ссылка покупки"
                          value={p.offer.buyUrl}
                          max={1200}
                          type="url"
                          hint="Используйте свою действующую страницу оплаты. Для покупки статус проекта должен быть активным."
                          onChange={(v) =>
                            edit(p.id, { offer: { ...p.offer, buyUrl: v } })
                          }
                        />
                      )}
                      <Field
                        label="Условия доступа"
                        value={p.offer.terms}
                        max={800}
                        multi
                        onChange={(v) =>
                          edit(p.id, { offer: { ...p.offer, terms: v } })
                        }
                      />
                    </>
                  )}
                  <Select
                    label="Демонстрация"
                    value={p.offer.demo}
                    onChange={(v) =>
                      edit(p.id, {
                        offer: {
                          ...p.offer,
                          demo: v as Project["offer"]["demo"],
                          ...(v !== "link" ? { demoUrl: "" } : {}),
                        },
                      })
                    }
                  >
                    <option value="none">Нет демо</option>
                    <option value="lab">Встроенная студия обложек</option>
                    <option value="link">Своя HTTPS-ссылка</option>
                  </Select>
                  {p.offer.demo === "link" && (
                    <Field
                      label="HTTPS-ссылка демо"
                      value={p.offer.demoUrl}
                      max={1200}
                      type="url"
                      onChange={(v) =>
                        edit(p.id, { offer: { ...p.offer, demoUrl: v } })
                      }
                    />
                  )}
                  <Field
                    label="Документация продукта (HTTPS, необязательно)"
                    value={p.offer.docsUrl}
                    max={1200}
                    type="url"
                    onChange={(v) =>
                      edit(p.id, { offer: { ...p.offer, docsUrl: v } })
                    }
                  />
                </div>
              </details>
              <section className="cover-editor">
                <div className="cms-line">
                  <strong>Обложка</strong>
                  <span className="mono">{p.cover ? "PHOTO" : "ARTWORK"}</span>
                </div>
                <input
                  className="sr-only"
                  ref={upload}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Фотография проекта"
                  disabled={loading}
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    e.currentTarget.value = "";
                    void photo(f);
                  }}
                  tabIndex={-1}
                />
                <div className="cms-photo-actions">
                  <button
                    className="cms-action"
                    disabled={loading}
                    onClick={() => upload.current?.click()}
                  >
                    <ImagePlus size={15} />
                    {loading
                      ? "Обработка…"
                      : p.cover
                        ? "Заменить фото"
                        : "Загрузить фото"}
                  </button>
                  {p.cover && (
                    <button
                      className="cms-action quiet"
                      disabled={loading}
                      onClick={() => {
                        edit(p.id, { cover: null });
                        setNotice("Возвращена студийная графика.");
                      }}
                    >
                      <RotateCcw size={13} />
                      Убрать фото
                    </button>
                  )}
                </div>
                <p className="cms-hint">
                  JPEG, PNG или WebP до 16 МБ. Панель сама уменьшит снимок для
                  сайта.
                </p>
                {p.cover ? (
                  <>
                    <Field
                      label="Описание фото для скринридера"
                      value={p.cover.alt}
                      max={220}
                      onChange={(alt) =>
                        edit(p.id, { cover: { ...p.cover!, alt } })
                      }
                    />
                    <Select
                      label="Кадрирование"
                      value={p.cover.fit}
                      onChange={(fit) =>
                        edit(p.id, {
                          cover: {
                            ...p.cover!,
                            fit: fit as "cover" | "contain",
                          },
                        })
                      }
                    >
                      <option value="cover">Заполнить обложку</option>
                      <option value="contain">Показать целиком</option>
                    </Select>
                    <div className="cms-pair">
                      {(["x", "y"] as const).map((axis) => (
                        <label className="cms-field range" key={axis}>
                          <span>
                            {axis === "x" ? "По горизонтали" : "По вертикали"}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={p.cover![axis]}
                            onChange={(e) =>
                              edit(p.id, {
                                cover: {
                                  ...p.cover!,
                                  [axis]: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <Select
                    label="Студийная графика"
                    value={p.art}
                    onChange={(art) =>
                      edit(p.id, { art: art as Project["art"] })
                    }
                  >
                    {artKinds.map((k) => (
                      <option key={k} value={k}>
                        {names[k]}
                      </option>
                    ))}
                  </Select>
                )}
                <Field
                  label="Подпись на обложке"
                  value={p.caption}
                  max={90}
                  placeholder="Автоматическая подпись"
                  onChange={(caption) => edit(p.id, { caption })}
                />
                <fieldset className="material-picker">
                  <legend>Материал карточки</legend>
                  <div>
                    {(Object.keys(finishes) as Project["theme"][]).map((t) => (
                      <button
                        className={"finish finish-" + t}
                        key={t}
                        aria-pressed={p.theme === t}
                        onClick={() => edit(p.id, { theme: t })}
                      >
                        <i>{p.theme === t && <Check size={10} />}</i>
                        {finishes[t]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {problem && (
                  <p className="form-error" role="alert">
                    {problem}
                  </p>
                )}
              </section>
              <details className="cms-disclosure">
                <summary>Подробное досье</summary>
                <div>
                  <Field
                    label="Полное описание"
                    value={p.description}
                    max={4000}
                    multi
                    onChange={(description) => edit(p.id, { description })}
                  />
                  <Field
                    label="В фокусе проекта"
                    hint="Один пункт на строку. До 14 пунктов, каждый до 600 символов."
                    value={p.details.join("\n")}
                    max={8414}
                    multi
                    onChange={(v) => edit(p.id, { details: v.split("\n") })}
                  />
                  <Field
                    label="Теги"
                    hint="Один тег на строку. До 16 тегов по 44 символа."
                    value={p.tags.join("\n")}
                    max={720}
                    multi
                    onChange={(v) => edit(p.id, { tags: v.split("\n") })}
                  />
                </div>
              </details>
            </div>
            <aside className="cms-preview">
              <div className="cms-preview-head">
                <span className="mono">
                  <Eye size={13} />
                  LIVE PREVIEW
                </span>
                <span>{dossier ? "Досье" : "Карточка"}</span>
              </div>
              {dossier ? (
                <div className="cms-dossier">
                  <button
                    className="cms-preview-back"
                    onClick={() => setDossier(false)}
                  >
                    <ArrowLeft size={13} />К карточке
                  </button>
                  <h3>{p.name}</h3>
                  <ProjectDossier
                    p={p}
                    index={index}
                    words={copy}
                    previewSrc={previewPhoto(images, p.cover?.hash)}
                  />
                </div>
              ) : (
                <ProjectCard
                  p={p}
                  i={index}
                  words={copy}
                  previewSrc={previewPhoto(images, p.cover?.hash)}
                  onOpen={() => setDossier(true)}
                />
              )}
              <p className="cms-proof">Видно только вам до публикации.</p>
            </aside>
          </div>
        </>
      )}
      {notice && (
        <p role="status" className="cms-status">
          {notice}
        </p>
      )}
    </>
  );
}
