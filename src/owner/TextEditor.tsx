import { useState } from "react";
import { Search } from "lucide-react";
import { textFields, type Content } from "../../shared/content-schema.mjs";
import { Field, Select, StudioHeading } from "./Inputs";
const groups: Record<string, string> = {
  hero: "Главный экран",
  nav: "Шапка и навигация",
  about: "Обо мне и направления",
  projects: "Галерея проектов",
  world: "Цифровой мир и орбиты",
  interests: "Интересы и заметки",
  contacts: "Контакты",
  footer: "Подвал страницы",
  studio: "3D-студия",
  settings: "Настройки оформления",
  interface: "Окна и управление",
  seo: "Поиск и предпросмотр ссылки",
};
const recordSpecs = {
  directions: [
    ["title", "Название направления", 64],
    ["text", "Описание направления", 1400],
  ],
  worlds: [
    ["label", "Подпись на орбите", 28],
    ["title", "Заголовок орбиты", 90],
    ["text", "Описание орбиты", 1400],
  ],
  interests: [
    ["title", "Название интереса", 90],
    ["text", "Подпись карточки", 400],
    ["question", "Исследовательский вопрос", 480],
    ["note", "Текст заметки", 2600],
  ],
} as const;
export function TextEditor({
  content,
  update,
}: {
  content: Content;
  update: (patch: Partial<Content>) => void;
}) {
  const [group, setGroup] = useState("hero"),
    [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("ru");
  const match = (...s: string[]) =>
    s.some((v) => v.toLocaleLowerCase("ru").includes(q));
  const found = textFields.filter((f) =>
    q
      ? match(f.label, content.copy[f.key], groups[f.group])
      : f.group === group,
  );
  let count = 0;
  const records = (
    Object.keys(recordSpecs) as (keyof typeof recordSpecs)[]
  ).map((kind) => {
    const belongs = {
      directions: "about",
      worlds: "world",
      interests: "interests",
    }[kind];
    if (!q && group !== belongs) return null;
    const list = content[kind] as unknown as Record<string, string>[];
    return list.map((item, i) => {
      const fields = recordSpecs[kind];
      if (
        q &&
        !match(
          groups[belongs],
          ...fields.flatMap(([k, label]) => [label, item[k]]),
        )
      )
        return null;
      count++;
      return (
        <details className="cms-disclosure" key={kind + i}>
          <summary>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>{" "}
            {item.title || item.label}
          </summary>
          <div>
            {fields.map(([k, label, max]) => (
              <Field
                key={k}
                label={label}
                value={item[k]}
                max={max}
                multi={max > 120}
                onChange={(v) =>
                  update({
                    [kind]: list.map((r, n) =>
                      i === n ? { ...r, [k]: v } : r,
                    ),
                  })
                }
              />
            ))}
          </div>
        </details>
      );
    });
  });
  return (
    <>
      <StudioHeading
        kicker="COPY DESK / 03"
        title="Тексты сайта"
        description="Выберите раздел или найдите фразу, как она написана на сайте."
      />
      <div className="copy-controls">
        <Select
          label="Раздел сайта"
          value={group}
          onChange={(v) => {
            setGroup(v);
            setQuery("");
          }}
        >
          {Object.entries(groups).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
        <label className="cms-field">
          <span>Поиск по всему сайту</span>
          <div className="copy-search">
            <Search size={15} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Заголовок, подпись, заметка…"
            />
          </div>
        </label>
      </div>
      <div className="cms-fields">
        {found.map((f) => (
          <Field
            key={f.key}
            label={(q ? groups[f.group] + " · " : "") + f.label}
            value={content.copy[f.key]}
            max={f.max}
            multi={f.max > 260}
            hint={
              f.key === "footer.signature"
                ? "Пять нажатий на эту надпись по-прежнему открывают панель."
                : undefined
            }
            onChange={(v) => update({ copy: { ...content.copy, [f.key]: v } })}
          />
        ))}
      </div>
      {records}
      {q && !found.length && !count && (
        <p className="cms-empty">
          Совпадений нет. Попробуйте другое слово. Названия и досье проектов
          находятся во вкладке «Проекты».
        </p>
      )}
    </>
  );
}
