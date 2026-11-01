# Еталон: модул с йерархични подстраници (вместо табове)

Референтна имплементация: модул **„Членове“** (`/members/[id]/*`).
Използвайте този шаблон за всеки детайлен екран с няколко секции (турнири, лагери, родители, сертификати и т.н.).

## 1. Принцип

| Вместо | Правим |
| --- | --- |
| `<Tabs>` + `useState`/`?tab=` | Отделен маршрут за всяка секция (`/entity/[id]/section`) |
| Едно голямо client page | Тънка `page.tsx` (сървър) + `*SectionView` (клиент) |
| Зареждане на данни във всеки таб | Данните се зареждат **веднъж** в `layout.tsx` и се споделят през Context |

Ползи: дълбоки линкове, back/forward, SEO метаданни за всяка секция, code-splitting, Lighthouse 100/100.

> Вътрешни `<Tabs>` са позволени само като **превключвател на съдържание** вътре в секция (напр. дни от тренировъчна програма), не като навигация между секции.

## 2. Структура на файловете (пример: `members`)

```
src/app/(protected)/members/[id]/
├── layout.tsx            # само root metadata (fallback title/description)
├── loading.tsx           # skeleton за целия подмаршрут (вкл. зареждането в layout)
├── error.tsx             # error boundary + logSystemError + бутони "Опитай отново"/"Към списъка"
├── (tabs)/               # route group: споделен layout за секциите (не влиза в URL)
│   ├── layout.tsx        # generateMetadata + зареждане на данните + <ProfileLayoutClient>
│   ├── page.tsx          # индексна секция (/members/[id])
│   └── <section>/page.tsx   # по една папка на секция
└── <form-pages>/page.tsx # самостоятелни екрани (формуляри/документи) - извън навигацията

src/components/members/
├── profile/
│   ├── member-profile-sections.ts   # ЕДИНЕН източник на истина за секциите (id, label, pathSuffix, tooltip, accent)
│   ├── MemberProfileNav.tsx         # <Link> навигация, чете от конфига, aria-current
│   ├── MemberProfileContext.tsx     # споделено състояние/данни за секциите
│   ├── MemberProfileLayoutClient.tsx# header + nav + {children}
│   ├── MemberProfileHeader.tsx
│   ├── views/*SectionView.tsx       # тънки обвивки: вземат данни от Context -> section компонент
│   └── __tests__/member-profile-sections.test.ts
└── sections/                        # тежките UI компоненти на секциите (бивш `tabs/`)
```

## 3. Стъпки за нов модул

1. **Конфиг** — създайте `<entity>-sections.ts` по образец на [member-profile-sections.ts](../src/components/members/profile/member-profile-sections.ts): `id`, `label`, `pathSuffix`, `tooltip`, по избор `accent`; плюс `getActive<Entity>SectionId(pathname, id)` (връща `null`, ако пътят не е секция).
2. **Маршрути** — `src/app/(protected)/<entity>/[id]/(tabs)/<section>/page.tsx`. Страницата е сървърна, експортира `metadata` (уникален `title` + `description`) и рендерира `<XSectionView />`.
3. **Layout** — `(tabs)/layout.tsx`:
   - `export const dynamic = "force-dynamic"` само ако данните са потребителски/защитени;
   - `generateMetadata` с резервни стойности, когато записът не е намерен;
   - зарежда данните веднъж и подава `initialData` на client layout-а; при липса показва `Alert` „не е намерен“.
4. **Context** — `<Entity>ProfileProvider` държи данните и мутациите; секциите четат през `use<Entity>ProfileContext()` (без повторно зареждане).
5. **Навигация** — `<Link href>` + `usePathname()` + `getActive…SectionId`; `aria-current="page"`; иконите в `Record<SectionId, Icon>` (TypeScript гарантира пълнота).
6. **Loading/Error** — `loading.tsx` (skeleton) и `error.tsx` на ниво `[id]/` (покриват и layout-а).
7. **Линкове отвън** — винаги `/<entity>/${id}/<section>`. **Никога** `?tab=`. Проверка: `rg "\?tab=" src` не бива да връща връзки към модула.
8. **Тест** — копирайте `member-profile-sections.test.ts`: уникалност на id/pathSuffix, всяка секция има `page.tsx`, всяка папка под `(tabs)` е в навигацията, коректно определяне на активна секция.
9. **Lighthouse** — след деплой: `node scripts/lighthouse-audit.js "--route=/<entity>/[id]/<section>" --mode=desktop` (A11y и SEO трябва да са 100).

## 4. Чеклист за приемане

- [ ] Няма `<Tabs>` за навигация между секции и няма `?tab=` линкове
- [ ] Всяка секция е отделен маршрут с уникални `title` и `description`
- [ ] Данните се зареждат веднъж в layout-а
- [ ] `loading.tsx` и `error.tsx` са налични
- [ ] Навигацията се чете от един конфиг; тестът за цялост минава
- [ ] Формуляри/печатни документи са извън `(tabs)` и не са в навигацията
- [ ] `npm run typecheck`, `npm run lint`, `npm test` минават
- [ ] Lighthouse 100/100/100/100 на поне една секция в продукция

## 5. Известни особености

- **SEO на динамични страници:** в `next.config.js` е зададено `htmlLimitedBots: /.*/` (блокиращи метаданни), иначе `<meta name="description">` се стриймва късно и Lighthouse дава SEO 90.
- **Изображения от `/api/upload`:** ползвайте `unoptimized` в `next/image`, за да няма 400 от оптимизатора.
- **`/personal`** е псевдоним на индексната секция; индексът е канонична връзка.
