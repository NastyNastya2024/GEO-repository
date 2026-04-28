// Мобильное меню (без анимаций пролистывания)
document.addEventListener("DOMContentLoaded", () => {
  // Ring particles (Houdini): только после успешной загрузки worklet — иначе @supports/paint даёт пустой фон
  if ("paintWorklet" in CSS) {
    CSS.paintWorklet
      .addModule("https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js")
      .then(() => {
        /* На телефонах только CSS‑fallback: без ожидания сети и сразу видимая сетка */
        if (window.matchMedia("(max-width: 768px)").matches) return;
        document.documentElement.classList.add("houdini-ringparticles");
      })
      .catch(() => {});
  }

  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");

  // Slow down hero background video (index)
  const heroVideo = document.querySelector(".hero-bg-video");
  if (heroVideo instanceof HTMLVideoElement) {
    const forwardRate = 0.5;
    const forwardSeconds = 3;
    const rewindRate = 1.0; // seconds of video per second of real time

    let rafId = 0;
    let lastTs = 0;

    const stopRaf = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lastTs = 0;
    };

    const rewindToStart = () => {
      stopRaf();
      heroVideo.pause();

      const step = ts => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.06, (ts - lastTs) / 1000);
        lastTs = ts;

        const next = Math.max(0, heroVideo.currentTime - dt * rewindRate);
        heroVideo.currentTime = next;

        if (next <= 0.001) {
          stopRaf();
          playForwardWindow();
          return;
        }
        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
    };

    const onTimeUpdate = () => {
      // Stop right at forwardSeconds, then rewind back to start
      if (heroVideo.currentTime >= forwardSeconds - 0.02) {
        heroVideo.removeEventListener("timeupdate", onTimeUpdate);
        rewindToStart();
      }
    };

    const playForwardWindow = () => {
      stopRaf();
      heroVideo.playbackRate = forwardRate;
      if (heroVideo.currentTime > forwardSeconds) heroVideo.currentTime = 0;
      heroVideo.addEventListener("timeupdate", onTimeUpdate);
      heroVideo.play().catch(() => {});
    };

    const startLoop = () => {
      // Ensure metadata available for currentTime / duration
      heroVideo.currentTime = 0;
      playForwardWindow();
    };

    if (heroVideo.readyState >= 1) startLoop();
    else heroVideo.addEventListener("loadedmetadata", startLoop, { once: true });
  }

  // Hide header ticker on scroll (keep logo + burger)
  const updateHeaderTicker = () => {
    const shouldHide = window.scrollY > 40;
    document.body.classList.toggle("hide-header-ticker", shouldHide);
  };
  updateHeaderTicker();
  window.addEventListener("scroll", updateHeaderTicker, { passive: true });

  // Services slider (blog-slider layout)
  const servicesSliderEl = document.querySelector(".services-blog-slider");
  if (servicesSliderEl && typeof window.Swiper === "function") {
    const servicesReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    new window.Swiper(servicesSliderEl, {
      spaceBetween: 30,
      effect: "slide",
      loop: true,
      keyboard: true,
      mousewheel: false,
      autoHeight: true,
      navigation: {
        prevEl: ".services-blog-slider .swiper-button-prev",
        nextEl: ".services-blog-slider .swiper-button-next"
      },
      autoplay: servicesReduceMotion
        ? false
        : {
            delay: 5200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
    });
  }

  // Footer sitemap (same on all pages)
  const scriptEl = document.querySelector('script[src$="script.js"]');
  const prefix = scriptEl
    ? (scriptEl.getAttribute("src") || "").replace(/script\.js(\?.*)?$/, "")
    : "";

  const isEnglish = () => {
    try {
      const parts = String(window.location.pathname || "/")
        .split("/")
        .filter(Boolean);
      if (!parts.length) return false;
      const isGithubProject = String(window.location.hostname || "").endsWith("github.io") && parts.length >= 2;
      return isGithubProject ? parts[1] === "en" : parts[0] === "en";
    } catch {
      return false;
    }
  };

  const LANG = isEnglish() ? "en" : "ru";
  const DEFAULT_FORM_ENDPOINT = "https://formspree.io/f/mqeworkz";

  // Absolute base for internal links (GitHub Pages project vs custom domain)
  const basePath = (() => {
    try {
      const isGithub = String(window.location.hostname || "").endsWith("github.io");
      if (!isGithub) return "/";
      const parts = String(window.location.pathname || "/").split("/").filter(Boolean);
      if (!parts.length) return "/";
      const repo = parts[0] === "en" ? parts[1] : parts[0];
      return repo ? `/${repo}/` : "/";
    } catch {
      return "/";
    }
  })();

  const pageBase = `${basePath}${LANG === "en" ? "en/" : ""}`;

  const toEnglishUrl = href => {
    try {
      const u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return null;
      const parts = String(u.pathname || "/").split("/").filter(Boolean);
      const isGithub = String(window.location.hostname || "").endsWith("github.io");

      if (!isGithub) {
        if (parts[0] === "en") return u.toString();
        u.pathname = "/" + ["en", ...parts].join("/");
        return u.toString();
      }

      if (!parts.length) return null;
      // Normalize both layouts:
      // - correct: /<repo>/en/...
      // - wrong:   /en/<repo>/...
      if (parts[0] === "en" && parts.length >= 2) {
        const repo = parts[1];
        const rest = parts.slice(2);
        u.pathname = "/" + [repo, "en", ...rest].join("/");
        return u.toString();
      }

      const repo = parts[0];
      if (parts[1] === "en") return u.toString();
      u.pathname = "/" + [repo, "en", ...parts.slice(1)].join("/");
      return u.toString();
    } catch {
      return null;
    }
  };

  const toLangUrl = href => {
    try {
      if (LANG === "en") return toEnglishUrl(href);
      const u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return null;
      const parts = String(u.pathname || "/").split("/").filter(Boolean);
      const isGithub = String(window.location.hostname || "").endsWith("github.io");
      if (!isGithub) {
        if (parts[0] !== "en") return u.toString();
        u.pathname = "/" + parts.slice(1).join("/");
        return u.toString();
      }
      if (!parts.length) return null;
      // /<repo>/en/... -> /<repo>/...
      if (parts[1] === "en") {
        u.pathname = "/" + [parts[0], ...parts.slice(2)].join("/");
        return u.toString();
      }
      // /en/<repo>/... -> /<repo>/...
      if (parts[0] === "en" && parts.length >= 2) {
        u.pathname = "/" + [parts[1], ...parts.slice(2)].join("/");
        return u.toString();
      }
      return u.toString();
    } catch {
      return null;
    }
  };

  const I18N = {
    ru: {
      langSwitchLabel: "Переключить на английский",
      langSwitchText: "EN",
      consultation: "Консультация",
      menu: "Меню",
      closeMenu: "Закрыть меню",
      siteMenuAria: "Меню сайта",
      homeAria: "На главную",
      sitemapAria: "Структура сайта",
      section: "Раздел",
      footerCompany: "Компания AEO © 2026",
      privacy: "Политика конфиденциальности",
      consent: "Согласие на обработку данных",
      updated: "Обновлено",
      tldr: "Коротко (TL;DR):",
      toc: "Содержание",
      readAlso: "Читайте также:",
      railAria: "Теги и описание",
      railShowAria: "Показать навигацию по статье",
      consultationTitle: "Консультация с экспертом",
      consultationHint: "Разберите ваш вопрос с опытным специалистом по продвижению.",
      reserve: "Забронировать",
      contacts: "Контакты",
      contactFormAria: "Форма связи",
      formTitle: "Заявка и контакты",
      formIntro: "Оставьте контакты — ответим в ближайшее время.",
      thanks: "Спасибо!",
      thanksText: "Мы свяжемся с вами как можно быстрее.",
      yourName: "Ваше имя",
      yourEmail: "Email для связи",
      yourMessage: "Коротко: что нужно сделать?",
      send: "Отправить",
      popupPrivacyBody1: "Мы обрабатываем персональные данные только для связи по заявкам и оказания услуг.",
      popupPrivacyBody2: "Данные не передаются третьим лицам без законных оснований и хранятся в защищенном виде.",
      popupConsentBody1:
        "Оставляя данные на сайте, вы даете согласие на обработку персональных данных в целях обратной связи и оказания услуг.",
      popupConsentBody2:
        "Вы можете отозвать согласие, направив запрос по контактному номеру, указанному в разделе «Контакты».",
      terms: "Условия использования",
      popupTermsBody1: "Используя сайт, вы соглашаетесь с условиями обработки информации и правилами взаимодействия.",
      popupTermsBody2: "Материалы сайта носят информационный характер и не являются публичной офертой.",
      footerCols: {
        main: "Основное",
        methods: "Методы",
        platforms: "Нейроплатформы",
        tools: "Инструменты",
        strategy: "Стратегия",
        industries: "Отрасли"
      },
      links: {
        blog: "Блог",
        company: "Компания",
        methodsGuide: "Методы продвижения — обзор",
        geo: "GEO оптимизация",
        aeo: "AEO оптимизация",
        seo: "SEO оптимизация",
        aio: "AIO оптимизация",
        aiSmm: "AI & SMM",
        faqMethods: "FAQ по методам",
        platformsIntro: "Что такое нейроплатформы",
        yandexAlice: "Яндекс Алиса",
        analyticsAudit: "Аналитика и аудит",
        contentFactory: "Контент‑завод",
        itAudit: "Аудит текущего IT‑решения",
        promoStrategy: "Стратегия продвижения",
        fullPromo: "Полное продвижение",
        supportService: "Поддерживающий сервис",
        strategyOverview: "Стратегия — обзор раздела",
        strategicIntent: "Стратегический интент",
        rollout: "GEO/AEO: сайт и контентная система",
        auditAi: "Аудит AI‑видимости и метрики",
        metrics: "Метрики GEO/AEO и BI",
        dashboard: "GEO/AEO BI‑дашборд",
        implementation: "Реализация изменений",
        optimization: "Оптимизация и трекинг",
        allIndustries: "Все отрасли и нейропоиск",
        marketplaces: "Маркетплейсы",
        clinics: "Клиники",
        serviceCenters: "Сервисные центры",
        showrooms: "Шоурумы",
        beauty: "Салоны красоты",
        delivery: "Доставка",
        corporations: "Корпорации",
        ecommerce: "E‑commerce",
        saas: "SaaS & digital",
        localBusiness: "Локальный бизнес",
        aiDiscovery: "AI‑discovery лидеры"
      }
    },
    en: {
      langSwitchLabel: "Switch to Russian",
      langSwitchText: "RU",
      consultation: "Consultation",
      menu: "Menu",
      closeMenu: "Close menu",
      siteMenuAria: "Site menu",
      homeAria: "Home",
      sitemapAria: "Site structure",
      section: "Section",
      footerCompany: "AEO Company © 2026",
      privacy: "Privacy policy",
      consent: "Data processing consent",
      updated: "Updated",
      tldr: "TL;DR:",
      toc: "Table of contents",
      readAlso: "Read also:",
      railAria: "Tags and description",
      railShowAria: "Show article navigation",
      consultationTitle: "Expert consultation",
      consultationHint: "Discuss your question with an experienced visibility specialist.",
      reserve: "Book",
      contacts: "Contacts",
      contactFormAria: "Contact form",
      formTitle: "Request & contacts",
      formIntro: "Leave your details — we'll get back to you soon.",
      thanks: "Thank you!",
      thanksText: "We'll contact you as soon as possible.",
      yourName: "Your name",
      yourEmail: "Email",
      yourMessage: "Briefly: what do you need?",
      send: "Send",
      popupPrivacyBody1: "We process personal data only to respond to requests and provide services.",
      popupPrivacyBody2: "Data is not shared with third parties without legal grounds and is stored securely.",
      popupConsentBody1:
        "By submitting your details on the website, you consent to personal data processing for communication and service delivery.",
      popupConsentBody2: "You can revoke consent by contacting us using the phone number in the Contacts section.",
      terms: "Terms of use",
      popupTermsBody1: "By using this website, you agree to information handling and interaction rules.",
      popupTermsBody2: "Website materials are informational and do not constitute a public offer.",
      footerCols: {
        main: "Main",
        methods: "Methods",
        platforms: "AI platforms",
        tools: "Tools",
        strategy: "Strategy",
        industries: "Industries"
      },
      links: {
        blog: "Blog",
        company: "Company",
        methodsGuide: "Promotion methods — overview",
        geo: "GEO optimization",
        aeo: "AEO optimization",
        seo: "SEO optimization",
        aio: "AIO optimization",
        aiSmm: "AI & SMM",
        faqMethods: "Methods FAQ",
        platformsIntro: "What are AI platforms",
        yandexAlice: "Yandex Alice",
        analyticsAudit: "Analytics & audit",
        contentFactory: "Content factory",
        itAudit: "Current IT audit",
        promoStrategy: "Promotion strategy",
        fullPromo: "Full promotion",
        supportService: "Ongoing support",
        strategyOverview: "Strategy — overview",
        strategicIntent: "Strategic intent",
        rollout: "GEO/AEO: website & content system",
        auditAi: "AI visibility audit & metrics",
        metrics: "GEO/AEO metrics & BI",
        dashboard: "GEO/AEO BI dashboard",
        implementation: "Implementation",
        optimization: "Optimization & tracking",
        allIndustries: "All industries & AI search",
        marketplaces: "Marketplaces",
        clinics: "Clinics",
        serviceCenters: "Service centers",
        showrooms: "Showrooms",
        beauty: "Beauty salons",
        delivery: "Delivery",
        corporations: "Corporations",
        ecommerce: "E‑commerce",
        saas: "SaaS & digital",
        localBusiness: "Local business",
        aiDiscovery: "AI discovery leaders"
      }
    }
  };

  const tr = key => {
    const dict = I18N[LANG] || I18N.ru;
    return dict[key] ?? (I18N.ru[key] ?? "");
  };

  const trPath = (path, fallback) => {
    const dict = I18N[LANG] || I18N.ru;
    const ru = I18N.ru;
    return (dict.links && dict.links[path]) || (ru.links && ru.links[path]) || fallback || "";
  };

  const buildLanguageSwitchUrl = () => {
    const u = new URL(window.location.href);
    const parts = String(u.pathname || "/").split("/").filter(Boolean);
    const wasTrailingSlash = String(window.location.pathname || "").endsWith("/");
    const isGithub = String(window.location.hostname || "").endsWith("github.io");

    if (!isGithub) {
      const hasEn = parts[0] === "en";
      if (hasEn) parts.splice(0, 1);
      else parts.splice(0, 0, "en");
      u.pathname = "/" + parts.join("/");
      if (wasTrailingSlash && !u.pathname.endsWith("/")) u.pathname += "/";
      return u.toString();
    }

    if (!parts.length) return u.toString();

    let repo = parts[0];
    let rest = parts.slice(1);
    let currentlyEn = rest[0] === "en";

    // wrong/legacy layout: /en/<repo>/...
    if (repo === "en" && parts.length >= 2) {
      repo = parts[1];
      rest = parts.slice(2);
      currentlyEn = true;
    }

    const nextParts = currentlyEn ? [repo, ...rest] : [repo, "en", ...rest];
    u.pathname = "/" + nextParts.join("/");
    if (wasTrailingSlash && !u.pathname.endsWith("/")) u.pathname += "/";
    return u.toString();
  };

  const ensureLanguageSwitch = () => {
    const headerInner = document.querySelector("header.site-header .header-inner");
    if (!headerInner) return;

    const actions = headerInner.querySelector(".header-actions");
    const host = actions || headerInner;
    if (host.querySelector(".lang-switch")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-switch";
    btn.textContent = tr("langSwitchText");
    btn.setAttribute("aria-label", tr("langSwitchLabel"));
    btn.addEventListener("click", () => {
      window.location.href = buildLanguageSwitchUrl();
    });

    if (actions) {
      actions.insertBefore(btn, actions.firstChild);
    } else {
      const burger = headerInner.querySelector(".burger");
      if (burger) burger.insertAdjacentElement("beforebegin", btn);
      else headerInner.appendChild(btn);
    }
  };

  /** В шапке только «Консультация» + бургер: убираем прочие кнопки/ссылки и при необходимости добавляем консультацию. */
  const ensureHeaderConsultationCta = () => {
    const headerInner = document.querySelector("header.site-header .header-inner");
    if (!headerInner) return;

    const actions = headerInner.querySelector(".header-actions");
    if (actions) {
      actions.querySelectorAll("a.btn.btn-header").forEach(a => {
        const keep =
          a.classList.contains("btn-header--white") && a.getAttribute("data-popup") === "contacts";
        if (!keep) a.remove();
      });
      actions.querySelectorAll("button.btn.btn-header").forEach(b => b.remove());
    }

    if (headerInner.querySelector(".header-actions a.btn-header--white[data-popup='contacts']")) return;

    const consult = document.createElement("a");
    consult.href = "#";
    consult.className = "btn btn-header btn-header--white";
    consult.dataset.popup = "contacts";
    consult.textContent = tr("consultation");

    const burger = headerInner.querySelector(".burger");

    if (actions) {
      actions.insertBefore(consult, actions.firstChild);
      return;
    }

    if (!burger) return;

    const wrap = document.createElement("div");
    wrap.className = "header-actions";
    burger.replaceWith(wrap);
    wrap.appendChild(consult);
    wrap.appendChild(burger);
  };

  ensureHeaderConsultationCta();
  ensureLanguageSwitch();

  const sitemapHtml = `
    <div class="footer-sitemap" aria-label="${tr("sitemapAria")}">
      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.methods}</div>
        <a href="${pageBase}methods/methods-guide.html">${trPath("methodsGuide", "Methods overview")}</a>
        <a href="${pageBase}methods/geo.html">${trPath("geo", "GEO optimization")}</a>
        <a href="${pageBase}methods/aeo.html">${trPath("aeo", "AEO optimization")}</a>
        <a href="${pageBase}methods/seo.html">${trPath("seo", "SEO optimization")}</a>
        <a href="${pageBase}methods/aio.html">${trPath("aio", "AIO optimization")}</a>
        <a href="${pageBase}methods/ai-smm.html">${trPath("aiSmm", "AI &amp; SMM")}</a>
        <a href="${pageBase}methods/faq-methods.html">${trPath("faqMethods", "Methods FAQ")}</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.platforms}</div>
        <a href="${pageBase}neural-platforms/platform-comparison.html">${trPath("platformsIntro", "What are AI platforms")}</a>
        <a href="${pageBase}neural-platforms/chatgpt.html">ChatGPT</a>
        <a href="${pageBase}neural-platforms/perplexity.html">Perplexity</a>
        <a href="${pageBase}neural-platforms/deepseek.html">DeepSeek</a>
        <a href="${pageBase}neural-platforms/claude.html">Claude</a>
        <a href="${pageBase}neural-platforms/google-gemini.html">Google Gemini</a>
        <a href="${pageBase}neural-platforms/yandex-alice.html">${trPath("yandexAlice", "Yandex Alice")}</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.tools}</div>
        <a href="${pageBase}tools/analytics.html">${trPath("analyticsAudit", "Analytics & audit")}</a>
        <a href="${pageBase}tools/content-factory.html">${trPath("contentFactory", "Content factory")}</a>
        <a href="${pageBase}tools/it-audit.html">${trPath("itAudit", "IT audit")}</a>
        <a href="${pageBase}tools/promotion-strategy.html">${trPath("promoStrategy", "Promotion strategy")}</a>
        <a href="${pageBase}tools/full-promotion.html">${trPath("fullPromo", "Full promotion")}</a>
        <a href="${pageBase}tools/support-service.html">${trPath("supportService", "Ongoing support")}</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.strategy}</div>
        <a href="${pageBase}strategy/overview.html">${trPath("strategyOverview", "Strategy overview")}</a>
        <a href="${pageBase}strategy/strategic-intent.html">${trPath("strategicIntent", "Strategic intent")}</a>
        <a href="${pageBase}strategy/geo-aeo-rollout.html">${trPath("rollout", "GEO/AEO rollout")}</a>
        <a href="${pageBase}strategy/audit-ai-visibility.html">${trPath("auditAi", "AI visibility audit")}</a>
        <a href="${pageBase}strategy/geo-aeo-metrics-bi.html">${trPath("metrics", "Metrics & BI")}</a>
        <a href="${pageBase}tools/geo-aeo-bi-dashboard.html">${trPath("dashboard", "BI dashboard")}</a>
        <a href="${pageBase}strategy/implementation-changes.html">${trPath("implementation", "Implementation")}</a>
        <a href="${pageBase}strategy/optimization-tracking.html">${trPath("optimization", "Optimization & tracking")}</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.industries}</div>
        <a href="${pageBase}case-studies/all-industries-geo-aeo.html">${trPath("allIndustries", "All industries")}</a>
        <a href="${pageBase}case-studies/marketplaces-neuro-strategy.html">${trPath("marketplaces", "Marketplaces")}</a>
        <a href="${pageBase}case-studies/clinics-neuro-strategy.html">${trPath("clinics", "Clinics")}</a>
        <a href="${pageBase}case-studies/service-centers-neuro-strategy.html">${trPath("serviceCenters", "Service centers")}</a>
        <a href="${pageBase}case-studies/showrooms-neuro-strategy.html">${trPath("showrooms", "Showrooms")}</a>
        <a href="${pageBase}case-studies/beauty-neuro-strategy.html">${trPath("beauty", "Beauty salons")}</a>
        <a href="${pageBase}case-studies/delivery-neuro-strategy.html">${trPath("delivery", "Delivery")}</a>
        <a href="${pageBase}case-studies/corporations.html">${trPath("corporations", "Corporations")}</a>
        <a href="${pageBase}case-studies/ecommerce.html">${trPath("ecommerce", "E‑commerce")}</a>
        <a href="${pageBase}case-studies/saas.html">${trPath("saas", "SaaS &amp; digital")}</a>
        <a href="${pageBase}case-studies/local-business.html">${trPath("localBusiness", "Local business")}</a>
        <a href="${pageBase}case-studies/ai-discovery.html">${trPath("aiDiscovery", "AI discovery leaders")}</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">${(I18N[LANG] || I18N.ru).footerCols.main}</div>
        <a href="${pageBase}blog/main.html">${trPath("blog", "Blog")}</a>
        <a href="${pageBase}about.html">${trPath("company", "Company")}</a>
      </div>
    </div>
  `;

  const footer = document.querySelector("footer.site-footer");
  if (footer) {
    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-main footer-main--sitemap">
          ${sitemapHtml}
        </div>

        <div class="footer-bottom">
          <p>${tr("footerCompany")}</p>
          <div class="footer-meta">
            <button class="footer-meta__link" type="button" data-popup="privacy">${tr("privacy")}</button>
            <button class="footer-meta__link" type="button" data-popup="consent">${tr("consent")}</button>
          </div>
        </div>
      </div>
    `;

    // Footer accordion on mobile (avoid super long sitemap)
    const enhanceFooterAccordion = () => {
      // Only enable accordion when footer collapses into one long column
      if (!window.matchMedia || !window.matchMedia("(max-width: 420px)").matches) return;
      const sitemap = footer.querySelector(".footer-sitemap");
      if (!sitemap) return;
      if (sitemap.dataset.accordionReady === "true") return;

      const cols = Array.from(sitemap.querySelectorAll(":scope > .footer-col"));
      if (!cols.length) return;

      cols.forEach((col, idx) => {
        const titleEl = col.querySelector(".footer-col__title");
        if (!titleEl) return;
        const title = String(titleEl.textContent || "").trim();
        const links = Array.from(col.querySelectorAll(":scope > a, :scope > button, :scope > [data-popup]"));

        const details = document.createElement("details");
        details.className = "footer-acc";
        if (idx === 0) details.open = true; // "Основное" раскрыто по умолчанию

        const summary = document.createElement("summary");
        summary.className = "footer-acc__summary";
        summary.textContent = title || tr("section");

        const panel = document.createElement("div");
        panel.className = "footer-acc__panel";

        // Move existing anchors into panel
        Array.from(col.children).forEach(child => {
          if (child === titleEl) return;
          panel.appendChild(child);
        });

        details.appendChild(summary);
        details.appendChild(panel);
        col.replaceWith(details);
      });

      sitemap.dataset.accordionReady = "true";
    };

    enhanceFooterAccordion();
  }

  // Top mega menu (overlay)
  const header = document.querySelector("header.site-header");
  const topMenu = document.createElement("div");
  topMenu.className = "top-menu";
  topMenu.hidden = true;
  topMenu.innerHTML = `
    <div class="top-menu__backdrop" data-topmenu-close></div>
    <div class="top-menu__panel" role="dialog" aria-modal="true" aria-label="${tr("siteMenuAria")}">
      <div class="top-menu__header">
        <a class="top-menu__brand" href="${pageBase}index.html#hero" aria-label="${tr("homeAria")}">
          <img src="${prefix}Img/logo-aeo.png" alt="GEO logo" />
        </a>
        <button class="top-menu__close" type="button" data-topmenu-close aria-label="${tr("closeMenu")}">×</button>
      </div>
      <div class="top-menu__content">
        ${sitemapHtml}
      </div>
    </div>
  `;

  if (header && !document.querySelector(".top-menu")) {
    header.insertAdjacentElement("afterend", topMenu);
  }

  const enhanceTopMenuAccordion = () => {
    const root = document.querySelector(".top-menu");
    if (!root) return;
    if (root.dataset.accordionReady === "true") return;

    const sitemap = root.querySelector(".footer-sitemap");
    if (!sitemap) return;

    const cols = Array.from(sitemap.querySelectorAll(":scope > .footer-col"));
    if (!cols.length) return;

    cols.forEach((col, idx) => {
      const titleEl = col.querySelector(".footer-col__title");
      if (!titleEl) return;

      const title = String(titleEl.textContent || "").trim();

      const details = document.createElement("details");
      details.className = "menu-acc";
      if (idx === 0) details.open = true;

      const summary = document.createElement("summary");
      summary.className = "menu-acc__summary";
      summary.textContent = title || tr("section");

      const panel = document.createElement("div");
      panel.className = "menu-acc__panel";
      Array.from(col.children).forEach(child => {
        if (child === titleEl) return;
        panel.appendChild(child);
      });

      details.appendChild(summary);
      details.appendChild(panel);

      col.replaceWith(details);
    });

    root.dataset.accordionReady = "true";
  };

  enhanceTopMenuAccordion();

  // Guarantee EN navigation: rewrite internal links (hrefs) and intercept clicks.
  if (LANG === "en") {
    const rewriteLinksToEn = root => {
      const scope = root instanceof Element ? root : document;
      scope.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        const next = toEnglishUrl(href);
        if (!next) return;
        try {
          const cur = new URL(href, window.location.href).toString();
          if (cur === next) return;
        } catch {}
        a.setAttribute("href", next);
      });
    };

    rewriteLinksToEn(document.querySelector(".drawer-nav") || document);
    rewriteLinksToEn(document.querySelector(".top-menu") || document);
    rewriteLinksToEn(document.querySelector("footer.site-footer") || document);

    document.addEventListener(
      "click",
      e => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const a = target.closest("a[href]");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        const next = toEnglishUrl(href);
        if (!next) return;
        try {
          const cur = new URL(href, window.location.href).toString();
          if (cur === next) return;
        } catch {}
        e.preventDefault();
        window.location.href = next;
      },
      { capture: true }
    );
  }

  // Content upgrades for AI citation (TOC, ids, update date, short answer, JSON-LD FAQ)
  const sectionHeader = document.querySelector(".section-header");
  const pageH1 =
    (sectionHeader ? sectionHeader.querySelector("h1") : null) ||
    document.querySelector("main h1") ||
    document.querySelector("h1");
  const article = document.querySelector("article.content-article");

  const formatUpdateDate = () => {
    const d = new Date();
    const months =
      LANG === "en"
        ? [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ]
        : [
            "январь",
            "февраль",
            "март",
            "апрель",
            "май",
            "июнь",
            "июль",
            "август",
            "сентябрь",
            "октябрь",
            "ноябрь",
            "декабрь"
          ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const slugify = str =>
    String(str || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9а-я\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "section";

  const ensureUpdateDate = () => {
    if (!pageH1) return;
    const existing =
      (sectionHeader && sectionHeader.querySelector(".update-date")) ||
      pageH1.parentElement?.querySelector?.(".update-date");
    if (existing) return;
    const p = document.createElement("p");
    p.className = "update-date";
    p.textContent = `${tr("updated")}: ${formatUpdateDate()}`;
    pageH1.insertAdjacentElement("afterend", p);
  };

  /** Модульная сетка статей: заголовок на всю ширину, контент + боковая колонка (теги + описание). */
  const initArticlePageLayout = () => {
    document.querySelectorAll("main .section > .container").forEach(container => {
      if (container.dataset.articleLayout === "1") return;
      const article = container.querySelector(":scope > article.content-article");
      const header = container.querySelector(":scope > .section-header");
      if (!article || !header || !header.querySelector("h1")) return;

      const rail = document.createElement("aside");
      rail.className = "article-page-layout__rail";
      rail.setAttribute("aria-label", "Теги и описание");

      const kwRaw = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
      const tagParts = kwRaw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      if (tagParts.length) {
        const wrap = document.createElement("div");
        wrap.className = "article-page-layout__tags";
        tagParts.forEach(text => {
          const span = document.createElement("span");
          span.className = "article-tag";
          span.textContent = text;
          wrap.appendChild(span);
        });
        rail.appendChild(wrap);
      }

      const sub = header.querySelector(".section-subtitle");
      if (sub) {
        rail.appendChild(sub);
      } else {
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        const t = metaDesc.trim();
        if (t) {
          const p = document.createElement("p");
          p.className = "article-page-layout__lede";
          p.textContent = t;
          rail.appendChild(p);
        }
      }

      if (!rail.firstChild) return;

      const intro = document.createElement("div");
      intro.className = "article-page-layout__intro section-header";
      while (header.firstChild) intro.appendChild(header.firstChild);
      header.replaceWith(intro);
      container.appendChild(rail);
      container.classList.add("article-page-layout");
      container.dataset.articleLayout = "1";
    });
  };

  /** Голубая плашка + рейл в одной правой колонке (без «пустых» строк сетки). */
  const injectArticleConsultBanner = () => {
    document.querySelectorAll(".container.article-page-layout").forEach(container => {
      const rail = container.querySelector(".article-page-layout__rail");
      if (!rail) return;

      const looseBanner = container.querySelector(":scope > .article-consult-banner");
      if (looseBanner && rail.parentElement === container) {
        const sb = document.createElement("div");
        sb.className = "article-page-layout__sidebar";
        container.insertBefore(sb, looseBanner);
        sb.appendChild(looseBanner);
        sb.appendChild(rail);
        return;
      }

      if (container.querySelector(".article-consult-banner")) return;

      const sidebar = document.createElement("div");
      sidebar.className = "article-page-layout__sidebar";

      const banner = document.createElement("div");
      banner.className = "article-consult-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute(
        "aria-label",
        `${tr("consultationTitle")}. ${tr("consultationHint")}`
      );

      const copy = document.createElement("div");
      copy.className = "article-consult-banner__copy";

      const title = document.createElement("p");
      title.className = "article-consult-banner__title";
      title.textContent = tr("consultationTitle");

      const hint = document.createElement("span");
      hint.className = "article-consult-banner__hint";
      hint.textContent = tr("consultationHint");

      copy.appendChild(title);
      copy.appendChild(hint);

      const cta = document.createElement("button");
      cta.type = "button";
      cta.className = "article-consult-banner__cta";
      cta.setAttribute("data-popup", "contacts");
      cta.setAttribute("aria-label", tr("consultationTitle"));
      cta.innerHTML =
        `<svg class="visibility-cta__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>` +
        `</svg><span class="article-consult-banner__cta-text">${tr("reserve")}</span>`;

      banner.appendChild(copy);
      banner.appendChild(cta);

      container.insertBefore(sidebar, rail);
      sidebar.appendChild(banner);
      sidebar.appendChild(rail);
    });
  };

  const ensureLeadAndShortAnswer = () => {
    if (!sectionHeader || !pageH1) return;
    // Avoid duplicating the same AI lead if page already has it (e.g. custom hero on index)
    if (document.querySelector(".lead-ai")) {
      // Still allow short-answer for articles below
    } else {
    const existingLead = sectionHeader.querySelector(".lead-ai");
    if (!existingLead) {
      const lead = document.createElement("p");
      lead.className = "lead-ai";
      lead.innerHTML =
        `<strong>AI‑контент 2026:</strong> GEO (Generative Engine Optimization) и AEO (Answer Engine Optimization) — ` +
        `как попасть в ответы DeepSeek, ChatGPT, Perplexity и других нейроплатформ.`;
      const after = sectionHeader.querySelector(".update-date") || pageH1;
      after.insertAdjacentElement("afterend", lead);
    }
    }

    if (!article) return;
    if (article.querySelector(".short-answer")) return;

    const collapse = s => String(s || "").trim().replace(/\s+/g, " ");
    const pickAnswerText = () => {
      // Prefer the first H2's first meaningful paragraph/list as "main answer"
      const firstH2 = article.querySelector("h2");
      let el = firstH2 ? firstH2.nextElementSibling : null;
      while (el && el.tagName && !/^H2$/i.test(el.tagName)) {
        if (/^(P|UL|OL)$/i.test(el.tagName)) {
          const t = collapse(el.textContent);
          if (t) return t;
        }
        el = el.nextElementSibling;
      }
      // Fallback: first paragraph in article
      const firstP = article.querySelector("p");
      return firstP ? collapse(firstP.textContent) : "";
    };

    const toTldr = (text, maxSentences = 3) => {
      const t = collapse(text);
      if (!t) return "";
      const parts = t.split(/(?<=[.!?…])\s+/).filter(Boolean);
      const sliced = parts.slice(0, Math.max(1, maxSentences)).join(" ");
      // If result is too short (e.g., no punctuation), keep original but cap hard length.
      const out = sliced.length >= 40 ? sliced : t;
      return out.length > 420 ? `${out.slice(0, 417)}…` : out;
    };

    const text = toTldr(pickAnswerText(), 3);
    const short = document.createElement("div");
    short.className = "short-answer";
    short.innerHTML = `<strong>${tr("tldr")}</strong> ${
      text || (LANG === "en"
        ? "Below are direct answers to key questions and a structure that AI systems can easily quote."
        : "Ниже — прямые ответы на ключевые вопросы и структура, которую нейросети удобно цитируют.")
    }`;
    article.insertAdjacentElement("afterbegin", short);
  };

  const buildTOCAndIds = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (h2s.length < 2) return;

    const toc = document.createElement("div");
    toc.className = "content-toc";
    toc.setAttribute("aria-label", tr("toc"));

    h2s.forEach((h2, idx) => {
      if (!h2.id) h2.id = slugify(h2.textContent) + (idx ? `-${idx + 1}` : "");
      const a = document.createElement("a");
      a.href = `#${h2.id}`;
      a.textContent = h2.textContent.trim();
      toc.appendChild(a);
    });

    const existingToc = article.querySelector(".content-toc");
    if (existingToc) existingToc.remove();
    article.insertAdjacentElement("afterbegin", toc);
  };

  const injectFaqJsonLd = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (!h2s.length) return;

    const qa = [];
    h2s.forEach(h2 => {
      const q = h2.textContent.trim();
      if (!q) return;

      let el = h2.nextElementSibling;
      if (el && el.classList && el.classList.contains("faq-list")) {
        el.querySelectorAll(":scope > details").forEach(detail => {
          const sum = detail.querySelector("summary");
          if (!sum) return;
          const name = sum.textContent.trim().replace(/\s+/g, " ");
          const parts = [];
          detail.querySelectorAll(":scope > p").forEach(p => {
            const t = p.textContent.trim();
            if (t) parts.push(t);
          });
          const text = parts.join(" ").replace(/\s+/g, " ");
          if (name && text) {
            qa.push({
              "@type": "Question",
              name,
              acceptedAnswer: { "@type": "Answer", text }
            });
          }
        });
        return;
      }

      let ansText = "";
      while (el && el.tagName && !/^H2$/i.test(el.tagName)) {
        if (/^(P|UL|OL|DIV)$/i.test(el.tagName)) {
          ansText = el.textContent.trim().replace(/\s+/g, " ");
          if (ansText) break;
        }
        el = el.nextElementSibling;
      }
      if (!ansText) return;
      qa.push({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: ansText }
      });
    });

    if (qa.length < 2) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: qa
    };

    const existing = document.querySelector('script[data-auto="faq-jsonld"]');
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.auto = "faq-jsonld";
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  };

  const injectArticleJsonLd = () => {
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc ? (metaDesc.getAttribute("content") || "").trim() : "";
    const headline =
      (pageH1 ? pageH1.textContent.trim() : "") ||
      (document.title || "").trim() ||
      "Статья";

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonicalEl ? (canonicalEl.getAttribute("href") || "").trim() : "";
    const mainEntityOfPage =
      canonicalHref ||
      (typeof window !== "undefined" && window.location ? window.location.pathname : "");

    // Fixed date requested (can be changed later to per-page values)
    const date = "2026-04-08";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline,
      description,
      proficiencyLevel: "Beginner",
      dependencies: "SEO база",
      mainEntityOfPage,
      datePublished: date,
      dateModified: date,
      author: {
        "@type": "Organization",
        name: "GEO Hub"
      }
    };

    const existing = document.querySelector('script[data-auto="article-jsonld"]');
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.auto = "article-jsonld";
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  };

  const injectReadAlsoLinks = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (!h2s.length) return;

    const candidates = [
      { href: `${prefix}methods/aeo.html`, label: "Что такое AEO оптимизация", kw: ["aeo", "answer", "ответ"] },
      { href: `${prefix}methods/geo.html`, label: "Что такое GEO оптимизация", kw: ["geo", "локал", "карты"] },
      { href: `${prefix}methods/seo.html`, label: "SEO оптимизация (2026)", kw: ["seo", "органик"] },
      {
        href: `${prefix}methods/methods-guide.html`,
        label: "Методы продвижения: как сочетать",
        kw: ["vs", "сравнен", "выбрать", "метод", "ландшафт", "стек", "конфликт"]
      },
      { href: `${prefix}tools/content-factory.html#checklists`, label: "Чеклисты (2026)", kw: ["чеклист", "шаг", "план"] },
      { href: `${prefix}case-studies/local-business.html`, label: "Кейсы локального бизнеса", kw: ["локальн", "карты", "рядом"] }
    ];

    h2s.forEach(h2 => {
      const already = h2.parentElement?.querySelector?.(`.read-also[data-for="${h2.id}"]`);
      if (already) return;
      const text = h2.textContent.toLowerCase();
      const currentUrl = new URL(window.location.href);
      const picked = candidates
        .filter(c => c.kw.some(k => text.includes(k)))
        .filter(c => {
          try {
            const target = new URL(c.href, currentUrl.href);
            return target.pathname !== currentUrl.pathname;
          } catch (e) {
            return true;
          }
        })
        .slice(0, 2);
      if (!picked.length) return;

      const box = document.createElement("p");
      box.className = "read-also";
      box.dataset.for = h2.id || "";
      box.innerHTML =
        `<strong>${tr("readAlso")}</strong> ` +
        picked.map(p => `<a href="${p.href}">${p.label}</a>`).join(" | ");

      const insertAfter = h2.nextElementSibling;
      if (insertAfter) insertAfter.insertAdjacentElement("afterend", box);
      else h2.insertAdjacentElement("afterend", box);
    });
  };

  /** Вспомогательные блоки (TL;DR, оглавление, примечания) — в боковую колонку. «Читайте также» и «Связанные страницы» остаются в основном тексте. */
  const relocateArticleRailBlocks = () => {
    document.querySelectorAll(".article-page-layout").forEach(layout => {
      const rail = layout.querySelector(".article-page-layout__rail");
      const article = layout.querySelector("article.content-article");
      if (!rail || !article) return;
      if (rail.dataset.blocksRelocated === "1") return;
      rail.dataset.blocksRelocated = "1";

      const nodes = article.querySelectorAll(".short-answer, .content-toc, .content-note");
      nodes.forEach(el => rail.appendChild(el));
    });
  };

  /** Mobile-only: collapse the whole blue rail (tags + TL;DR + TOC) behind a "⋯" disclosure. */
  const syncArticleRailMobileCollapse = () => {
    const mq = window.matchMedia && window.matchMedia("(max-width: 960px)");
    const isMobile = mq ? mq.matches : false;

    document.querySelectorAll(".article-page-layout").forEach(layout => {
      const sidebar = layout.querySelector(".article-page-layout__sidebar");
      if (!sidebar) return;

      const unwrapRail = railEl => {
        if (!(railEl instanceof Element)) return;
        const hostDd = railEl.closest("details.article-rail-dd");
        if (!hostDd) return;
        const banner = sidebar.querySelector(":scope > .article-consult-banner");
        if (banner && banner.nextSibling !== hostDd) {
          sidebar.insertBefore(hostDd, banner.nextSibling);
        }

        // Put rail back right after the consultation banner (banner first, rail second)
        if (banner) sidebar.insertBefore(railEl, banner.nextSibling);
        else sidebar.insertBefore(railEl, hostDd);

        hostDd.remove();
        delete railEl.dataset.mobileWrapped;
      };

      const wrapRail = railEl => {
        if (!(railEl instanceof Element)) return;
        if (railEl.closest("details.article-rail-dd")) return;

        // If an older version wrapped only tags, unwrap back to a plain tag list.
        const legacyTagsDd = railEl.querySelector(":scope > details.article-tags-dd");
        if (legacyTagsDd) {
          const legacyPanel = legacyTagsDd.querySelector(":scope > .article-tags-dd__panel");
          const tags = legacyPanel && legacyPanel.querySelector(":scope > .article-page-layout__tags");
          if (tags) legacyTagsDd.replaceWith(tags);
          else legacyTagsDd.remove();
        }

        const dd = document.createElement("details");
        dd.className = "article-rail-dd";
        dd.open = false;

        const summary = document.createElement("summary");
        summary.className = "article-rail-dd__summary";
        summary.setAttribute("aria-label", "Показать навигацию по статье");
        summary.textContent = "⋯";

        const panel = document.createElement("div");
        panel.className = "article-rail-dd__panel";
        panel.appendChild(railEl);

        dd.appendChild(summary);
        dd.appendChild(panel);
        sidebar.appendChild(dd);

        railEl.dataset.mobileWrapped = "1";
      };

      const rail = sidebar.querySelector(":scope > .article-page-layout__rail") ||
        sidebar.querySelector(".article-page-layout__rail");
      if (!rail) return;

      if (isMobile) wrapRail(rail);
      else unwrapRail(rail);
    });
  };

  const mqArticleRail = window.matchMedia && window.matchMedia("(max-width: 960px)");
  if (mqArticleRail && typeof mqArticleRail.addEventListener === "function") {
    mqArticleRail.addEventListener("change", syncArticleRailMobileCollapse);
  } else if (mqArticleRail && typeof mqArticleRail.addListener === "function") {
    mqArticleRail.addListener(syncArticleRailMobileCollapse);
  }

  /** Синий блок внизу каждой статьи: консультация + кнопка «Забронировать» со звездой. */
  const injectArticleConsultFooter = () => {
    document.querySelectorAll("main article.content-article").forEach(article => {
      if (article.querySelector(".article-consult-footer")) return;

      const footer = document.createElement("div");
      footer.className = "article-consult-footer";
      footer.setAttribute("role", "region");
      footer.setAttribute(
        "aria-label",
        `${tr("consultationTitle")}. ${tr("consultationHint")}`
      );

      const inner = document.createElement("div");
      inner.className = "article-consult-footer__inner";

      const copy = document.createElement("div");
      copy.className = "article-consult-footer__copy";

      const title = document.createElement("p");
      title.className = "article-consult-footer__title";
      title.textContent = tr("consultationTitle");

      const hint = document.createElement("p");
      hint.className = "article-consult-footer__hint";
      hint.textContent = tr("consultationHint");

      copy.appendChild(title);
      copy.appendChild(hint);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "article-consult-footer__cta";
      btn.setAttribute("data-popup", "contacts");
      btn.setAttribute("aria-label", tr("consultationTitle"));
      btn.innerHTML =
        `<svg class="visibility-cta__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>` +
        `</svg><span class="article-consult-footer__cta-text">${tr("reserve")}</span>`;

      inner.appendChild(copy);
      inner.appendChild(btn);
      footer.appendChild(inner);
      article.appendChild(footer);
    });
  };

  ensureUpdateDate();
  ensureLeadAndShortAnswer();
  initArticlePageLayout();
  injectArticleConsultBanner();
  buildTOCAndIds();
  injectReadAlsoLinks();
  relocateArticleRailBlocks();
  syncArticleRailMobileCollapse();
  injectArticleConsultFooter();
  injectFaqJsonLd();
  injectArticleJsonLd();

  const openTopMenu = () => {
    if (!burger) return;
    topMenu.hidden = false;
    topMenu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  };

  const closeTopMenu = () => {
    if (!burger) return;
    topMenu.classList.remove("is-open");
    topMenu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  if (burger) {
    burger.addEventListener("click", () => {
      const isOpen = topMenu.classList.contains("is-open") && !topMenu.hidden;
      if (isOpen) closeTopMenu();
      else openTopMenu();
    });
  }

  topMenu.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-topmenu-close]")) closeTopMenu();
    const link = target.closest("a[href]");
    if (link) closeTopMenu();
  });

  // Legacy nav toggle fallback (if drawer isn't present)
  if (burger && nav && !document.querySelector(".top-menu")) {
    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
      nav.classList.toggle("nav-open", !expanded);
    });
  }

  // Header dropdowns: only one open at a time (drawer can stay expanded)
  const headerDropdowns = Array.from(document.querySelectorAll(".main-nav details.nav-dd"));
  const closeAllHeaderDropdowns = (exceptEl = null) => {
    headerDropdowns.forEach(d => {
      if (d !== exceptEl) d.removeAttribute("open");
    });
  };

  headerDropdowns.forEach(d => {
    d.addEventListener("toggle", () => {
      if (d.open) closeAllHeaderDropdowns(d);
    });
  });

  document.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const clickedInsideNav = Boolean(target.closest(".main-nav, .drawer-nav"));
    if (!clickedInsideNav) closeAllDropdowns();
  });

  // Footer/header popups
  const modal = document.querySelector("#site-modal");
  const modalTitle = document.querySelector("#modal-title");
  const modalBody = document.querySelector("#modal-body");
  const modalClose = document.querySelector(".modal-close");
  const popupTriggers = document.querySelectorAll("[data-popup]");

  // Contact form overlay (CodePen-like behavior, no jQuery)
  const bindContactCloseHandlers = root => {
    const scope = root instanceof Element ? root : document;
    const bindClose = el => {
      if (!(el instanceof Element)) return;
      if (el.dataset.boundClose === "true") return;
      const handler = e => {
        try {
          if (e && typeof e.preventDefault === "function") e.preventDefault();
          if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        } catch {}
        closeContactOverlay();
      };
      el.addEventListener("pointerdown", handler, { capture: true });
      el.addEventListener("touchstart", handler, { capture: true, passive: false });
      el.addEventListener("click", handler, { capture: true });
      el.dataset.boundClose = "true";
    };

    scope.querySelectorAll("[data-contact-close]").forEach(bindClose);
  };

  const ensureContactOverlay = () => {
    const existing = document.querySelector("#contact-form-container");
    if (existing) {
      bindContactCloseHandlers(document.querySelector(".contact-form-wrap") || document.body);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "contact-form-wrap";
    const quickTags =
      LANG === "en"
        ? [
            {
              id: "tech",
              label: "#learn-technology",
              title: "About the technology",
              answer: "GEO/AEO is about making your content easy to retrieve and quote by AI systems.",
              href: "methods/geo.html"
            },
            {
              id: "promo",
              label: "#ai-promotion",
              title: "Promotion in neural networks",
              answer: "We build a system: intent → pages → trust signals → distribution → measurement.",
              href: "strategy/strategic-intent.html"
            },
            {
              id: "aeo",
              label: "#what-is-aeo",
              title: "What is AEO",
              answer: "Answer Engine Optimization: structured pages that provide direct answers and are easy to cite.",
              href: "methods/aeo.html"
            },
            {
              id: "services",
              label: "#services",
              title: "Services",
              answer: "Audit, strategy, content production, implementation and support for AI visibility.",
              href: "tools/full-promotion.html"
            },
            {
              id: "contacts",
              label: "#contacts",
              title: "Contacts",
              answer: "Phone and quick request form. We respond as soon as possible.",
              href: "about.html#kompaniya-kontakty"
            },
            {
              id: "request",
              label: "#leave-a-request",
              title: "Leave a request",
              answer: "Leave your phone/email and a short comment — we’ll contact you.",
              href: "#form"
            },
            {
              id: "company",
              label: "#company",
              title: "About the company",
              answer: "Who we are, how we work and what you get from cooperation.",
              href: "about.html"
            }
          ]
        : [
            {
              id: "tech",
              label: "#узнать-о-технологии",
              title: "Узнать о технологии",
              answer: "GEO/AEO — это про цитируемость и извлекаемость: чтобы AI‑системы выбирали и цитировали ваш сайт.",
              href: "methods/geo.html"
            },
            {
              id: "promo",
              label: "#продвижение-в-нейросетях",
              title: "Продвижение в нейросетях",
              answer: "Строим систему: интенты → страницы → доверие → дистрибуция → измерение результата.",
              href: "strategy/strategic-intent.html"
            },
            {
              id: "aeo",
              label: "#что-такое-aeo",
              title: "Что такое AEO",
              answer: "Answer Engine Optimization: страницы‑ответы с коротким ответом, структурой и FAQ для систем ответа.",
              href: "methods/aeo.html"
            },
            {
              id: "services",
              label: "#услуги",
              title: "Услуги",
              answer: "Аудит, стратегия, контент, внедрение и сопровождение — полный цикл AI‑видимости.",
              href: "tools/full-promotion.html"
            },
            {
              id: "contacts",
              label: "#контакты",
              title: "Контакты",
              answer: "Телефон и быстрая заявка. Ответим в ближайшее время.",
              href: "about.html#kompaniya-kontakty"
            },
            {
              id: "request",
              label: "#оставить-заявку",
              title: "Оставить заявку",
              answer: "Оставьте телефон/почту и короткий комментарий — мы свяжемся.",
              href: "#form"
            },
            {
              id: "company",
              label: "#о-компании",
              title: "О компании",
              answer: "Кто мы, как работаем и что вы получаете от сотрудничества.",
              href: "about.html"
            }
          ];

    const tagsHtml = quickTags
      .map(
        (t, idx) =>
          `<button type="button" class="qtag ${idx === 0 ? "is-active" : ""}" data-qtag="${t.id}">${t.label}</button>`
      )
      .join("");

    wrap.innerHTML = `
      <div class="form-overlay" data-contact-close></div>
      <div id="contact-form-container" class="contact-form-container contact-form-container--quick" role="dialog" aria-modal="true" aria-label="${tr("contactFormAria")}">
        <button type="button" class="contact-form-close" data-contact-close aria-label="${LANG === "en" ? "Close" : "Закрыть"}">×</button>
        <div class="contact-quick">
          <div class="contact-quick__head">
            <h3 class="contact-quick__title">${tr("formTitle")}</h3>
            <p class="contact-quick__subtitle">${tr("formIntro")}</p>
          </div>
          <div class="contact-quick__tags" aria-label="Навигация">
            ${tagsHtml}
          </div>
          <div class="contact-quick__body">
            <div class="contact-quick__card" id="contact-quick-card">
              <div class="contact-quick__card-title"></div>
              <div class="contact-quick__card-text"></div>
              <a class="contact-quick__link btn btn-header btn-header--white" href="#" id="contact-quick-link">${LANG === "en" ? "Open article" : "Открыть статью"}</a>
            </div>

            <form id="contact-form" class="contact-quick__form" method="post" novalidate hidden>
              <input class="input phone" type="tel" name="user_phone" placeholder="${LANG === "en" ? "Phone" : "Телефон"}" required />
              <input class="input email" type="email" name="user_email" placeholder="${tr("yourEmail")}" required />
              <textarea class="input message" name="message" placeholder="${tr("yourMessage")}" required></textarea>
              <button class="btn input submit" type="submit">${tr("send")}</button>
              <p class="contact-quick__hint">
                ${
                  LANG === "en"
                    ? "To enable automatic emails on GitHub Pages, set a Formspree endpoint via <meta name=\"form-endpoint\" content=\"https://formspree.io/f/xxxxxxx\">."
                    : "Чтобы заявки автоматически приходили на почту на GitHub Pages, задайте Formspree endpoint через <meta name=\"form-endpoint\" content=\"https://formspree.io/f/xxxxxxx\">."
                }
              </p>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    bindContactCloseHandlers(wrap);

    // Wire up quick tags behavior
    const tagButtons = Array.from(wrap.querySelectorAll("[data-qtag]"));
    const card = wrap.querySelector("#contact-quick-card");
    const cardTitle = wrap.querySelector(".contact-quick__card-title");
    const cardText = wrap.querySelector(".contact-quick__card-text");
    const link = wrap.querySelector("#contact-quick-link");
    const form = wrap.querySelector("#contact-form");
    const endpointFromMeta = document.querySelector('meta[name="form-endpoint"]')?.getAttribute("content") || "";
    const resolvedEndpoint = endpointFromMeta || DEFAULT_FORM_ENDPOINT;
    if (form instanceof HTMLFormElement && resolvedEndpoint) {
      form.setAttribute("action", resolvedEndpoint);
    }

    const setActive = id => {
      tagButtons.forEach(b => b.classList.toggle("is-active", b.getAttribute("data-qtag") === id));
      const t = quickTags.find(x => x.id === id) || quickTags[0];
      if (cardTitle) cardTitle.textContent = t.title;
      if (cardText) cardText.textContent = t.answer;
      const isForm = t.href === "#form";
      if (form instanceof HTMLFormElement) form.hidden = !isForm;
      if (card instanceof Element) card.hidden = isForm;
      if (link instanceof HTMLAnchorElement) {
        const target = isForm ? "#" : t.href;
        const next = toLangUrl(target) || (isForm ? "#" : new URL(target, window.location.href).toString());
        link.href = next;
        link.style.display = isForm ? "none" : "inline-flex";
      }
    };

    tagButtons.forEach(btn => {
      btn.addEventListener("click", () => setActive(btn.getAttribute("data-qtag") || ""));
    });
    setActive(quickTags[0].id);
  };

  const isValidEmail = email => {
    const v = String(email || "").trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const openContactOverlay = () => {
    ensureContactOverlay();
    // Re-bind close handlers every open (webviews can drop events)
    bindContactCloseHandlers(document.querySelector(".contact-form-wrap") || document.body);
    document.body.classList.add("show-form-overlay");
    document.body.classList.remove("form-submitted");
    const head = document.querySelector("#contact-form-head");
    if (head) head.classList.remove("form-submitted");
    const container = document.querySelector("#contact-form-container");
    const content = document.querySelector("#contact-form-content");
    if (container) container.classList.add("expand");
    if (content) content.classList.add("expand");
  };

  const closeContactOverlay = () => {
    const container = document.querySelector("#contact-form-container");
    const content = document.querySelector("#contact-form-content");
    if (content) content.classList.remove("expand");
    if (container) container.classList.remove("expand");
    document.body.classList.remove("show-form-overlay");
    document.body.classList.remove("form-submitted");
  };

  const popupContent = {
    contacts: {
      title: tr("contacts"),
      body: `
        <p>ИП Комарова</p>
        <p>${LANG === "en" ? "Phone" : "Телефон"}: <a href="tel:89060959296">8 906 095-92-96</a></p>
      `
    },
    privacy: {
      title: tr("privacy"),
      body: `
        <p>${tr("popupPrivacyBody1")}</p>
        <p>${tr("popupPrivacyBody2")}</p>
      `
    },
    consent: {
      title: tr("consent"),
      body: `
        <p>${tr("popupConsentBody1")}</p>
        <p>${tr("popupConsentBody2")}</p>
      `
    },
    terms: {
      title: tr("terms"),
      body: `
        <p>${tr("popupTermsBody1")}</p>
        <p>${tr("popupTermsBody2")}</p>
      `
    }
  };

  const openModal = key => {
    if (key === "contacts") {
      openContactOverlay();
      return;
    }
    if (!modal || !modalTitle || !modalBody || !popupContent[key]) return;
    modalTitle.textContent = popupContent[key].title;
    modalBody.innerHTML = popupContent[key].body;
    modal.hidden = false;
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
  };

  popupTriggers.forEach(trigger => {
    trigger.addEventListener("click", e => {
      e.preventDefault();
      openModal(trigger.getAttribute("data-popup"));
    });
  });

  document.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-contact-close]")) closeContactOverlay();
  });
  // Extra fallback for mobile webviews that don't fire click reliably
  document.addEventListener(
    "pointerup",
    e => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-contact-close]")) closeContactOverlay();
    },
    { capture: true }
  );

  document.addEventListener("submit", e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "contact-form") return;
    e.preventDefault();

    const name = form.querySelector('input[name="user_name"]');
    const email = form.querySelector('input[name="user_email"]');
    const phone = form.querySelector('input[name="user_phone"]');
    const message = form.querySelector('textarea[name="message"]');
    const fields = [name, email, phone, message].filter(Boolean);

    fields.forEach(el => el.classList.remove("form-error"));

    let hasError = false;
    if (name && !String(name.value || "").trim()) { name.classList.add("form-error"); hasError = true; }
    if (email && !isValidEmail(email.value)) { email.classList.add("form-error"); hasError = true; }
    if (message && !String(message.value || "").trim()) { message.classList.add("form-error"); hasError = true; }

    if (hasError) return;

    const endpoint =
      form.getAttribute("action") ||
      document.querySelector('meta[name="form-endpoint"]')?.getAttribute("content") ||
      DEFAULT_FORM_ENDPOINT ||
      "";

    const payload = {
      name: name ? String(name.value || "").trim() : "",
      email: email ? String(email.value || "").trim() : "",
      phone: phone ? String(phone.value || "").trim() : "",
      message: message ? String(message.value || "").trim() : "",
      page: window.location.href
    };

    const setSubmittedUi = () => {
      document.body.classList.add("form-submitted");
      const head = document.querySelector("#contact-form-head");
      if (head) head.classList.add("form-submitted");
      window.setTimeout(() => {
        form.reset();
        closeContactOverlay();
        document.body.classList.remove("form-submitted");
        if (head) head.classList.remove("form-submitted");
      }, 1400);
    };

    const fallbackMailto = () => {
      const subject = encodeURIComponent("Заявка с сайта");
      const body = encodeURIComponent(
        `Имя: ${payload.name}\nEmail: ${payload.email}\nТелефон: ${payload.phone}\n\nСообщение:\n${payload.message}\n\nСтраница:\n${payload.page}\n`
      );
      window.location.href = `mailto:anastkomarova@yandex.ru?subject=${subject}&body=${body}`;
      setSubmittedUi();
    };

    if (!endpoint || !/^https?:\/\//i.test(endpoint)) {
      fallbackMailto();
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error("bad response");
        setSubmittedUi();
      })
      .catch(() => fallbackMailto());
  });

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal();
      closeContactOverlay();
      closeTopMenu();
    }
  });

  const visibilitySections = Array.from(document.querySelectorAll(".visibility-section"));
  visibilitySections.forEach(visibilitySection => {
    // Static centered ring
    visibilitySection.style.setProperty("--ring-x", "50");
    visibilitySection.style.setProperty("--ring-y", "50");
  });

  // Industries: CodePen-like expanding cards
  const optionsRoot = document.querySelector(".industry-options .options");
  if (optionsRoot) {
    const options = Array.from(optionsRoot.querySelectorAll(".option"));
    const setActive = next => {
      options.forEach(o => o.classList.toggle("active", o === next));
    };

    options.forEach(opt => {
      opt.tabIndex = 0;
      opt.addEventListener("click", () => setActive(opt));
      opt.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(opt);
        }
      });
    });
  }

  // Brands slider
  const brandButtons = document.querySelectorAll(".brands-nav-item");
  const brandSlides = document.querySelectorAll(".brand-slide");

  if (brandButtons.length && brandSlides.length) {
    brandButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-brand");

        brandButtons.forEach(btn =>
          btn.classList.toggle("is-active", btn === button)
        );

        brandSlides.forEach(slide =>
          slide.classList.toggle(
            "is-active",
            slide.getAttribute("data-brand") === targetId
          )
        );
      });
    });
  }

  // Platforms slider (Как мы работаем)
  const platformButtons = document.querySelectorAll(".platforms-nav-item");
  const platformSlides = document.querySelectorAll(".platform-slide");

  if (platformButtons.length && platformSlides.length) {
    platformButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-platform");

        platformButtons.forEach(btn =>
          btn.classList.toggle("is-active", btn === button)
        );

        platformSlides.forEach(slide =>
          slide.classList.toggle(
            "is-active",
            slide.getAttribute("data-platform") === targetId
          )
        );
      });
    });
  }

  // Advanced reveal animation system
  const revealTargets = document.querySelectorAll(
    ".hero-content, .visibility-card, .platforms-content, .brands-header, .brand-slide.is-active, .faq-list details, .footer-inner"
  );

  revealTargets.forEach((el, index) => {
    el.classList.add("js-reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 70, 560)}ms`);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("is-visible"));
  }

  // CodePen-inspired typewriter reveal for key headings
  const typewriterTargets = document.querySelectorAll(
    ".section-header h2, .platform-slide h3, .brand-content h3"
  );

  typewriterTargets.forEach((el, index) => {
    el.classList.add("js-typewriter");
    el.style.setProperty("--tw-duration", `${1100 + Math.min(index * 40, 500)}ms`);
  });

  const runTypewriter = el => {
    el.classList.remove("is-typed");
    // restart animation reliably
    void el.offsetWidth;
    el.classList.add("is-typed");
  };

  if ("IntersectionObserver" in window) {
    const typewriterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runTypewriter(entry.target);
            typewriterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    typewriterTargets.forEach(el => typewriterObserver.observe(el));
  } else {
    typewriterTargets.forEach(runTypewriter);
  }

  // Re-animate active brand slide on switch
  if (brandButtons.length && brandSlides.length) {
    brandButtons.forEach(button => {
      button.addEventListener("click", () => {
        const active = document.querySelector(".brand-slide.is-active");
        if (active) {
          active.classList.remove("is-visible");
          requestAnimationFrame(() => active.classList.add("is-visible"));

          const brandTitle = active.querySelector("h3");
          if (brandTitle && brandTitle.classList.contains("js-typewriter")) {
            runTypewriter(brandTitle);
          }
        }
      });
    });
  }

  if (platformButtons.length && platformSlides.length) {
    platformButtons.forEach(button => {
      button.addEventListener("click", () => {
        const activePlatform = document.querySelector(".platform-slide.is-active h3");
        if (activePlatform && activePlatform.classList.contains("js-typewriter")) {
          runTypewriter(activePlatform);
        }
      });
    });
  }

  // Ensure every article card link has an arrow CTA
  const ensureArticleCardArrows = () => {
    const cards = Array.from(document.querySelectorAll("a.article-card"));
    cards.forEach(card => {
      if (card.classList.contains("article-card--no-link")) return;
      if (card.querySelector(".article-card__cta")) return;

      let bottom = card.querySelector(".article-card__bottom");
      if (!bottom) {
        bottom = document.createElement("div");
        bottom.className = "article-card__bottom";
        card.appendChild(bottom);
      }

      const cta = document.createElement("span");
      cta.className = "article-card__cta article-card__cta--icon";
      cta.setAttribute("aria-hidden", "true");
      cta.innerHTML = `
        <svg class="article-card__cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
          <path d="M5 12h12"></path>
          <path d="M13 6l6 6-6 6"></path>
        </svg>
      `;
      bottom.appendChild(cta);
    });
  };

  ensureArticleCardArrows();

  // Assign depth classes for advanced parallax motion
  const depth1 = document.querySelectorAll(".hero-content, .platforms-content");
  const depth2 = document.querySelectorAll(".brand-slide.is-active, .platform-slide.is-active");
  const depth3 = document.querySelectorAll(".logo-text, .header-cta");
  depth1.forEach(el => el.classList.add("fx-depth-1"));
  depth2.forEach(el => el.classList.add("fx-depth-2"));
  depth3.forEach(el => el.classList.add("fx-depth-3"));

  // Non-standard motion engine: hybrid mouse + scroll parallax
  const fxNodes = [
    ...document.querySelectorAll(".fx-depth-1, .fx-depth-2, .fx-depth-3")
  ];
  if (fxNodes.length) {
    let mx = 0;
    let my = 0;
    let sy = window.scrollY || 0;

    window.addEventListener("mousemove", e => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mx = (e.clientX - cx) / cx;
      my = (e.clientY - cy) / cy;
    });

    window.addEventListener("scroll", () => {
      sy = window.scrollY || 0;
    }, { passive: true });

    const tick = () => {
      fxNodes.forEach(node => {
        let depth = 1;
        if (node.classList.contains("fx-depth-2")) depth = 2;
        if (node.classList.contains("fx-depth-3")) depth = 3;

        const dx = mx * (3 * depth);
        const dy = my * (2.2 * depth) + (sy * 0.002 * depth);
        node.style.setProperty("--fx-x", `${dx.toFixed(2)}px`);
        node.style.setProperty("--fx-y", `${dy.toFixed(2)}px`);
      });
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
});

