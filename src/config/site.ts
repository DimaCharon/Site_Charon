/**
 * ─────────────────────────────────────────────────────────────────
 *  CHARON · PERSONAL DIGITAL IDENTITY — конфигурация сайта
 *
 *  Все личные данные и контент меняются здесь, в одном файле.
 *  Контакты ниже — ПЛЕЙСХОЛДЕРЫ. Замените value/href на реальные.
 * ─────────────────────────────────────────────────────────────────
 */

export const site = {
  /** Имя владельца — крупный элемент hero-секции, меняется одной строкой */
  ownerName: "CHARON",
  ownerNameSub: "Personal Digital Identity",

  hero: {
    eyebrow: "Charon · Цифровая идентичность",
    titleLine1: "Создаю то,",
    titleLine2: "чего ещё нет",
    subtitle:
      "Технологии, искусственный интеллект, цифровые продукты и эксперименты на пересечении идей и разработки",
    markers: ["AI Experiments", "Digital Products", "Market Analytics"],
  },

  about: {
    title: "Немного обо мне",
    lead: "Я не просто использую технологии — я экспериментирую с ними, собираю собственные инструменты и превращаю идеи в работающие продукты.",
    paragraphs: [
      "Меня интересует то, что появляется на границе: новые AI-модели, которые ещё вчера считались экспериментом, агенты, которые берут на себя рутину, рынки, которые читаются через данные, а не через эмоции.",
      "Я разрабатываю сайты, приложения и интерфейсы, собираю автоматизацию и тестирую гипотезы — от концепта до работающего прототипа. Качество для меня важнее количества: меньше вещей, но доведённых до конца.",
      "Всё, что я делаю, складывается в одну экосистему — Charon. Это не компания и не бренд ради бренда, это способ думать о проектах как о единой системе.",
    ],
    manifesto: "Не просто использую технологии — экспериментирую, создаю и превращаю идеи в реальные продукты.",
  },

  projects: {
    title: "То, что я создаю",
    lead: "Каждый проект — это гипотеза, которую я проверяю руками. Честно отмечаю статус: концепция, разработка или активный проект.",
  },

  world: {
    title: "My Digital World",
    lead: "Карта моего цифрового мира. Выберите узел — раскроется сцена.",
  },

  interests: {
    title: "Интересы",
    lead: "Темы, к которым я возвращаюсь каждый день.",
  },

  contact: {
    title: "Есть интересная идея?",
    subtitle: "Открыт к интересным проектам, экспериментам и технологическим решениям",
    note: "Контактные поля — редактируемые плейсхолдеры. Замените их в src/config/site.ts",
  },
} as const;

/* ─── Направления деятельности (About) ─── */
export interface Direction {
  id: string;
  title: string;
  description: string;
  glyph: "neural" | "layers" | "orbit" | "chart" | "flow" | "grid";
  span?: string;
}

export const directions: Direction[] = [
  {
    id: "ai",
    title: "AI & Machine Learning",
    description:
      "Слежу за новыми моделями, тестирую их на реальных задачах и собираю поверх них собственные сценарии — от ассистентов до пайплайнов.",
    glyph: "neural",
    span: "lg:col-span-3",
  },
  {
    id: "products",
    title: "Digital Products",
    description:
      "Придумываю и довожу до прототипа цифровые продукты: от первого эскиза интерфейса до работающего кода.",
    glyph: "layers",
    span: "lg:col-span-3",
  },
  {
    id: "creative",
    title: "Creative Development",
    description:
      "WebGL, генеративная графика, интерактивные сцены — код как материал для визуальных экспериментов.",
    glyph: "orbit",
    span: "lg:col-span-2",
  },
  {
    id: "crypto",
    title: "Crypto & Market Analytics",
    description:
      "Криптовалютный рынок, фьючерсы и алгоритмическая аналитика: данные, закономерности, дисциплина вместо эмоций.",
    glyph: "chart",
    span: "lg:col-span-2",
  },
  {
    id: "automation",
    title: "Automation & Engineering",
    description:
      "AI-агенты и скрипты, которые забирают рутину. Если действие повторяется дважды — оно должно автоматизироваться.",
    glyph: "flow",
    span: "lg:col-span-2",
  },
  {
    id: "uiux",
    title: "UI/UX & Digital Design",
    description:
      "Интерфейсы, в которых внимательность к деталям важнее декора: типографика, ритм, состояние, микроответ системы.",
    glyph: "grid",
    span: "lg:col-span-6",
  },
];

/* ─── Проекты ─── */
export type ProjectStatus = "Активный проект" | "Разработка" | "Концепция";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  details: string[];
  stack: string[];
  status: ProjectStatus;
  visual: "charon" | "trading" | "agents" | "experiments" | "automation" | "web" | "interface";
  featured?: boolean;
  year: string;
}

export const projects: Project[] = [
  {
    id: "charon",
    name: "Charon",
    tagline: "Собственная цифровая идентичность и экосистема продуктов с AI-направлением",
    description:
      "Зонтичный проект: личное пространство, фирменный стиль, маскот и набор продуктов, связанных одной системой. Этот сайт — его часть.",
    details: [
      "Единая визуальная система: графит, серебро, холодная лаванда",
      "Маскот Charon как узнаваемый символ экосистемы",
      "Каркас для запуска следующих продуктов под одним брендом",
    ],
    stack: ["Next.js", "TypeScript", "Three.js", "Design System"],
    status: "Активный проект",
    visual: "charon",
    featured: true,
    year: "2024 — …",
  },
  {
    id: "charon-trading",
    name: "Charon Trading",
    tagline: "Концепция интеллектуальной платформы для анализа криптовалютного рынка и торговых сигналов",
    description:
      "Инструмент для алгоритмического взгляда на рынок: аналитика, сценарии и сигналы вместо интуиции. Сейчас — концепция и прототипные эксперименты.",
    details: [
      "Исследую алгоритмическую аналитику и обработку рыночных данных",
      "Прорабатываю логику сигналов и сценарные модели",
      "Статус — концепция: это не готовый продукт и не торговая рекомендация",
    ],
    stack: ["Data Analysis", "Python", "Automation"],
    status: "Концепция",
    visual: "trading",
    year: "Research",
  },
  {
    id: "ai-agents",
    name: "AI-агенты",
    tagline: "Агентные сценарии: модели, которые делают работу, а не только отвечают",
    description:
      "Собираю агентные схемы для реальных задач: поиск, обработка информации, рутинные операции и связки между сервисами.",
    details: [
      "Эксперименты с многошаговыми агентными сценариями",
      "Связка моделей с внешними инструментами и API",
      "Фокус на надёжности и проверяемости результата",
    ],
    stack: ["LLM", "Agents", "API"],
    status: "Разработка",
    visual: "agents",
    year: "2025 — …",
  },
  {
    id: "experiments",
    name: "Эксперименты с моделями",
    tagline: "Полигон для новых AI-моделей и нестандартных применений",
    description:
      "Каждая новая модель — повод проверить, на что она способна за пределами маркетинга. Результаты складываются в заметки и прототипы.",
    details: [
      "Тесты возможностей свежих моделей на прикладных задачах",
      "Сравнение подходов: что реально работает в проде",
      "Публичные выводы — только после проверки руками",
    ],
    stack: ["LLM", "Benchmarks", "Prototyping"],
    status: "Концепция",
    visual: "experiments",
    year: "Ongoing",
  },
  {
    id: "automation",
    name: "Автоматизация",
    tagline: "Скрипты и пайплайны, которые экономят часы",
    description:
      "Личные инструменты: сбор данных, мониторинг, генерация отчётов, интеграции. Всё то, что не должно делаться вручную.",
    details: [
      "Мониторинги и уведомления по важным событиям",
      "Пайплайны обработки данных",
      "Интеграции между сервисами без ручной переноски",
    ],
    stack: ["Python", "API", "Cron"],
    status: "Разработка",
    visual: "automation",
    year: "Ongoing",
  },
  {
    id: "web",
    name: "Веб-разработка",
    tagline: "Сайты и приложения — от идеи до деплоя",
    description:
      "Полный цикл: проектирование, интерфейс, код, публикация. Этот сайт — пример подхода: кастомная типографика, 3D, анимации.",
    details: [
      "Современный стек: React / Next.js, TypeScript",
      "Внимание к производительности и деталям",
      "Деплой и настройка под ключ",
    ],
    stack: ["Next.js", "React", "Tailwind"],
    status: "Активный проект",
    visual: "web",
    year: "2023 — …",
  },
  {
    id: "interface",
    name: "Интерактивные интерфейсы",
    tagline: "Цифровые пространства, с которыми хочется взаимодействовать",
    description:
      "WebGL-сцены, генеративная графика, нестандартная навигация. Интерфейс как объект, а не как форма для контента.",
    details: [
      "Трёхмерные сцены и физичные анимации",
      "Генеративная и параметрическая графика",
      "Баланс эффектов и читаемости",
    ],
    stack: ["Three.js", "WebGL", "Motion"],
    status: "Разработка",
    visual: "interface",
    year: "2024 — …",
  },
];

/* ─── My Digital World — узлы орбит ─── */
export interface WorldNode {
  id: string;
  label: string;
  title: string;
  description: string;
  scene: "ai" | "code" | "trading" | "design" | "automation" | "technology" | "experiments";
}

export const worldNodes: WorldNode[] = [
  {
    id: "ai",
    label: "AI",
    title: "Искусственный интеллект",
    description: "Новые модели, агентные сценарии, локальные инференс-эксперименты. Слежу за фронтиром и проверяю на деле.",
    scene: "ai",
  },
  {
    id: "code",
    label: "Code",
    title: "Код",
    description: "TypeScript, Python, шейдеры. Код — основной материал, из которого собран весь этот мир.",
    scene: "code",
  },
  {
    id: "trading",
    label: "Trading",
    title: "Рынки",
    description: "Криптовалюты, фьючерсы, алгоритмическая аналитика. Рынок как система данных, а не казино.",
    scene: "trading",
  },
  {
    id: "design",
    label: "Design",
    title: "Дизайн",
    description: "Типографика, композиция, свет. Интерфейсы, которые ощущаются как дорогие предметы.",
    scene: "design",
  },
  {
    id: "automation",
    label: "Automation",
    title: "Автоматизация",
    description: "Агенты и пайплайны, которые работают, пока я думаю. Рутина — не для людей.",
    scene: "automation",
  },
  {
    id: "technology",
    label: "Technology",
    title: "Технологии",
    description: "Новый стек, инструменты, протоколы. Всё, что расширяет возможности, — на тест.",
    scene: "technology",
  },
  {
    id: "experiments",
    label: "Experiments",
    title: "Эксперименты",
    description: "Гипотезы, прототипы, «а что если». Мусорная корзина неудачных идей и инкубатор удачных.",
    scene: "experiments",
  },
];

/* ─── Интересы ─── */
export interface Interest {
  id: string;
  title: string;
  description: string;
  icon: "brain" | "code" | "chart" | "box" | "pen" | "zap" | "flask";
  size: "lg" | "md" | "sm";
}

export const interests: Interest[] = [
  {
    id: "artificial-intelligence",
    title: "Artificial Intelligence",
    description:
      "От свежих релизов моделей до агентных систем: слежу, тестирую, собираю собственные сценарии использования.",
    icon: "brain",
    size: "lg",
  },
  {
    id: "programming",
    title: "Programming",
    description: "TypeScript и Python как рабочие инструменты. Чистый код, понятная архитектура.",
    icon: "code",
    size: "md",
  },
  {
    id: "crypto-analytics",
    title: "Crypto Analytics",
    description: "Структура рынка, данные, закономерности. Аналитика вместо прогнозов.",
    icon: "chart",
    size: "sm",
  },
  {
    id: "product-development",
    title: "Product Development",
    description: "Путь от гипотезы к продукту: проверка, прототип, релиз, выводы.",
    icon: "box",
    size: "sm",
  },
  {
    id: "digital-design",
    title: "Digital Design",
    description: "Типографика, сетки, движение. Дизайн как инженерия впечатления.",
    icon: "pen",
    size: "sm",
  },
  {
    id: "automation",
    title: "Automation",
    description: "Всё повторяющееся — под скрипт. Время дороже рутины.",
    icon: "zap",
    size: "sm",
  },
  {
    id: "new-technologies",
    title: "New Technologies",
    description: "Новые инструменты и протоколы — на испытательный полигон.",
    icon: "flask",
    size: "md",
  },
];

/* ─── Контакты (ПЛЕЙСХОЛДЕРЫ — замените на реальные) ─── */
export interface ContactLink {
  id: string;
  label: string;
  /** Отображаемое значение-плейсхолдер */
  value: string;
  /** Реальная ссылка. null — пока не задана, кнопка скопирует value */
  href: string | null;
  icon: "send" | "mail" | "github" | "globe";
  hint: string;
}

export const contacts: ContactLink[] = [
  {
    id: "telegram",
    label: "Telegram",
    value: "@charon_placeholder",
    href: null,
    icon: "send",
    hint: "Основной канал для быстрых сообщений",
  },
  {
    id: "email",
    label: "Email",
    value: "hello@charon.example",
    href: null,
    icon: "mail",
    hint: "Для идей, которые требуют деталей",
  },
  {
    id: "github",
    label: "GitHub",
    value: "github.com/charon-placeholder",
    href: null,
    icon: "github",
    hint: "Код и эксперименты",
  },
  {
    id: "social",
    label: "Соцсети",
    value: "ваш-профиль",
    href: null,
    icon: "globe",
    hint: "X / Discord / другой канал на выбор",
  },
];

/* ─── Навигация ─── */
export const navLinks = [
  { id: "home", label: "Главная" },
  { id: "about", label: "Обо мне" },
  { id: "projects", label: "Проекты" },
  { id: "interests", label: "Интересы" },
  { id: "contacts", label: "Контакты" },
] as const;
