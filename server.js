const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const automationStatePath = path.join(root, "automation-state.json");
const automationPresetsPath = path.join(root, "automation-presets.json");
const port = Number(process.env.PORT || 4173);
const wpComSite = process.env.WPCOM_SITE || "casualnewsmag26.wordpress.com";
const wpComClientId = process.env.WPCOM_CLIENT_ID || "";
const wpComClientSecret = process.env.WPCOM_CLIENT_SECRET || "";
const wpComRedirectUri = process.env.WPCOM_REDIRECT_URI || `http://localhost:${port}/oauth/callback`;
let wpComToken = process.env.WPCOM_ACCESS_TOKEN || "";
let oauthState = "";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const pexelsApiKey = process.env.PEXELS_API_KEY || "";
const facebookPageId = process.env.FACEBOOK_PAGE_ID || "";
const facebookPageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
const publicSiteUrl = process.env.PUBLIC_SITE_URL || "https://news.pulsemag.net";
const automationIntervalMs = 30 * 60 * 1000;
let wpComCategoriesCache = null;
const categorySubcategoryMap = {
  Sport: ["Futboll", "NBA", "Tennis", "Formula 1", "Te tjera"],
  Teknologji: ["AI", "Smartphones", "IT Universe", "Apps & Software", "Gaming", "Te ndryshme"],
  Lifestyle: ["Moda", "Shendet", "Udhetime", "Marredhenie", "Horoskop"],
  Kulture: ["Libra", "Art", "Teater", "Evente"],
  Argetim: ["Kinema", "TV & Showbiz", "Celebrities", "Influencers", "Muzike"],
};
const legacyCategoryRedirects = {
  Moda: { category: "Lifestyle", subcategory: "Moda" },
  Horoskop: { category: "Lifestyle", subcategory: "Horoskop" },
  Kinema: { category: "Argetim", subcategory: "Kinema" },
  "Celebrities&Influencers": { category: "Argetim", subcategory: "Celebrities" },
};
const automationState = {
  running: false,
  steps: [],
  currentStepIndex: 0,
  currentStep: null,
  timer: null,
  nextRunAt: null,
  lastRunAt: null,
  lastResult: null,
  lastError: "",
  inFlight: false,
};

function normalizeCategorySelection(categoryValue = "", subcategoryValue = "") {
  const redirect = legacyCategoryRedirects[categoryValue];
  if (!redirect) {
    return {
      category: categoryValue || "Sport",
      subcategory: subcategoryValue || "",
    };
  }

  return {
    category: redirect.category,
    subcategory: subcategoryValue || redirect.subcategory || "",
  };
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

const newsQueryMap = {
  sport: ["sports", "football OR soccer", "basketball OR NBA", "tennis"],
  futboll: ["football OR soccer transfer OR match", "champions league OR premier league", "fifa OR uefa"],
  nba: ["NBA trade OR game", "basketball playoffs", "NBA injuries OR highlights"],
  tennis: ["tennis ATP OR WTA", "grand slam tennis", "tennis match"],
  "formula-1": ["formula 1 latest news", "f1 race OR grand prix", "formula one drivers"],
  "te-tjera": ["sports latest news", "athletics OR combat sports", "sports roundup"],
  teknologji: ["technology latest news", "AI technology", "consumer tech"],
  ai: ["artificial intelligence latest news", "AI startup OR model", "machine learning news"],
  smartphones: ["smartphone launch OR mobile phone", "android OR iphone latest", "mobile tech review"],
  "it-universe": ["cybersecurity OR cloud computing", "software development news", "enterprise IT news"],
  "apps-software": ["software apps latest news", "app launch OR update", "saas OR software trends"],
  gaming: ["gaming latest news", "video game release", "esports OR gaming industry"],
  "te-ndryshme": ["technology trends", "gadgets latest news", "digital world"],
  moda: ["fashion latest news", "runway style", "fashion industry"],
  lifestyle: ["lifestyle trends", "wellness travel culture", "daily lifestyle news"],
  "moda-lifestyle": ["fashion lifestyle trends", "personal style latest", "wellness and fashion"],
  shendet: ["health wellness latest", "healthy living trends", "nutrition and fitness"],
  udhetime: ["travel latest news", "tourism trends", "destination travel guide"],
  marredhenie: ["relationships advice trends", "dating and relationships", "personal growth relationships"],
  "horoskop-lifestyle": ["daily horoscope lifestyle", "astrology wellness", "zodiac trends"],
  horoskop: ["astrology zodiac daily", "horoscope trends", "spiritual lifestyle"],
  kulture: ["art culture latest news", "books exhibition festival", "cultural events"],
  libra: ["books latest news", "author interview", "book festival"],
  art: ["art latest news", "gallery exhibition", "visual arts"],
  teater: ["theater latest news", "stage performance", "play premiere"],
  evente: ["culture events latest", "festival event", "arts calendar"],
  argetim: ["entertainment latest news", "showbiz trends", "music film pop culture"],
  "kinema-argetim": ["movie latest news", "cinema premiere", "film industry"],
  "tv-showbiz": ["tv showbiz latest news", "television celebrities", "showbiz news"],
  celebrities: ["celebrity latest news", "red carpet celebrity", "famous people news"],
  influencers: ["influencer latest news", "creator economy", "social media influencers"],
  muzike: ["music latest news", "album release", "concert tour"],
  kinema: ["cinema latest news", "movie premiere", "film industry"],
  "celebrities-influencers": ["celebrity latest news", "influencer trend", "entertainment social media"],
};

const imageQueryMap = {
  sport: ["sports action", "stadium crowd", "athlete competition"],
  futboll: ["football match", "soccer stadium", "football players"],
  nba: ["basketball game", "nba style arena", "basketball player action"],
  tennis: ["tennis match", "tennis player action", "tennis court"],
  "formula-1": ["formula 1 race car", "grand prix track", "formula one driver"],
  "te-tjera": ["sports event", "athlete portrait", "sports training"],
  teknologji: ["technology abstract", "modern gadgets", "digital innovation"],
  ai: ["artificial intelligence", "robotics technology", "data interface"],
  smartphones: ["smartphone close up", "mobile technology", "phone launch"],
  "it-universe": ["cybersecurity server room", "software developer workspace", "cloud computing"],
  "apps-software": ["software dashboard", "app interface workspace", "laptop coding app"],
  gaming: ["gaming setup", "video game controller", "esports arena"],
  "te-ndryshme": ["technology workspace", "gadgets desk setup", "digital world"],
  moda: ["fashion editorial", "runway style", "high fashion portrait"],
  lifestyle: ["wellness lifestyle", "urban lifestyle", "travel aesthetic"],
  "moda-lifestyle": ["fashion lifestyle portrait", "stylish editorial", "fashion accessories"],
  shendet: ["health wellness lifestyle", "fitness healthy living", "nutrition wellness"],
  udhetime: ["travel destination landscape", "airport traveler", "vacation city view"],
  marredhenie: ["couple lifestyle", "friends conversation", "relationship portrait"],
  "horoskop-lifestyle": ["astrology zodiac art", "horoscope illustration", "cosmic symbols"],
  horoskop: ["night sky stars", "zodiac cosmic", "astrology aesthetic"],
  kulture: ["art gallery", "books culture", "theater stage"],
  libra: ["books reading table", "library books", "open book aesthetic"],
  art: ["art gallery exhibition", "painting studio", "modern art museum"],
  teater: ["theater stage lights", "stage performance", "dramatic theater scene"],
  evente: ["cultural event crowd", "festival stage", "arts event"],
  argetim: ["entertainment lights", "red carpet event", "pop culture collage"],
  "kinema-argetim": ["movie premiere", "cinema screen", "film production set"],
  "tv-showbiz": ["tv studio lights", "showbiz event", "television set"],
  celebrities: ["celebrity portrait", "red carpet flash", "famous person event"],
  influencers: ["social media creator", "influencer phone portrait", "content creator studio"],
  muzike: ["concert stage lights", "music performance", "microphone stage"],
  kinema: ["cinema screen", "movie set", "film production"],
  "celebrities-influencers": ["celebrity portrait", "red carpet", "social media influencer"],
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function persistAutomationState() {
  const payload = {
    running: automationState.running,
    steps: automationState.steps,
    currentStepIndex: automationState.currentStepIndex,
    currentStep: automationState.currentStep,
    nextRunAt: automationState.nextRunAt,
    lastRunAt: automationState.lastRunAt,
    lastResult: automationState.lastResult,
    lastError: automationState.lastError,
  };

  fs.writeFileSync(automationStatePath, JSON.stringify(payload, null, 2), "utf8");
}

function loadAutomationPresets() {
  if (!fs.existsSync(automationPresetsPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(automationPresetsPath, "utf8");
    const payload = JSON.parse(raw);
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

function saveAutomationPresets(presets) {
  fs.writeFileSync(automationPresetsPath, JSON.stringify(presets, null, 2), "utf8");
}

function scheduleAutomationRun(delayMs) {
  if (automationState.timer) {
    clearTimeout(automationState.timer);
  }

  automationState.timer = setTimeout(runAutomationCycle, Math.max(0, delayMs));
}

function restoreAutomationState() {
  if (!fs.existsSync(automationStatePath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(automationStatePath, "utf8");
    const payload = JSON.parse(raw);

    automationState.running = Boolean(payload.running);
    automationState.steps = Array.isArray(payload.steps) ? payload.steps.map((step) => normalizeAutomationConfig(step)) : [];
    automationState.currentStepIndex = Math.max(0, Math.min(Number(payload.currentStepIndex || 0), Math.max(automationState.steps.length - 1, 0)));
    automationState.currentStep = automationState.steps[automationState.currentStepIndex] || null;
    automationState.nextRunAt = payload.nextRunAt || null;
    automationState.lastRunAt = payload.lastRunAt || null;
    automationState.lastResult = payload.lastResult || null;
    automationState.lastError = payload.lastError || "";

    if (automationState.running && automationState.steps.length) {
      const targetTime = automationState.nextRunAt ? new Date(automationState.nextRunAt).getTime() : Date.now();
      const delayMs = Number.isNaN(targetTime) ? 0 : Math.max(0, targetTime - Date.now());
      scheduleAutomationRun(delayMs);
    } else {
      automationState.running = false;
      automationState.steps = [];
      automationState.currentStepIndex = 0;
      automationState.currentStep = null;
      automationState.nextRunAt = null;
    }
  } catch (error) {
    console.error("Automation state restore failed:", error.message);
  }
}

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error("Request body too large."));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(value) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function pickNewsQuery(config) {
  const key = sanitizeSlugPart(config.subcategory || config.sportSubcategory || config.technologySubcategory || config.category);
  const queries = newsQueryMap[key] || newsQueryMap[sanitizeSlugPart(config.category)] || ["latest news today"];
  return queries[Math.floor(Math.random() * queries.length)];
}

function pickImageQuery(config, articleTitle = "") {
  const key = sanitizeSlugPart(config.subcategory || config.sportSubcategory || config.technologySubcategory || config.category);
  const queries = imageQueryMap[key] || imageQueryMap[sanitizeSlugPart(config.category)] || ["news editorial"];
  const baseQuery = queries[Math.floor(Math.random() * queries.length)];
  return articleTitle ? `${baseQuery} ${articleTitle}` : baseQuery;
}

function parseRssItems(xml) {
  const items = [];
  const matches = String(xml || "").match(/<item\b[\s\S]*?<\/item>/g) || [];

  for (const itemXml of matches) {
    const getTag = (tag) => {
      const match = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return match ? match[1] : "";
    };

    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const titleRaw = decodeHtmlEntities(getTag("title"));
    const [headline, trailingSource] = titleRaw.split(/\s+-\s+(?=[^-]+$)/);
    const title = (headline || titleRaw).trim();
    const source = stripHtml(sourceMatch?.[1] || trailingSource || "");
    const link = decodeHtmlEntities(getTag("link"));
    const description = stripHtml(getTag("description"));
    const pubDate = getTag("pubDate");

    if (title && link) {
      items.push({
        title,
        link,
        description,
        source,
        pubDate,
      });
    }
  }

  return items;
}

async function fetchNewsCandidates(config) {
  const query = pickNewsQuery(config);
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:1d`)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent": "PulseMagBot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Burimet e lajmeve nuk po përgjigjen tani.");
  }

  const xml = await response.text();
  const items = parseRssItems(xml)
    .filter((item) => {
      const time = new Date(item.pubDate).getTime();
      return Number.isNaN(time) || Date.now() - time < 48 * 60 * 60 * 1000;
    })
    .slice(0, 12);

  if (!items.length) {
    throw new Error("Nuk u gjetën lajme të freskëta për këtë kategori.");
  }

  return items;
}

async function searchPexelsPhoto(config, articleTitle) {
  if (!pexelsApiKey) {
    throw new Error("Mungon PEXELS_API_KEY për fotot automatike.");
  }

  const query = pickImageQuery(config, articleTitle);
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
    {
      headers: {
        Authorization: pexelsApiKey,
      },
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Pexels nuk po përgjigjet për fotot.");
  }

  const candidates = payload.photos || [];
  if (!candidates.length) {
    throw new Error("Nuk u gjet asnjë foto e përshtatshme në Pexels.");
  }

  const photo = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    imageUrl: photo.src?.large2x || photo.src?.landscape || photo.src?.large || photo.src?.original,
    photographer: photo.photographer || "",
    photographerUrl: photo.photographer_url || "",
  };
}

function buildCategoryString({ category, subcategory = "", sportSubcategory = "", technologySubcategory = "" }) {
  const normalizedSelection = normalizeCategorySelection(
    category,
    subcategory || sportSubcategory || technologySubcategory || ""
  );
  return normalizedSelection.subcategory
    ? `${normalizedSelection.category},${normalizedSelection.subcategory}`
    : normalizedSelection.category;
}

function sanitizeSlugPart(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getWpComCategories() {
  if (wpComCategoriesCache) {
    return wpComCategoriesCache;
  }

  const response = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${wpComSite}/categories`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Kategoritë e WordPress nuk u lexuan.");
  }

  wpComCategoriesCache = data.categories || [];
  return wpComCategoriesCache;
}

async function resolveWordPressCategoryIds(selection) {
  const categories = await getWpComCategories();
  const wantedSlugs = [
    sanitizeSlugPart(selection.category),
    sanitizeSlugPart(selection.subcategory),
  ].filter(Boolean);

  return wantedSlugs
    .map((slug) => categories.find((entry) => sanitizeSlugPart(entry.slug) === slug))
    .filter(Boolean)
    .map((entry) => entry.ID);
}

function buildInternalArticleUrl(payload, wordpressResult) {
  const postId = wordpressResult.postId || wordpressResult.id || "";
  if (!postId) {
    return "";
  }

  const normalizedSelection = normalizeCategorySelection(
    payload.category,
    payload.subcategory || payload.sportSubcategory || payload.technologySubcategory || ""
  );
  const categoryKey = sanitizeSlugPart(normalizedSelection.category);
  const subcategorySlug = sanitizeSlugPart(normalizedSelection.subcategory);
  const articleUrl = new URL("/", publicSiteUrl.endsWith("/") ? publicSiteUrl : `${publicSiteUrl}/`);

  articleUrl.searchParams.set("article", String(postId));

  if (categoryKey) {
    articleUrl.searchParams.set("category", categoryKey);
  }

  if (subcategorySlug) {
    articleUrl.searchParams.set("subcategory", subcategorySlug);
  }

  return articleUrl.toString();
}

function normalizeAutomationConfig(payload = {}) {
  const normalizedSelection = normalizeCategorySelection(
    payload.category || "Sport",
    payload.subcategory || payload.sportSubcategory || payload.technologySubcategory || ""
  );
  const category = normalizedSelection.category;
  const availableSubcategories = categorySubcategoryMap[category] || [];
  const rawSubcategory = normalizedSelection.subcategory;
  const subcategory = availableSubcategories.includes(rawSubcategory) ? rawSubcategory : "";
  const status = payload.status === "publish" ? "publish" : "draft";
  const generateImage = payload.generateImage === true || payload.generateImage === "true" || payload.generateImage === "on";
  const delayMinutes = Math.max(1, Number(payload.delayMinutes || 30));

  return {
    category,
    subcategory,
    status,
    generateImage,
    delayMinutes,
  };
}

function getAutomationSummary(config) {
  const subcategory = config.subcategory || config.sportSubcategory || config.technologySubcategory;
  return subcategory ? `${config.category} / ${subcategory}` : config.category;
}

function normalizeAutomationSteps(payload = {}) {
  const rawSteps = Array.isArray(payload.steps) ? payload.steps : [];
  return rawSteps
    .map((step) => normalizeAutomationConfig(step))
    .filter((step) => step.category);
}

async function uploadFeaturedImage({ imageBase64 = "", imageName = "", imageType = "" }) {
  if (!imageBase64 || !imageName || !imageType) {
    return {
      id: "",
      url: "",
    };
  }

  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  const base64Content = matches ? matches[2] : imageBase64;
  const imageBuffer = Buffer.from(base64Content, "base64");
  const uploadForm = new FormData();
  const imageBlob = new Blob([imageBuffer], { type: imageType });
  uploadForm.append("media[]", imageBlob, imageName);

  const mediaResponse = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${wpComSite}/media/new`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${wpComToken}`,
    },
    body: uploadForm,
  });

  const mediaData = await mediaResponse.json();
  if (!mediaResponse.ok || !mediaData.media || !mediaData.media.length) {
    throw new Error(mediaData.error || mediaData.message || "Ngarkimi i fotos dështoi.");
  }

  return {
    id: String(mediaData.media[0].ID || ""),
    url: mediaData.media[0].URL || mediaData.media[0].url || "",
  };
}

async function downloadImageAsDataUrl(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent": "PulseMagBot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Shkarkimi i fotos nga Pexels dështoi.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";

  return {
    imageBase64: `data:${mimeType};base64,${base64}`,
    imageType: mimeType,
    imageExtension: extension,
  };
}

function buildFacebookCaption(payload, wordpressResult) {
  const articleLink = wordpressResult.publicLink || wordpressResult.link || "";
  const parts = [
    payload.title?.trim() || wordpressResult.title || "",
    payload.excerpt?.trim() || "",
    articleLink,
  ].filter(Boolean);

  return parts.join("\n\n");
}

async function publishToFacebookPage(payload, wordpressResult) {
  if (!facebookPageId || !facebookPageAccessToken) {
    return {
      enabled: false,
      published: false,
      reason: "Facebook Page credentials are not configured.",
    };
  }

  if ((wordpressResult.status || payload.status) !== "publish") {
    return {
      enabled: true,
      published: false,
      reason: "Postimi është draft, ndaj nuk u dërgua në Facebook.",
    };
  }

  const hasImage = Boolean(wordpressResult.imageUrl);
  const body = new URLSearchParams(
    hasImage
      ? {
          caption: buildFacebookCaption(payload, wordpressResult),
          url: wordpressResult.imageUrl,
          access_token: facebookPageAccessToken,
        }
      : {
          message: buildFacebookCaption(payload, wordpressResult),
          link: wordpressResult.publicLink || wordpressResult.link || "",
          access_token: facebookPageAccessToken,
        }
  );

  const response = await fetch(`https://graph.facebook.com/v25.0/${facebookPageId}/${hasImage ? "photos" : "feed"}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Postimi në Facebook dështoi.");
  }

  return {
    enabled: true,
    published: true,
    id: data.id || "",
  };
}

async function createWordPressPost(payload) {
  if (!wpComToken) {
    throw new Error("Paneli nuk është i lidhur me WordPress.com.");
  }

  const normalizedSelection = normalizeCategorySelection(
    payload.category,
    payload.subcategory || payload.sportSubcategory || payload.technologySubcategory || ""
  );
  const normalizedPayload = {
    ...payload,
    category: normalizedSelection.category,
    subcategory: normalizedSelection.subcategory,
  };
  const categoryIds = await resolveWordPressCategoryIds(normalizedSelection);
  const featuredImage = await uploadFeaturedImage(payload);
  const wordpressPayload = {
    title: normalizedPayload.title.trim(),
    content: normalizedPayload.content.trim(),
    excerpt: normalizedPayload.excerpt.trim(),
    categories: categoryIds.length ? categoryIds.join(",") : buildCategoryString(normalizedPayload),
    status: normalizedPayload.status,
    featured_image: featuredImage.id,
  };

  const response = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${wpComSite}/posts/new`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${wpComToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(wordpressPayload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "WordPress nuk e pranoi postimin.");
  }

  const result = {
    success: true,
    postId: data.ID,
    link: data.URL,
    publicLink: "",
    imageUrl: featuredImage.url || data.featured_image || "",
    title: data.title,
    status: data.status,
  };

  result.publicLink = buildInternalArticleUrl(normalizedPayload, result);

  try {
    result.facebook = await publishToFacebookPage(normalizedPayload, result);
  } catch (facebookError) {
    result.facebook = {
      enabled: true,
      published: false,
      error: facebookError.message || "Facebook autopost dështoi.",
    };
  }

  return result;
}

async function generateArticleWithAi(config) {
  if (!geminiApiKey) {
    throw new Error("Mungon GEMINI_API_KEY për gjenerimin automatik të postimeve.");
  }

  const newsItems = await fetchNewsCandidates(config);
  const primaryItem = newsItems[Math.floor(Math.random() * newsItems.length)];
  const relatedItems = newsItems
    .filter((item) => item.link !== primaryItem.link)
    .slice(0, 3)
    .map((item) => `- ${item.title} | ${item.source || "Burim i panjohur"} | ${item.link}`);

  const subcategory = config.subcategory || config.sportSubcategory || config.technologySubcategory;
  const prompt = [
    "Ti je redaktor i portalit PulseMag.",
    "Shkruaj në shqip standarde, me ton gazetaresk, të qartë, të shkurtër dhe profesional.",
    `Kategoria është ${config.category}${subcategory ? ` dhe nënkategoria është ${subcategory}` : ""}.`,
    "Do të marrësh një lajm real të ditës nga interneti dhe duhet ta rishkruash si artikull origjinal për portal lajmesh.",
    "Mos shpik fakte përtej informacionit të dhënë. Nëse diçka nuk është e qartë, mbaje formulimin neutral.",
    "Mos përmend që teksti është krijuar nga AI.",
    "Kthe vetëm JSON të vlefshëm me fushat: title, excerpt, content.",
    `Lajmi kryesor: ${primaryItem.title}`,
    `Burimi kryesor: ${primaryItem.source || "Burim i panjohur"}`,
    `Linku kryesor: ${primaryItem.link}`,
    `Përshkrimi: ${primaryItem.description || "Pa përshkrim shtesë."}`,
    `Koha e publikimit sipas feed-it: ${primaryItem.pubDate || "Pa datë."}`,
    `Burime të tjera të ngjashme:\n${relatedItems.join("\n") || "- Nuk ka burime shtesë."}`,
    "Përmbajtja të jetë rreth 180-320 fjalë, me 3-5 paragrafë të shkurtër.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gjenerimi i tekstit me Gemini dështoi.");
  }

  const rawContent = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "{}";
  let article;

  try {
    article = JSON.parse(rawContent);
  } catch {
    throw new Error("Gemini nuk ktheu JSON të vlefshëm për artikullin.");
  }

  if (!article.title || !article.content) {
    throw new Error("Gemini nuk ktheu titullin ose përmbajtjen e plotë.");
  }

  const sourceFooter = [
    "",
    "<p><strong>Burimi fillestar i monitoruar:</strong> " +
      `${primaryItem.source || "Burim i panjohur"} - <a href="${primaryItem.link}" target="_blank" rel="noreferrer">lexo linkun origjinal</a></p>`,
  ].join("");

  return {
    title: String(article.title).trim(),
    excerpt: String(article.excerpt || "").trim(),
    content: `${String(article.content).trim()}${sourceFooter}`,
  };
}

async function fetchImageForArticle(article, config) {
  const photo = await searchPexelsPhoto(config, article.title);
  const downloaded = await downloadImageAsDataUrl(photo.imageUrl);
  const slugBase = sanitizeSlugPart(article.title) || "pulsemag-cover";

  return {
    imageBase64: downloaded.imageBase64,
    imageName: `${slugBase}.${downloaded.imageExtension}`,
    imageType: downloaded.imageType,
  };
}

async function runAutomationCycle() {
  if (!automationState.running || automationState.inFlight || !automationState.steps.length) {
    return;
  }

  automationState.inFlight = true;
  automationState.lastError = "";

  try {
    const config = automationState.steps[automationState.currentStepIndex];
    automationState.currentStep = config;

    const article = await generateArticleWithAi(config);
    const imagePayload = config.generateImage ? await fetchImageForArticle(article, config) : {};
    const result = await createWordPressPost({
      ...config,
      ...article,
      ...imagePayload,
    });

    automationState.lastRunAt = new Date().toISOString();
    automationState.lastResult = result;
    const currentDelay = Math.max(1, Number(config.delayMinutes || 30));
    automationState.currentStepIndex = (automationState.currentStepIndex + 1) % automationState.steps.length;
    automationState.currentStep = automationState.steps[automationState.currentStepIndex] || null;
    const nextDelayMs = currentDelay * 60 * 1000;
    automationState.nextRunAt = new Date(Date.now() + nextDelayMs).toISOString();
    persistAutomationState();
    scheduleAutomationRun(nextDelayMs);
  } catch (error) {
    automationState.lastRunAt = new Date().toISOString();
    automationState.lastError = error.message || "Ndodhi një gabim gjatë postimit automatik.";
    const retryDelayMs = 15 * 60 * 1000;
    automationState.nextRunAt = new Date(Date.now() + retryDelayMs).toISOString();
    persistAutomationState();
    scheduleAutomationRun(retryDelayMs);
  } finally {
    automationState.inFlight = false;
  }
}

function startAutomation(config) {
  const normalizedSteps = normalizeAutomationSteps(config);

  if (automationState.timer) {
    clearTimeout(automationState.timer);
  }

  if (!normalizedSteps.length) {
    throw new Error("Shto të paktën një hap aktiv në planifikim.");
  }

  automationState.running = true;
  automationState.steps = normalizedSteps;
  automationState.currentStepIndex = 0;
  automationState.currentStep = normalizedSteps[0];
  automationState.lastError = "";
  automationState.lastResult = null;
  automationState.nextRunAt = new Date().toISOString();
  automationState.timer = null;
  persistAutomationState();

  runAutomationCycle();
}

function stopAutomation() {
  if (automationState.timer) {
    clearTimeout(automationState.timer);
  }

  automationState.running = false;
  automationState.steps = [];
  automationState.currentStepIndex = 0;
  automationState.currentStep = null;
  automationState.timer = null;
  automationState.nextRunAt = null;
  automationState.inFlight = false;
  persistAutomationState();
}

function getAutomationStatusPayload() {
  return {
    running: automationState.running,
    currentStepIndex: automationState.currentStepIndex,
    currentStep: automationState.currentStep,
    totalSteps: automationState.steps.length,
    steps: automationState.steps.map((step, index) => ({
      index,
      summary: getAutomationSummary(step),
      delayMinutes: step.delayMinutes,
      status: step.status,
      generateImage: step.generateImage,
    })),
    summary: automationState.currentStep ? getAutomationSummary(automationState.currentStep) : "Pa plan aktiv",
    nextRunAt: automationState.nextRunAt,
    lastRunAt: automationState.lastRunAt,
    lastResult: automationState.lastResult,
    lastError: automationState.lastError,
    aiReady: Boolean(geminiApiKey),
    imageReady: Boolean(pexelsApiKey),
    inFlight: automationState.inFlight,
  };
}

async function handlePublisherStatus(res) {
  sendJson(res, 200, {
    configured: Boolean(wpComToken),
    site: wpComSite,
    oauthReady: Boolean(wpComClientId && wpComClientSecret),
    authorizeUrl: wpComClientId && wpComClientSecret ? "/oauth/start" : null,
    aiReady: Boolean(geminiApiKey),
    imageReady: Boolean(pexelsApiKey),
    facebookReady: Boolean(facebookPageId && facebookPageAccessToken),
  });
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function handleOAuthStart(res) {
  if (!wpComClientId || !wpComClientSecret) {
    sendJson(res, 400, {
      error: "Mungon WPCOM_CLIENT_ID ose WPCOM_CLIENT_SECRET.",
    });
    return;
  }

  oauthState = crypto.randomBytes(16).toString("hex");
  const authorizeUrl = new URL("https://public-api.wordpress.com/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", wpComClientId);
  authorizeUrl.searchParams.set("redirect_uri", wpComRedirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "global");
  authorizeUrl.searchParams.set("state", oauthState);
  redirect(res, authorizeUrl.toString());
}

async function handleOAuthCallback(req, res) {
  const requestUrl = new URL(req.url || "", `http://localhost:${port}`);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>OAuth u anulua</h1><p>${error}</p><p><a href="/admin.html">Kthehu te paneli</a></p>`);
    return;
  }

  if (!code || !state || state !== oauthState) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>OAuth dështoi</h1><p>State ose code nuk përputhen.</p>");
    return;
  }

  try {
    const tokenResponse = await fetch("https://public-api.wordpress.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: wpComClientId,
        client_secret: wpComClientSecret,
        redirect_uri: wpComRedirectUri,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new Error(tokenPayload.error_description || tokenPayload.error || "Token-i nuk u mor.");
    }

    wpComToken = tokenPayload.access_token;
    oauthState = "";

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html lang="sq">
        <head><meta charset="utf-8"><title>OAuth gati</title></head>
        <body style="font-family: sans-serif; padding: 32px;">
          <h1>Lidhja me WordPress.com u krye</h1>
          <p>Tani mund të kthehesh te paneli dhe të krijosh postime.</p>
          <p><a href="/admin.html">Hap panelin</a></p>
        </body>
      </html>
    `);
  } catch (oauthError) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>OAuth dështoi</h1><p>${oauthError.message}</p>`);
  }
}

async function handleCreatePost(req, res) {
  if (!wpComToken) {
    sendJson(res, 400, {
      error: "Mungon WPCOM_ACCESS_TOKEN. Vendose token-in para se ta përdorësh panelin.",
    });
    return;
  }

  try {
    const rawBody = await collectRequestBody(req);
    const payload = JSON.parse(rawBody || "{}");
    const {
      title = "",
      excerpt = "",
      content = "",
      category = "Sport",
        subcategory = "",
        status = "publish",
        imageBase64 = "",
        imageName = "",
      imageType = "",
    } = payload;

    if (!title.trim() || !content.trim()) {
      sendJson(res, 400, {
        error: "Titulli dhe përmbajtja janë të detyrueshme.",
      });
      return;
    }

    const result = await createWordPressPost({
        title,
        excerpt,
        content,
        category,
        subcategory,
        status,
        imageBase64,
        imageName,
      imageType,
    });

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Ndodhi një gabim gjatë krijimit të postimit.",
    });
  }
}

async function handleAutomationStatus(res) {
  sendJson(res, 200, getAutomationStatusPayload());
}

async function handleAutomationStart(req, res) {
  if (!wpComToken) {
    sendJson(res, 400, { error: "Lidhe panelin me WordPress.com para se të nisësh agjentin." });
    return;
  }

  if (!geminiApiKey) {
    sendJson(res, 400, { error: "Vendos GEMINI_API_KEY para se të nisësh agjentin automatik." });
    return;
  }

  try {
    const rawBody = await collectRequestBody(req);
    const payload = JSON.parse(rawBody || "{}");
    startAutomation(payload);
    sendJson(res, 200, {
      success: true,
      message: `Agjenti u nis për ${getAutomationSummary(automationState)} çdo 30 minuta.`,
      automation: getAutomationStatusPayload(),
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Nisja e agjentit dështoi." });
  }
}

async function handleAutomationStop(res) {
  stopAutomation();
  sendJson(res, 200, {
    success: true,
    message: "Agjenti u ndal.",
    automation: getAutomationStatusPayload(),
  });
}

async function handleAutomationPresetList(res) {
  const presets = loadAutomationPresets().map((preset) => ({
    name: preset.name,
    stepCount: Array.isArray(preset.steps) ? preset.steps.length : 0,
    updatedAt: preset.updatedAt || null,
  }));

  sendJson(res, 200, { presets });
}

async function handleAutomationPresetSave(req, res) {
  try {
    const rawBody = await collectRequestBody(req);
    const payload = JSON.parse(rawBody || "{}");
    const name = String(payload.name || "").trim();
    const steps = normalizeAutomationSteps({ steps: payload.steps });

    if (!name) {
      sendJson(res, 400, { error: "Jep një emër për preset-in." });
      return;
    }

    if (!steps.length) {
      sendJson(res, 400, { error: "Preset-i duhet të ketë të paktën një hap aktiv." });
      return;
    }

    const presets = loadAutomationPresets();
    const nextPreset = {
      name,
      steps,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = presets.findIndex((preset) => preset.name.toLowerCase() === name.toLowerCase());
    if (existingIndex >= 0) {
      presets[existingIndex] = nextPreset;
    } else {
      presets.push(nextPreset);
    }

    saveAutomationPresets(presets);
    sendJson(res, 200, { success: true, preset: nextPreset });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Ruajtja e preset-it dështoi." });
  }
}

async function handleAutomationPresetLoad(req, res) {
  const requestUrl = new URL(req.url || "", `http://localhost:${port}`);
  const name = String(requestUrl.searchParams.get("name") || "").trim();

  if (!name) {
    sendJson(res, 400, { error: "Mungon emri i preset-it." });
    return;
  }

  const presets = loadAutomationPresets();
  const preset = presets.find((entry) => entry.name.toLowerCase() === name.toLowerCase());

  if (!preset) {
    sendJson(res, 404, { error: "Preset-i nuk u gjet." });
    return;
  }

  sendJson(res, 200, { preset });
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (req.method === "GET" && requestPath === "/api/publisher-status") {
    handlePublisherStatus(res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/automation-status") {
    handleAutomationStatus(res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/automation/presets") {
    handleAutomationPresetList(res);
    return;
  }

  if (req.method === "GET" && requestPath === "/api/automation/preset") {
    handleAutomationPresetLoad(req, res);
    return;
  }

  if (req.method === "GET" && requestPath === "/oauth/start") {
    handleOAuthStart(res);
    return;
  }

  if (req.method === "GET" && requestPath === "/oauth/callback") {
    handleOAuthCallback(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/create-post") {
    handleCreatePost(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/automation/start") {
    handleAutomationStart(req, res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/automation/stop") {
    handleAutomationStop(res);
    return;
  }

  if (req.method === "POST" && requestPath === "/api/automation/preset/save") {
    handleAutomationPresetSave(req, res);
    return;
  }

  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(root, safePath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      const fallbackPath = path.join(root, "index.html");
      fs.readFile(fallbackPath, (fallbackError, fallbackContent) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fallbackContent);
      });
      return;
    }

    const type = mimeTypes[path.extname(resolvedPath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
});

restoreAutomationState();
server.listen(port, () => {
  console.log(`PulseMag running at http://localhost:${port}`);
});
