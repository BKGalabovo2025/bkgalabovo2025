/**
 * AI Prompt Studio Library for Certificates & Vouchers
 * Специализирани инженерни промптове за генеративни AI платформи (Midjourney, Leonardo.ai, DALL-E 3, Canva)
 * Оптимизирани за създаване на безтекстови сертификатни фонове (Blank Center for Vector Typography)
 */

export type AiPromptPlatform = "midjourney" | "leonardo" | "dalle3" | "canva";

export interface PromptRecipe {
  id: string;
  name: string;
  category: "badminton" | "general_award" | "wellness";
  description: string;
  basePrompt: string;
  negativePrompt: string;
  recommendedColors: string[];
  recommendedOrientation: "landscape" | "portrait";
}

export const CERTIFICATE_PROMPT_RECIPES: PromptRecipe[] = [
  {
    id: "kids_badminton_award",
    name: "🏸 Детска Радост & Бадминтон Турнир",
    category: "badminton",
    description:
      "Весела, цветна 3D илюстрация в стил Pixar/Canva с бадминтон ракета, летящо перо, златни звезди и конфети.",
    basePrompt:
      "Vibrant high-quality certificate background for kids badminton achievement, cute 3D cartoon style, cheerful badminton shuttlecock and racket at the bottom corner, golden stars, colorful confetti and sunburst rays around the border, playful energetic atmosphere, soft pastel gradient lighting, completely blank empty spacious center with no text, clean space for typography, 8k resolution, cinematic lighting",
    negativePrompt:
      "text, words, letters, font, typography, watermark, logo, numbers, signature, crowded center, cluttered middle, blurry",
    recommendedColors: ["#F59E0B", "#3B82F6", "#10B981"],
    recommendedOrientation: "landscape",
  },
  {
    id: "championship_tournament",
    name: "🏆 Спортен Шампион & Златен Триумф",
    category: "badminton",
    description:
      "Драматичен спортен реализъм, арена прожектори, летящо златно перо за бадминтон и луксозен златни прах.",
    basePrompt:
      "Epic sports championship certificate background, professional badminton arena, dramatic stadium volumetric spotlight, golden shimmering dust particles, abstract motion blur of a badminton shuttlecock smash in the corner, dark navy and regal gold border accents, sleek modern design, wide completely empty center space for official diploma text, photorealistic 8k, Unreal Engine 5 render",
    negativePrompt:
      "text, writing, letters, title, signature, watermark, numbers, low quality, artifact, busy center, full canvas clutter",
    recommendedColors: ["#D97706", "#1E3A8A", "#0F172A"],
    recommendedOrientation: "landscape",
  },
  {
    id: "luxury_gold_diploma",
    name: "📜 Луксозен Класически Орнамент (24k Gold)",
    category: "general_award",
    description:
      "Елегантен гилоширан сертификатен кант със златно фолио върху тъмносин или кралски мраморен фон.",
    basePrompt:
      "Ultra-luxurious official certificate background, intricate 24k gold filigree guilloche ornamental borders, royal navy blue and white marble texture, subtle geometric security watermark patterns along the outer perimeter, pristine clean empty parchment middle area for printed text and seal, regal prestigious aesthetic, hyper-detailed vector borders, macro lens photography",
    negativePrompt:
      "text, letters, words, written certificate, certificate title, signature, noisy middle, low-res, blurry",
    recommendedColors: ["#CA8A04", "#1E293B", "#FAFAFA"],
    recommendedOrientation: "landscape",
  },
  {
    id: "recovery_wellness_voucher",
    name: "🌿 Recovery Zone Wellness & Дзен СПА",
    category: "wellness",
    description:
      "Успокояваща СПА естетика, свеж евкалипт, бамбук, полирани речни камъни и мека естествена светлина.",
    basePrompt:
      "Serene luxury wellness and recovery spa voucher background, soft morning sunlight, zen smooth river stones and fresh green eucalyptus leaves gently placed at the edges, minimalist beige and sage green aesthetic, soft bokeh, wide and spotless blank center area ready for text and QR code placement, ultra-clean commercial photography",
    negativePrompt:
      "text, numbers, voucher text, logo, writing, messy, cluttered center, high contrast harsh shadows",
    recommendedColors: ["#059669", "#78716C", "#ECFDF5"],
    recommendedOrientation: "landscape",
  },
  {
    id: "junior_star_certificate",
    name: "⭐ Изгряваща Звезда & Млад Талант",
    category: "badminton",
    description:
      "Мотивиращ динамичен фон за малки състезатели с неонови златни лъчи, подиум и трофей в ъгъла.",
    basePrompt:
      "Inspiring youth athletic award certificate background, stylized 3D golden trophy and flying shuttlecock in bottom left, bright energetic sunny gradient background, joyful golden sparkles framing the edges, spacious empty center designed for child name and congratulations, modern Canva premium aesthetic, clean vibrant vector look",
    negativePrompt:
      "text, alphabet, letters, signature, watermark, dirty, cluttered center, dark gothic",
    recommendedColors: ["#EAB308", "#6366F1", "#FFFFFF"],
    recommendedOrientation: "landscape",
  },
  {
    id: "cyber_sports_badminton",
    name: "⚡ Cyber Speed & Неонова Мощност",
    category: "badminton",
    description:
      "Модерен високотехнологичен фон с неонови светлинни следи, скоростно перо и тъмна кибер естетика.",
    basePrompt:
      "Futuristic high-tech esports badminton certificate background, glowing cyan and gold light streaks, high-speed shuttlecock trajectory trails along the perimeter, dark obsidian textured backdrop with neon circuit accents at borders, completely clear and dark central area for glowing typography, sleek sci-fi tournament branding, 8k",
    negativePrompt:
      "text, typography, letters, words, watermark, logos, crowded middle, messy background",
    recommendedColors: ["#06B6D4", "#F59E0B", "#09090B"],
    recommendedOrientation: "landscape",
  },
];

/**
 * Курирана галерия от готови премиум AI фонове за незабавен избор без генериране
 */
export interface CuratedAiBackground {
  id: string;
  name: string;
  category: "kids" | "championship" | "gold" | "wellness";
  imageUrl: string;
  previewUrl: string;
  recommendedTextMode: "light" | "dark";
  orientation: "landscape" | "portrait";
}

export const CURATED_AI_BACKGROUNDS: CuratedAiBackground[] = [
  {
    id: "curated_gold_championship",
    name: "Златен Триумф (Спортен Шампион)",
    category: "championship",
    imageUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=85",
    previewUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80",
    recommendedTextMode: "light",
    orientation: "landscape",
  },
  {
    id: "curated_badminton_court",
    name: "Динамична Корт Арена (БК Гълъбово)",
    category: "kids",
    imageUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1600&auto=format&fit=crop&q=85",
    previewUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80",
    recommendedTextMode: "light",
    orientation: "landscape",
  },
  {
    id: "curated_luxury_parchment",
    name: "Кралски Златен Сертификат",
    category: "gold",
    imageUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=85",
    previewUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80",
    recommendedTextMode: "dark",
    orientation: "landscape",
  },
  {
    id: "curated_recovery_zen",
    name: "Recovery Zone Дзен СПА (Зелен Мрамор)",
    category: "wellness",
    imageUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&auto=format&fit=crop&q=85",
    previewUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80",
    recommendedTextMode: "light",
    orientation: "landscape",
  },
  {
    id: "curated_navy_gold",
    name: "Тъмносин Мрамор със Златен Прах",
    category: "gold",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=85",
    previewUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    recommendedTextMode: "light",
    orientation: "landscape",
  },
];

/**
 * Бързи линкове към безплатни водещи генератори на AI изображения
 */
export const AI_GENERATOR_WEB_TOOLS = [
  {
    name: "Leonardo.ai",
    url: "https://app.leonardo.ai",
    badge: "Препоръчан (Безплатен)",
    note: "Идеален с модела Leonardo Phoenix за спортни фонове",
  },
  {
    name: "Bing Image Creator (DALL-E 3)",
    url: "https://www.bing.com/images/create",
    badge: "100% Безплатен",
    note: "Бързо генериране през Microsoft акаунт с DALL-E 3",
  },
  {
    name: "Canva Magic Media",
    url: "https://www.canva.com",
    badge: "Дизайн Студио",
    note: "Позволява експорт директно в A4 резолюция",
  },
  {
    name: "Midjourney Discord",
    url: "https://discord.com",
    badge: "Максимално Качество",
    note: "Използвайте параметър --ar 16:9 --v 6.1",
  },
];

/**
 * Форматира пълен промпт според избраната AI платформа и ориентация
 */
export function formatAiPromptForPlatform(
  recipe: PromptRecipe,
  platform: AiPromptPlatform,
  orientation: "landscape" | "portrait" = "landscape"
): { prompt: string; negativePrompt: string } {
  const ar = orientation === "landscape" ? "16:9" : "9:16";

  switch (platform) {
    case "midjourney":
      return {
        prompt: `${recipe.basePrompt} --ar ${ar} --v 6.1 --style raw --no ${recipe.negativePrompt.replace(/,/g, "")}`,
        negativePrompt: recipe.negativePrompt,
      };

    case "leonardo":
      return {
        prompt: recipe.basePrompt,
        negativePrompt: `${recipe.negativePrompt}, low resolution, blurry edges, off-center artifacts`,
      };

    case "dalle3":
      return {
        prompt: `A professional certificate background without any text or words on it: ${recipe.basePrompt}. Strictly maintain an empty blank center space for custom printed text. Aspect ratio: ${ar}.`,
        negativePrompt: recipe.negativePrompt,
      };

    case "canva":
    default:
      return {
        prompt: `${recipe.basePrompt}. Empty blank middle area for adding text. Aspect ratio ${ar}.`,
        negativePrompt: recipe.negativePrompt,
      };
  }
}
