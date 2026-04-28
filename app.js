const { useEffect, useMemo, useState } = React;

const SPORT_SUBCATEGORIES = [
  { label: "Futboll", slug: "futboll" },
  { label: "NBA", slug: "nba" },
  { label: "Tennis", slug: "tennis" },
  { label: "Formula 1", slug: "formula-1" },
  { label: "Te tjera", slug: "te-tjera" }
];

const TECHNOLOGY_SUBCATEGORIES = [
  { label: "AI", slug: "ai" },
  { label: "Smartphones", slug: "smartphones" },
  { label: "IT Universe", slug: "it-universe" },
  { label: "Apps & Software", slug: "apps-software" },
  { label: "Gaming", slug: "gaming" },
  { label: "Te ndryshme", slug: "te-ndryshme" }
];

const LIFESTYLE_SUBCATEGORIES = [
  { label: "Moda", slug: "moda-lifestyle" },
  { label: "Shendet", slug: "shendet" },
  { label: "Udhetime", slug: "udhetime" },
  { label: "Marredhenie", slug: "marredhenie" },
  { label: "Horoskop", slug: "horoskop-lifestyle" }
];

const CULTURE_SUBCATEGORIES = [
  { label: "Libra", slug: "libra" },
  { label: "Art", slug: "art" },
  { label: "Teater", slug: "teater" },
  { label: "Evente", slug: "evente" }
];

const ENTERTAINMENT_SUBCATEGORIES = [
  { label: "Kinema", slug: "kinema-argetim" },
  { label: "TV & Showbiz", slug: "tv-showbiz" },
  { label: "Celebrities", slug: "celebrities" },
  { label: "Influencers", slug: "influencers" },
  { label: "Muzike", slug: "muzike" }
];

const LEGACY_CATEGORY_ROUTE_MAP = {
  moda: "lifestyle",
  horoskop: "lifestyle",
  kinema: "argetim",
  "celebrities-influencers": "argetim"
};

const CATEGORY_FETCH_SLUGS = {
  sport: ["sport"],
  teknologji: ["teknologji"],
  lifestyle: ["lifestyle", "moda", "horoskop"],
  kulture: ["kulture"],
  argetim: ["argetim", "kinema", "celebrities-influencers"]
};

const SUBCATEGORY_SLUG_ALIASES = {
  "moda-lifestyle": ["moda-lifestyle", "moda"],
  "horoskop-lifestyle": ["horoskop-lifestyle", "horoskop"],
  "kinema-argetim": ["kinema-argetim", "kinema"],
  celebrities: ["celebrities", "celebrities-influencers"],
  influencers: ["influencers", "celebrities-influencers"]
};

function normalizeCategoryKey(value = "") {
  return LEGACY_CATEGORY_ROUTE_MAP[value] || value;
}

function getCategoryFetchSlugs(categoryKey = "") {
  const normalized = normalizeCategoryKey(categoryKey);
  return CATEGORY_FETCH_SLUGS[normalized] || [normalized];
}

function getSubcategoryMatchSlugs(slug = "") {
  return SUBCATEGORY_SLUG_ALIASES[slug] || [slug];
}

function matchesSubcategoryEntry(entry, subcategory) {
  if (!entry || !subcategory) {
    return false;
  }

  const acceptedSlugs = getSubcategoryMatchSlugs(subcategory.slug).map((value) => slugify(value));
  const entrySlug = slugify(entry.slug || "");
  const entryName = slugify(entry.name || "");
  const subcategoryLabel = slugify(subcategory.label || "");

  return (
    acceptedSlugs.includes(entrySlug) ||
    acceptedSlugs.includes(entryName) ||
    entrySlug === subcategoryLabel ||
    entryName === subcategoryLabel
  );
}

function matchesCategoryEntry(entry, category) {
  if (!entry || !category) {
    return false;
  }

  const entrySlug = slugify(entry.slug || "");
  const entryName = slugify(entry.name || "");
  const categorySlug = slugify(category.slug || "");
  const categoryName = slugify(category.name || "");
  const categoryKey = slugify(category.key || "");

  return (
    entrySlug === categorySlug ||
    entrySlug === categoryName ||
    entrySlug === categoryKey ||
    entryName === categorySlug ||
    entryName === categoryName ||
    entryName === categoryKey
  );
}

const TRANSLATION_OPTIONS = [
  { label: "English", code: "en" },
  { label: "Italiano", code: "it" },
  { label: "Deutsch", code: "de" },
  { label: "Français", code: "fr" },
  { label: "Español", code: "es" }
];

const CATEGORY_CONFIG = [
  {
    key: "sport",
    name: "Sport",
    slug: "sport",
    description: "Rezultate, analiza ndeshjesh dhe histori që mbajnë ritmin e ditës.",
    accent: "#ff6b57",
    subcategories: SPORT_SUBCATEGORIES
  },
  {
    key: "teknologji",
    name: "Teknologji",
    slug: "teknologji",
    description: "Pajisje, AI dhe inovacione që po formësojnë botën.",
    accent: "#4f9cf9",
    subcategories: TECHNOLOGY_SUBCATEGORIES
  },
  {
    key: "lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    description: "Mirëqenie, udhëtime dhe rituale që i japin ritëm ditës.",
    accent: "#22c55e",
    subcategories: LIFESTYLE_SUBCATEGORIES
  },
  {
    key: "kulture",
    name: "Kulture",
    slug: "kulture",
    description: "Art, libra dhe ngjarje që lëvizin skenën kulturore.",
    accent: "#f59e0b",
    subcategories: CULTURE_SUBCATEGORIES
  },
  {
      key: "argetim",
      name: "Argetim",
      slug: "argetim",
      description: "Showbiz, muzikë dhe ritmi i ekranit në një vend të vetëm.",
      accent: "#6366f1",
      subcategories: ENTERTAINMENT_SUBCATEGORIES
  }
];

const FALLBACK_POSTS = {
  sport: [
    {
      id: 1001,
      title: "Finalja që po ndez javën sportive",
      excerpt: "Skuadrat vijnë me ritëm të lartë, formacione të guximshme dhe pritshmëri rekord nga tifozët.",
      contentHtml: "<p>Një javë sportive që mbyllet me ritëm të lartë dhe pritshmëri të mëdha nga tifozët anembanë vendit.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T10:00:00",
      image: "",
      categoryLabel: "Sport",
      link: "#"
    },
    {
      id: 1002,
      title: "Talentët e rinj që po ndryshojnë kampionatin",
      excerpt: "Tre emra të rinj po fitojnë minuta të rëndësishme dhe vëmendjen e mediave sportive.",
      contentHtml: "<p>Të rinjtë po marrin rol kryesor në javët e fundit të kampionatit dhe po sjellin energji të re.</p>",
      date: "March 23, 2026",
      rawDate: "2026-03-23T09:00:00",
      image: "",
      categoryLabel: "Sport",
      link: "#"
    }
  ],
  teknologji: [
    {
      id: 2001,
      title: "Lancohet Xiaomi i ri",
      excerpt: "Një model i ri smartfoni premton bateri më të fortë, kamera më të mira dhe AI të integruar.",
      contentHtml: "<p>Prodhuesi prezantoi modelin e ri me fokus te performanca dhe fotografia e natës.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T12:00:00",
      image: "",
      categoryLabel: "Teknologji",
      link: "#"
    }
  ],
  moda: [
    {
      id: 3001,
      title: "Siluetat që po rikthehen këtë sezon",
      excerpt: "Miksimi i prerjeve klasike me tone të forta po dominon koleksionet e reja.",
      contentHtml: "<p>Stilistët po rikthejnë volume të njohura me interpretime më bashkëkohore.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T14:00:00",
      image: "",
      categoryLabel: "Moda",
      link: "#"
    }
  ],
  lifestyle: [
    {
      id: 4001,
      title: "Ritualet e mëngjesit që rrisin fokusin",
      excerpt: "Një fillim i qetë i ditës ndikon drejtpërdrejt në energjinë dhe produktivitetin personal.",
      contentHtml: "<p>Ritualet e mëngjesit po kthehen në një nga temat më të diskutuara të mirëqenies.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T15:00:00",
      image: "",
      categoryLabel: "Lifestyle",
      link: "#"
    }
  ],
  horoskop: [
    {
      id: 5001,
      title: "Parashikimi i ditës për shenjat më dinamike",
      excerpt: "Energjia favorizon vendimet e shpejta, por kërkon kujdes në komunikim dhe financa.",
      contentHtml: "<p>Dita sjell lëvizje të shumta dhe energji të favorshme për disa shenja.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T08:30:00",
      image: "",
      categoryLabel: "Horoskop",
      link: "#"
    }
  ],
  kulture: [
    {
      id: 6001,
      title: "Ekspozita që po rikthen vëmendjen te arti urban",
      excerpt: "Një seri punimesh të reja sjellin zëra të rinj dhe tema bashkëkohore në qendër të skenës.",
      contentHtml: "<p>Arti urban po fiton një publik më të gjerë përmes ekspozitave me qasje të re vizuale.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T11:00:00",
      image: "",
      categoryLabel: "Kulture",
      link: "#"
    }
  ],
  argetim: [
    {
      id: 6501,
      title: "Showbiz-i i javÃ«s sjell bashkÃ«punime dhe premiera tÃ« reja",
      excerpt: "Nga muzika te ekranet, emrat mÃ« tÃ« ndjekur po rikthehen me projekte qÃ« po marrin vÃ«mendje tÃ« madhe.",
      contentHtml: "<p>Bota e argÃ«timit hyn nÃ« njÃ« javÃ« tÃ« re me premiera, bashkÃ«punime dhe lajme qÃ« mbajnÃ« publikun aktiv.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T13:00:00",
      image: "",
      categoryLabel: "Argetim",
      link: "#"
    }
  ],
  kinema: [
    {
      id: 7001,
      title: "Filmat më të pritur të sezonit të ardhshëm",
      excerpt: "Studios po përgatisin premiera të mëdha me emra të njohur dhe histori me bujë.",
      contentHtml: "<p>Sezoni i ardhshëm i kinemasë premton premierë pas premiere me emra të mëdhenj.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T18:00:00",
      image: "",
      categoryLabel: "Kinema",
      link: "#"
    }
  ],
  "celebrities-influencers": [
    {
      id: 8001,
      title: "Fytyrat që po dominojnë rrjetet këtë javë",
      excerpt: "Nga bashkëpunime të reja te prapaskena eventesh, influencerat po mbajnë fokusin te vetja.",
      contentHtml: "<p>Rrjetet sociale po mbushen me lajme nga celebrity dhe influencer të njohur.</p>",
      date: "March 24, 2026",
      rawDate: "2026-03-24T16:00:00",
      image: "",
      categoryLabel: "Celebrities&Influencers",
      link: "#"
    }
  ]
};

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value = "") {
  const input = String(value || "");
  if (!input || !/[&][#a-zA-Z0-9]+;/.test(input)) {
    return input;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

function sanitizeText(value = "") {
  return decodeHtmlEntities(stripHtml(String(value || "")));
}

function isWordPressComApi(base) {
  return /public-api\.wordpress\.com/.test(base);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseRoute() {
  const params = new URLSearchParams(window.location.search);
  return {
    articleId: params.get("article"),
    category: params.get("category"),
    subcategory: params.get("subcategory")
  };
}

function getInternalArticleUrl(post, categoryKey, subcategorySlug) {
  const params = new URLSearchParams();
  params.set("article", String(post.id));
  if (categoryKey) {
    params.set("category", categoryKey);
  }
  if (subcategorySlug) {
    params.set("subcategory", subcategorySlug);
  }
  return `${window.location.pathname}?${params.toString()}`;
}

function getCategoryConfigBySlug(slug) {
  const normalized = normalizeCategoryKey(slug);
  return CATEGORY_CONFIG.find((item) => item.slug === normalized || item.key === normalized);
}

function getCategoryConfigByKey(key) {
  const normalized = normalizeCategoryKey(key);
  return CATEGORY_CONFIG.find((item) => item.key === normalized);
}

function buildCategoryMeta(post, categoryConfig) {
  const categories = post.categories || [];
  const subcategory =
    categories.find((entry) => categoryConfig?.subcategories?.some((sub) => matchesSubcategoryEntry(entry, sub))) ||
    null;
  const fallbackChildCategory =
    categories.find((entry) => Number(entry.parent || 0) > 0) ||
    categories.find((entry) => slugify(entry.slug || "") !== slugify(categoryConfig?.slug || "")) ||
    null;

  return {
    categoryLabel:
      subcategory?.name ||
      fallbackChildCategory?.name ||
      categoryConfig?.name ||
      post.categoryLabel ||
      "PulseMag",
    subcategorySlug: subcategory?.slug || fallbackChildCategory?.slug || ""
  };
}

function getPrimaryCategoryForPost(post) {
  const categories = post.categories || [];

  return (
    CATEGORY_CONFIG.find((category) =>
      categories.some(
        (entry) =>
          matchesCategoryEntry(entry, category) ||
          category.subcategories?.some((subcategory) => matchesSubcategoryEntry(entry, subcategory))
      )
    ) || CATEGORY_CONFIG[0]
  );
}

function normalizeWordPressComPost(post) {
  const categories = Object.entries(post.categories || {}).map(([label, category]) => ({
    slug: category?.slug || label,
    name: decodeHtmlEntities(category?.name || label),
    parent: category?.parent || 0,
    id: category?.ID || null
  }));

  return {
    id: post.ID,
    title: sanitizeText(post.title),
    slug: post.slug,
    excerpt: sanitizeText(post.excerpt || post.content || ""),
    contentHtml: post.content || "",
    date: formatDate(post.date),
    rawDate: post.date,
    image: post.featured_image || "",
    categories,
    originalLink: post.URL
  };
}

function normalizeWpV2Post(post) {
  const embeddedImage =
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    post.jetpack_featured_media_url ||
    "";

  return {
    id: post.id,
    title: sanitizeText(post.title?.rendered || ""),
    slug: post.slug,
    excerpt: sanitizeText(post.excerpt?.rendered || post.content?.rendered || ""),
    contentHtml: post.content?.rendered || "",
    date: formatDate(post.date),
    rawDate: post.date,
    image: embeddedImage,
    categories: (post._embedded?.["wp:term"] || [])
      .flat()
      .filter((term) => term.taxonomy === "category")
      .map((term) => ({ slug: term.slug, name: decodeHtmlEntities(term.name) })),
    originalLink: post.link
  };
}

async function fetchCategoryPosts(categoryConfig) {
  const base = window.WORDPRESS_API_BASE;
  const categorySlugs = getCategoryFetchSlugs(categoryConfig.key);

  if (isWordPressComApi(base)) {
    const responses = await Promise.all(
      categorySlugs.map((slug) =>
        fetch(`${base}/posts/?number=12&category=${encodeURIComponent(slug)}`)
      )
    );
    const payloads = await Promise.all(responses.map((response) => response.json()));
    const seen = new Map();

    payloads
      .flatMap((payload) => payload.posts || [])
      .map(normalizeWordPressComPost)
      .forEach((post) => {
        seen.set(post.id, post);
      });

    return Array.from(seen.values());
  }

  const responses = await Promise.all(
    categorySlugs.map((slug) =>
      fetch(`${base}/posts?per_page=12&_embed&categories_slug=${encodeURIComponent(slug)}`)
    )
  );
  const payloads = await Promise.all(responses.map((response) => response.json()));
  const seen = new Map();

  payloads
    .flatMap((posts) => (Array.isArray(posts) ? posts : []))
    .map(normalizeWpV2Post)
    .forEach((post) => {
      seen.set(post.id, post);
    });

  return Array.from(seen.values());
}

async function fetchSinglePostById(postId) {
  const base = window.WORDPRESS_API_BASE;

  if (isWordPressComApi(base)) {
    const response = await fetch(`${base}/posts/${postId}`);
    const post = await response.json();
    if (post && !post.error) {
      return normalizeWordPressComPost(post);
    }
    throw new Error("Postimi nuk u gjet.");
  }

  const response = await fetch(`${base}/posts/${postId}?_embed`);
  const post = await response.json();
  if (post && !post.code) {
    return normalizeWpV2Post(post);
  }
  throw new Error("Postimi nuk u gjet.");
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("https://formspree.io/f/xdapnbzz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error("Abonimi nuk u dërgua.");
      }

      setStatus({
        type: "success",
        message: "U abonove me sukses. Kontrollo edhe email-in për konfirmim."
      });
      setEmail("");
    } catch (error) {
      setStatus({
        type: "error",
        message: "Ndodhi një problem gjatë abonimit. Provo përsëri."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email-i yt"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? "Duke dërguar..." : "Abonohu"}
      </button>
      {status.message ? (
        <p className={`newsletter-message ${status.type}`}>{status.message}</p>
      ) : null}
    </form>
  );
}

function CopyLinkButton({ url }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`copy-link-button ${copied ? "copied" : ""}`}
      onClick={handleCopy}
    >
      {copied ? "Linku u kopjua" : "Copy Link"}
    </button>
  );
}

function App() {
  const [activeCategoryKey, setActiveCategoryKey] = useState("sport");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [categoryPosts, setCategoryPosts] = useState(() => {
    const seed = {};
    CATEGORY_CONFIG.forEach((category) => {
      seed[category.key] = (FALLBACK_POSTS[category.key] || []).map((post) => ({
        ...post,
        originalLink: post.originalLink || post.link
      }));
    });
    return seed;
  });
  const [loadingState, setLoadingState] = useState({});
  const [route, setRoute] = useState(parseRoute());
  const [articleDetail, setArticleDetail] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  useEffect(() => {
    CATEGORY_CONFIG.forEach((category) => {
      setLoadingState((current) => ({ ...current, [category.key]: true }));
      fetchCategoryPosts(category)
        .then((posts) => {
          if (posts.length) {
            setCategoryPosts((current) => ({ ...current, [category.key]: posts }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingState((current) => ({ ...current, [category.key]: false }));
        });
    });
  }, []);

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRoute());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const translateRootId = "google_translate_element";
    const scriptId = "google-translate-script";
    const rootExists = document.getElementById(translateRootId);

    if (!rootExists) {
      return undefined;
    }

    window.googleTranslateElementInit = function googleTranslateElementInit() {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }

      if (rootExists.dataset.initialized === "true") {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "sq",
          includedLanguages: TRANSLATION_OPTIONS.map((option) => option.code).join(","),
          autoDisplay: false
        },
        translateRootId
      );

      rootExists.dataset.initialized = "true";
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return undefined;
    }

    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!route.articleId) {
      setArticleDetail(null);
      setArticleLoading(false);
      setArticleError("");
      return;
    }

    const existingPost = Object.values(categoryPosts)
      .flat()
      .find((post) => String(post.id) === String(route.articleId));

    if (existingPost) {
      setArticleDetail(existingPost);
      setArticleError("");
      setArticleLoading(false);
      return;
    }

    setArticleLoading(true);
    setArticleError("");

    fetchSinglePostById(route.articleId)
      .then((post) => {
        setArticleDetail(post);
      })
      .catch(() => {
        setArticleError("Artikulli nuk u gjet ose nuk mund të ngarkohet për momentin.");
      })
      .finally(() => {
        setArticleLoading(false);
      });
  }, [route.articleId, categoryPosts]);

  function handleTranslate(code) {
      const select = document.querySelector(".goog-te-combo");
      if (!select) {
        return;
      }

    select.value = code;
      select.dispatchEvent(new Event("change"));
    }

    function setGoogleTranslateCookie(value, expires = "") {
      const hostname = window.location.hostname;
      const domainParts = hostname.split(".");
      const rootDomain =
        domainParts.length >= 2 ? `.${domainParts.slice(-2).join(".")}` : "";

      const cookieTargets = [
        `googtrans=${value}; path=/; ${expires}`.trim(),
        `googtrans=${value}; path=/; domain=${hostname}; ${expires}`.trim(),
        rootDomain
          ? `googtrans=${value}; path=/; domain=${rootDomain}; ${expires}`.trim()
          : ""
      ].filter(Boolean);

      cookieTargets.forEach((cookieValue) => {
        document.cookie = cookieValue;
      });
    }

    function clearGoogleTranslateCookie() {
      const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      setGoogleTranslateCookie("", expired);
    }

    function handleOriginalLanguage() {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = "";
        select.dispatchEvent(new Event("change"));
      }

      clearGoogleTranslateCookie();
      window.localStorage.removeItem("googtrans");
      window.sessionStorage.removeItem("googtrans");
      window.location.assign(
        `${window.location.origin}${window.location.pathname}${window.location.search}`
      );
    }

  function openArticle(post, categoryKey, subcategorySlug = "") {
    const nextUrl = getInternalArticleUrl(post, categoryKey, subcategorySlug);
    window.history.pushState({}, "", nextUrl);
    setRoute(parseRoute());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    window.history.pushState({}, "", window.location.pathname);
    setRoute(parseRoute());
    setArticleDetail(null);
    setArticleError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeCategory = getCategoryConfigByKey(activeCategoryKey) || CATEGORY_CONFIG[0];
  const allPostsForActiveCategory = categoryPosts[activeCategory.key] || [];

  const visiblePosts = useMemo(() => {
    if (!activeSubcategory) {
      return allPostsForActiveCategory;
    }

    const allowedSlugs = getSubcategoryMatchSlugs(activeSubcategory).map((value) => slugify(value));

    return allPostsForActiveCategory.filter((post) =>
      (post.categories || []).some((entry) =>
        allowedSlugs.includes(slugify(entry.slug || ""))
      )
    );
  }, [activeSubcategory, allPostsForActiveCategory]);

  const latestHeroPosts = useMemo(() => {
    const seenPosts = new Set();

    return Object.values(categoryPosts)
      .flat()
      .filter((post) => {
        if (!post || seenPosts.has(post.id)) {
          return false;
        }
        seenPosts.add(post.id);
        return true;
      })
      .sort(
        (leftPost, rightPost) =>
          new Date(rightPost.rawDate || 0).getTime() -
          new Date(leftPost.rawDate || 0).getTime()
      )
      .slice(0, 10);
  }, [categoryPosts]);

  const activeHeroPost = latestHeroPosts[activeHeroIndex] || null;
  const activeHeroCategory = activeHeroPost
    ? getPrimaryCategoryForPost(activeHeroPost)
    : CATEGORY_CONFIG[0];
  const activeHeroMeta = activeHeroPost
    ? buildCategoryMeta(activeHeroPost, activeHeroCategory)
    : { categoryLabel: "", subcategorySlug: "" };

  const editorialPosts = useMemo(() => {
    return CATEGORY_CONFIG.map((category) => {
      const post = (categoryPosts[category.key] || [])[0];
      if (!post) {
        return null;
      }
      return { category, post };
    }).filter(Boolean);
  }, [categoryPosts]);

  useEffect(() => {
    if (!latestHeroPosts.length) {
      setActiveHeroIndex(0);
      return;
    }

    if (activeHeroIndex >= latestHeroPosts.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, latestHeroPosts.length]);

  useEffect(() => {
    if (route.articleId || latestHeroPosts.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % latestHeroPosts.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [latestHeroPosts.length, route.articleId]);

  const articleCategory = useMemo(() => {
    if (!route.category) {
      return CATEGORY_CONFIG[0];
    }
    return getCategoryConfigByKey(route.category) || CATEGORY_CONFIG[0];
  }, [route.category]);

  const articleMeta = articleDetail
    ? buildCategoryMeta(articleDetail, articleCategory)
    : { categoryLabel: "", subcategorySlug: "" };

  const articleCopyUrl =
    articleDetail && typeof window !== "undefined"
      ? `${window.location.origin}${getInternalArticleUrl(
          articleDetail,
          articleCategory.key,
          route.subcategory || articleMeta.subcategorySlug
        )}`
      : window.location.href;

  if (route.articleId) {
    return (
      <div className="site-shell">
        <header className="topbar">
          <div className="translate-menu">
            <button type="button" className="translate-trigger">
              Translate
            </button>
            <div className="translate-dropdown">
              {TRANSLATION_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className="translate-option"
                  onClick={() => handleTranslate(option.code)}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className="translate-option original-language"
                onClick={handleOriginalLanguage}
              >
                Original language
              </button>
            </div>
          </div>
          <div className="brand-cover" />
          <div id="google_translate_element" className="translate-root" />
        </header>

        <main className="layout">
          <section className="article-shell">
            <button type="button" className="article-back-link" onClick={goHome}>
              Kthehu te faqja kryesore
            </button>

            {articleLoading ? (
              <div className="category-detail">
                <div className="skeleton-card">
                  <div className="skeleton-block skeleton-image" />
                  <div className="skeleton-block skeleton-title" />
                  <div className="skeleton-block skeleton-text" />
                </div>
              </div>
            ) : null}

            {!articleLoading && articleError ? (
              <div className="category-detail">
                <div className="category-intro">
                  <h3>Artikulli nuk u gjet</h3>
                  <p>{articleError}</p>
                </div>
              </div>
            ) : null}

            {!articleLoading && articleDetail ? (
              <article className="article-detail">
                {articleDetail.image ? (
                  <img
                    className="article-cover"
                    src={articleDetail.image}
                    alt={articleDetail.title}
                  />
                ) : null}

                <div className="article-header-card">
                  <p className="section-label">{articleMeta.categoryLabel}</p>
                  <h1>{articleDetail.title}</h1>
                  <div className="article-meta">
                    <span>{articleDetail.date}</span>
                    {articleCategory?.name ? <span>{articleCategory.name}</span> : null}
                  </div>
                  {articleDetail.excerpt ? <p className="article-excerpt">{articleDetail.excerpt}</p> : null}
                  <div className="post-actions">
                    <CopyLinkButton url={articleCopyUrl} />
                    {articleDetail.originalLink ? (
                      <a
                        href={articleDetail.originalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="spotlight-link"
                      >
                        Hape ne WordPress
                      </a>
                    ) : null}
                  </div>
                </div>

                <div
                  className="article-content category-detail"
                  dangerouslySetInnerHTML={{ __html: articleDetail.contentHtml }}
                />
              </article>
            ) : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="translate-menu">
          <button type="button" className="translate-trigger">
            Translate
          </button>
          <div className="translate-dropdown">
            {TRANSLATION_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className="translate-option"
                onClick={() => handleTranslate(option.code)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className="translate-option original-language"
              onClick={handleOriginalLanguage}
            >
              Original language
            </button>
          </div>
        </div>
        <div className="brand-cover" />
        <div id="google_translate_element" className="translate-root" />
      </header>

      <main className="layout">
        <section className="hero-panel hero-slider-panel">
          <div className="hero-slider-shell">
            {activeHeroPost ? (
              <>
                <a
                  href={getInternalArticleUrl(
                    activeHeroPost,
                    activeHeroCategory.key,
                    activeHeroMeta.subcategorySlug
                  )}
                  className="hero-slide-link"
                  onClick={(event) => {
                    event.preventDefault();
                    openArticle(
                      activeHeroPost,
                      activeHeroCategory.key,
                      activeHeroMeta.subcategorySlug
                    );
                  }}
                >
                  <div
                    className="hero-slide-image"
                    style={
                      activeHeroPost.image
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(7, 10, 15, 0.18), rgba(7, 10, 15, 0.82)), url(${activeHeroPost.image})`,
                          }
                        : undefined
                    }
                  />

                  <div className="hero-slide-content">
                    <p className="section-label">Portali i dites</p>
                    <div className="hero-slide-meta">
                      <span>{activeHeroMeta.categoryLabel || activeHeroCategory.name}</span>
                      <span>{activeHeroPost.date}</span>
                    </div>
                    <h2>{activeHeroPost.title}</h2>
                    <p className="hero-slide-excerpt">{activeHeroPost.excerpt}</p>
                  </div>
                </a>

                <div className="hero-slider-toolbar">
                  <div className="hero-slider-dots" aria-label="Hero slides">
                    {latestHeroPosts.map((post, index) => (
                      <button
                        key={post.id}
                        type="button"
                        className={`hero-dot ${index === activeHeroIndex ? "active" : ""}`}
                        aria-label={`Shfaq slide ${index + 1}`}
                        onClick={() => setActiveHeroIndex(index)}
                      />
                    ))}
                  </div>

                  <div className="hero-slider-nav">
                    <button
                      type="button"
                      className="hero-nav-button"
                      aria-label="Postimi i meparshem"
                      onClick={() =>
                        setActiveHeroIndex((currentIndex) =>
                          currentIndex === 0 ? latestHeroPosts.length - 1 : currentIndex - 1
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="hero-nav-button"
                      aria-label="Postimi i radhes"
                      onClick={() =>
                        setActiveHeroIndex((currentIndex) => (currentIndex + 1) % latestHeroPosts.length)
                      }
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hero-empty-state">
                <p className="section-label">Portali i dites</p>
                <h2>Po ngarkohen 10 postimet e fundit.</h2>
              </div>
            )}
          </div>

          <aside className="hero-latest-panel">
            <div className="hero-latest-header">
              <p className="section-label">Headlines</p>
              <h3>10 postimet e fundit</h3>
            </div>

            <div className="hero-latest-list">
              {latestHeroPosts.map((post, index) => {
                const postCategory = getPrimaryCategoryForPost(post);
                const postMeta = buildCategoryMeta(post, postCategory);

                return (
                  <a
                    key={post.id}
                    href={getInternalArticleUrl(post, postCategory.key, postMeta.subcategorySlug)}
                    className={`hero-latest-item ${index === activeHeroIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveHeroIndex(index)}
                    onClick={(event) => {
                      event.preventDefault();
                      openArticle(post, postCategory.key, postMeta.subcategorySlug);
                    }}
                  >
                    <div
                      className="hero-latest-thumb"
                      style={post.image ? { backgroundImage: `url(${post.image})` } : undefined}
                    />
                    <div className="hero-latest-copy">
                      <span>{postMeta.categoryLabel || postCategory.name}</span>
                      <h4>{post.title}</h4>
                      <p>{post.date}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </aside>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <p className="section-label">Kategoritë</p>
              <h2>Zgjidh ritmin që dëshiron të ndjekësh</h2>
            </div>
          </div>

          <div className="category-tabs">
            {CATEGORY_CONFIG.map((category) => (
              <div
                key={category.key}
                className={`category-tab-wrap ${category.subcategories ? "has-submenu" : ""}`}
              >
                <button
                  type="button"
                  className={`category-tab ${activeCategoryKey === category.key ? "active" : ""}`}
                  style={activeCategoryKey === category.key ? { "--accent": category.accent } : {}}
                  onClick={() => {
                    setActiveCategoryKey(category.key);
                    setActiveSubcategory("");
                  }}
                >
                  {category.name}
                </button>

                {category.subcategories ? (
                  <div className="category-submenu">
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.slug}
                        type="button"
                        className={`category-submenu-item ${
                          activeCategoryKey === category.key && activeSubcategory === subcategory.slug
                            ? "active"
                            : ""
                        }`}
                        onClick={() => {
                          setActiveCategoryKey(category.key);
                          setActiveSubcategory(subcategory.slug);
                        }}
                      >
                        {subcategory.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="category-detail">
            <div className="category-intro">
              <h3>{activeCategory.name}</h3>
              <p>{activeCategory.description}</p>
            </div>

            <div className="post-grid">
              {loadingState[activeCategory.key] && !visiblePosts.length
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="post-card skeleton-card">
                      <div className="skeleton-block skeleton-image" />
                      <div className="skeleton-block skeleton-title" />
                      <div className="skeleton-block skeleton-text" />
                    </div>
                  ))
                : visiblePosts.map((post) => {
                    const meta = buildCategoryMeta(post, activeCategory);
                    const articleUrl = getInternalArticleUrl(post, activeCategory.key, meta.subcategorySlug);
                    const imageStyle = post.image
                      ? { backgroundImage: `linear-gradient(rgba(11,17,27,0.1), rgba(11,17,27,0.28)), url('${post.image}')` }
                      : { background: "linear-gradient(135deg, #f87171 0%, #1f2937 100%)" };

                    return (
                      <article key={post.id} className="post-card">
                        <a
                          href={articleUrl}
                          className="post-visual-link"
                          onClick={(event) => {
                            event.preventDefault();
                            openArticle(post, activeCategory.key, meta.subcategorySlug);
                          }}
                        >
                          <div className="post-visual" style={imageStyle}>
                            <span>{meta.categoryLabel}</span>
                          </div>
                        </a>
                        <div className="post-body">
                          <p className="post-date">{post.date}</p>
                          <h4>
                            <a
                              href={articleUrl}
                              className="post-title-link"
                              onClick={(event) => {
                                event.preventDefault();
                                openArticle(post, activeCategory.key, meta.subcategorySlug);
                              }}
                            >
                              {post.title}
                            </a>
                          </h4>
                          <p>{post.excerpt}</p>
                          <div className="post-actions">
                            <CopyLinkButton url={`${window.location.origin}${articleUrl}`} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
            </div>
          </div>
        </section>

        <section>
          <div className="section-heading">
            <div>
              <p className="section-label">Editorial</p>
              <h2>Pikat që po ndezin ritmin e javës</h2>
            </div>
          </div>
          <div className="editorial-list">
            {editorialPosts.map(({ category, post }) => (
              <article key={category.key} className="editorial-item">
                <span className="editorial-tag" style={{ background: category.accent }}>
                  {category.name}
                </span>
                <strong>
                  <a
                    href={getInternalArticleUrl(post, category.key)}
                    onClick={(event) => {
                      event.preventDefault();
                      openArticle(post, category.key);
                    }}
                  >
                    {post.title}
                  </a>
                </strong>
                <p>{post.excerpt}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="newsletter-panel">
          <div className="newsletter-copy">
            <p className="section-label">Audience</p>
            <a
              className="newsletter-social-link"
              href="https://www.facebook.com/profile.php?id=61576796372985"
              target="_blank"
              rel="noreferrer"
            >
              Follow on Facebook
            </a>
            <h2>Një seksion gati për newsletter, reklama ose njoftime editoriale</h2>
          </div>
          <NewsletterForm />
        </section>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
