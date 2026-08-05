/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
let file = fs.readFileSync('src/components/club/PublicCatalogTabs.tsx', 'utf8');

if (!file.includes('function t(bg: string, en: string, lang: string)')) {
  file = file.replace(
    /function renderTranslatedText/,
    `function t(bg: string, en: string, lang: string) {
  return lang === "en" ? <span className="notranslate">{en}</span> : bg;
}

function renderTranslatedText`
  );
}

// 1. Tab labels
file = file.replace(/>\s*Тренировки\s*<\/button>/, '> {t("Тренировки", "Trainings", lang)} </button>');
file = file.replace(/>\s*Клубни Услуги\s*<\/button>/, '> {t("Клубни Услуги", "Club Services", lang)} </button>');
file = file.replace(/>\s*Магазин\s*<\/button>/, '> {t("Магазин", "Shop", lang)} </button>');
file = file.replace(/>\s*Възстановяване\s*<\/button>/, '> {t("Възстановяване", "Recovery", lang)} </button>');

// 2. Category
file = file.replace(/>\s*Категория:\s*<\/span>/, '> {t("Категория:", "Category:", lang)} </span>');
file = file.replace(/{cat === "all" \? "Всички" : cat}/, '{cat === "all" ? t("Всички", "All", lang) : cat}');

// 3. No items found
file = file.replace(/<p className="text-sm font-light">Няма намерени артикули\.<\/p>/, '<p className="text-sm font-light">{t("Няма намерени артикули.", "No items found.", lang)}</p>');

// 4. Badges (products)
file = file.replace(/>\s*Изчерпан\s*<\/Badge>/, '> {t("Изчерпан", "Out of stock", lang)} </Badge>');
file = file.replace(/>\s*Ограничен \(\{item\.stock\} бр\.\)\s*<\/Badge>/, '> {t("Ограничен", "Low stock", lang)} ({item.stock} {t("бр.", "pcs.", lang)}) </Badge>');
file = file.replace(/>\s*В наличност\s*<\/Badge>/, '> {t("В наличност", "In stock", lang)} </Badge>');

// 5. getTabLabel
file = file.replace(/if \(currentTab === "trainings"\) return "Тренировка";/, 'if (currentTab === "trainings") return t("Тренировка", "Training", lang);');
file = file.replace(/if \(currentTab === "general"\) return "Услуга";/, 'if (currentTab === "general") return t("Услуга", "Service", lang);');
file = file.replace(/if \(currentTab === "recovery"\) return "Възстановяване";/, 'if (currentTab === "recovery") return t("Възстановяване", "Recovery", lang);');
file = file.replace(/return "Магазин";/, 'return t("Магазин", "Shop", lang);');

// 6. Features (Clock, Users, Calendar)
file = file.replace(/<span>\{item\.duration \|\| item\.durationMinutes\} минути<\/span>/, '<span>{item.duration || item.durationMinutes} {t("минути", "minutes", lang)}</span>');
file = file.replace(/<span>\{item\.athleteCount\} спортисти<\/span>/, '<span>{item.athleteCount} {t("спортисти", "athletes", lang)}</span>');
file = file.replace(/<span>\s*\{item\.numberOfDays \|\| 1\} дни \/ \{item\.proceduresPerDay \|\| 1\}\s*процедури на ден\s*<\/span>/, '<span>{item.numberOfDays || 1} {t("дни", "days", lang)} / {item.proceduresPerDay || 1} {t("процедури на ден", "procedures per day", lang)}</span>');

// 7. Price / Button
file = file.replace(/>\s*Цена\s*<\/span>/, '> {t("Цена", "Price", lang)} </span>');
file = file.replace(/"По заявка"/g, 'lang === "en" ? "On request" : "По заявка"'); // Covers both main and modal

// 8. Modal specific strings
file = file.replace(/>\s*Запиши се \/ Заяви\s*<\/a>/, '> {t("Запиши се / Заяви", "Book / Request", lang)} </a>');
file = file.replace(/Продължителност: /g, '{t("Продължителност: ", "Duration: ", lang)}');
file = file.replace(/ мин\s*<\/Badge>/g, ' {t("мин", "min", lang)} </Badge>');
file = file.replace(/Капацитет: /g, '{t("Капацитет: ", "Capacity: ", lang)}');
file = file.replace(/ спортисти\s*<\/Badge>/g, ' {t("спортисти", "athletes", lang)} </Badge>');
file = file.replace(/ дни \/\s*/g, ' {t("дни", "days", lang)} / ');
file = file.replace(/ процедури на ден\s*<\/Badge>/g, ' {t("процедури на ден", "procedures per day", lang)} </Badge>');
file = file.replace(/>\s*Ресурси\s*<\/h4>/, '> {t("Ресурси", "Resources", lang)} </h4>');
file = file.replace(/ компресора/g, ' {t("компресора", "compressors", lang)}');

// Fix getZonesDisplayText inside component to use lang
file = file.replace(
  /const getZonesDisplayText = \(\) => {/g,
  `const getZonesDisplayText = () => {
    const zonesStr = lang === "en" ? "Zones" : "Зони";
    const choiceStr = lang === "en" ? "Zone of choice" : "Зона по избор";`
);
file = file.replace(/return \`Зона по избор \(\$\{item\.zones\.join\(\", \"\)\}\)\`;/, 'return `${choiceStr} (${item.zones.join(", ")})`;');
file = file.replace(/return \`Зони: \$\{item\.zones\.join\(\", \"\)\}\`;/, 'return `${zonesStr}: ${item.zones.join(", ")}`;');
file = file.replace(/return \`Зони: \$\{item\.zones\}\`;/, 'return `${zonesStr}: ${item.zones}`;');

fs.writeFileSync('src/components/club/PublicCatalogTabs.tsx', file);
