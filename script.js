// Мобильное меню (без анимаций пролистывания)
document.addEventListener("DOMContentLoaded", () => {
  // Ring particles around the visibility paragraph (CodePen-inspired)
  if ("paintWorklet" in CSS) {
    CSS.paintWorklet
      .addModule("https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js")
      .catch(() => {});
  }

  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");

  // Footer sitemap (same on all pages)
  const scriptEl = document.querySelector('script[src$="script.js"]');
  const prefix = scriptEl
    ? (scriptEl.getAttribute("src") || "").replace(/script\.js(\?.*)?$/, "")
    : "";

  const sitemapHtml = `
    <div class="footer-sitemap" aria-label="Структура сайта">
      <div class="footer-col">
        <div class="footer-col__title">Методы</div>
        <a href="${prefix}methods/geo.html">GEO оптимизация</a>
        <a href="${prefix}methods/aeo.html">AEO оптимизация</a>
        <a href="${prefix}methods/seo.html">SEO оптимизация</a>
        <a href="${prefix}methods/ai-smm.html">AI &amp; SMM</a>
        <a href="${prefix}methods/faq-methods.html">FAQ по методам</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Сравнения</div>
        <a href="${prefix}comparisons/geo-vs-seo.html">GEO vs SEO</a>
        <a href="${prefix}comparisons/geo-vs-aeo.html">GEO vs AEO</a>
        <a href="${prefix}comparisons/aeo-vs-seo.html">AEO vs SEO</a>
        <a href="${prefix}comparisons/full-comparison.html">Полное сравнение</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Нейроплатформы</div>
        <a href="${prefix}neural-platforms/chatgpt.html">ChatGPT</a>
        <a href="${prefix}neural-platforms/perplexity.html">Perplexity</a>
        <a href="${prefix}neural-platforms/deepseek.html">DeepSeek</a>
        <a href="${prefix}neural-platforms/claude.html">Claude</a>
        <a href="${prefix}neural-platforms/google-gemini.html">Google Gemini</a>
        <a href="${prefix}neural-platforms/yandex-alice.html">Яндекс Алиса</a>
        <a href="${prefix}neural-platforms/platform-comparison.html">Сравнение платформ</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Инструменты</div>
        <a href="${prefix}tools/ai-tools.html">AI‑инструменты</a>
        <a href="${prefix}tools/analytics.html">Аналитика</a>
        <a href="${prefix}tools/checklists.html">Чеклисты</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Стратегия</div>
        <a href="${prefix}strategy/overview.html">Общий обзор</a>
        <a href="${prefix}strategy/unified-system.html">Единая система</a>
        <a href="${prefix}strategy/ai-contextual.html">AI и контекст</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Кейсы</div>
        <a href="${prefix}case-studies/corporations.html">Корпорации</a>
        <a href="${prefix}case-studies/ecommerce.html">E‑commerce</a>
        <a href="${prefix}case-studies/saas.html">SaaS &amp; digital</a>
        <a href="${prefix}case-studies/local-business.html">Локальный бизнес</a>
        <a href="${prefix}case-studies/ai-discovery.html">AI‑discovery лидеры</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Ещё</div>
        <a href="${prefix}blog/main.html">Блог</a>
        <a href="${prefix}faq.html">FAQ</a>
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
          <p>(/) © 2026</p>
          <div class="footer-meta">
            <a href="#" data-popup="privacy">Политика конфиденциальности</a>
            <a href="#" data-popup="consent">Согласие на обработку данных</a>
          </div>
        </div>
      </div>
    `;
  }

  // Top mega menu (overlay)
  const header = document.querySelector("header.site-header");
  const topMenu = document.createElement("div");
  topMenu.className = "top-menu";
  topMenu.hidden = true;
  topMenu.innerHTML = `
    <div class="top-menu__backdrop" data-topmenu-close></div>
    <div class="top-menu__panel" role="dialog" aria-modal="true" aria-label="Меню сайта">
      <div class="top-menu__header">
        <div class="top-menu__title">Меню</div>
        <button class="top-menu__close" type="button" data-topmenu-close aria-label="Закрыть меню">×</button>
      </div>
      <div class="top-menu__content">
        ${sitemapHtml}
      </div>
    </div>
  `;

  if (header && !document.querySelector(".top-menu")) {
    header.insertAdjacentElement("afterend", topMenu);
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
    const months = [
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
    p.textContent = `Обновлено: ${formatUpdateDate()}`;
    pageH1.insertAdjacentElement("afterend", p);
  };

  const ensureLeadAndShortAnswer = () => {
    if (!sectionHeader || !pageH1) return;
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

    if (!article) return;
    if (article.querySelector(".short-answer")) return;

    const firstP = article.querySelector("p");
    const text = firstP ? firstP.textContent.trim().replace(/\s+/g, " ") : "";
    const short = document.createElement("div");
    short.className = "short-answer";
    short.innerHTML = `<strong>Коротко:</strong> ${text || "Ниже — ответы на ключевые вопросы и структура, которую нейросети удобно цитируют."}`;
    article.insertAdjacentElement("afterbegin", short);
  };

  const buildTOCAndIds = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (h2s.length < 2) return;

    const toc = document.createElement("div");
    toc.className = "content-toc";
    toc.setAttribute("aria-label", "Содержание");

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

      let ansText = "";
      let el = h2.nextElementSibling;
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

    // Fixed date requested (can be changed later to per-page values)
    const date = "2026-04-08";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline,
      description,
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
      { href: `${prefix}comparisons/full-comparison.html`, label: "Сравнение всех методов", kw: ["vs", "сравнен", "выбрать"] },
      { href: `${prefix}tools/checklists.html`, label: "Чеклисты (2026)", kw: ["чеклист", "шаг", "план"] },
      { href: `${prefix}case-studies/local-business.html`, label: "Кейсы локального бизнеса", kw: ["локальн", "карты", "рядом"] }
    ];

    h2s.forEach(h2 => {
      const already = h2.parentElement?.querySelector?.(`.read-also[data-for="${h2.id}"]`);
      if (already) return;
      const text = h2.textContent.toLowerCase();
      const picked = candidates
        .filter(c => c.kw.some(k => text.includes(k)))
        .slice(0, 2);
      if (!picked.length) return;

      const box = document.createElement("p");
      box.className = "read-also";
      box.dataset.for = h2.id || "";
      box.innerHTML =
        `<strong>Читайте также:</strong> ` +
        picked.map(p => `<a href="${p.href}">${p.label}</a>`).join(" | ");

      const insertAfter = h2.nextElementSibling;
      if (insertAfter) insertAfter.insertAdjacentElement("afterend", box);
      else h2.insertAdjacentElement("afterend", box);
    });
  };

  ensureUpdateDate();
  ensureLeadAndShortAnswer();
  buildTOCAndIds();
  injectReadAlsoLinks();
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

  const popupContent = {
    contacts: {
      title: "Контакты",
      body: `
        <p>ИП Комарова</p>
        <p>Телефон: <a href="tel:89060959296">8 906 095-92-96</a></p>
      `
    },
    privacy: {
      title: "Политика конфиденциальности",
      body: `
        <p>Мы обрабатываем персональные данные только для связи по заявкам и оказания услуг.</p>
        <p>Данные не передаются третьим лицам без законных оснований и хранятся в защищенном виде.</p>
      `
    },
    consent: {
      title: "Согласие на обработку данных",
      body: `
        <p>Оставляя данные на сайте, вы даете согласие на обработку персональных данных в целях обратной связи и оказания услуг.</p>
        <p>Вы можете отозвать согласие, направив запрос по контактному номеру, указанному в разделе «Контакты».</p>
      `
    },
    terms: {
      title: "Условия использования",
      body: `
        <p>Используя сайт, вы соглашаетесь с условиями обработки информации и правилами взаимодействия.</p>
        <p>Материалы сайта носят информационный характер и не являются публичной офертой.</p>
      `
    }
  };

  const openModal = key => {
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
      closeTopMenu();
    }
  });

  const visibilitySection = document.querySelector(".visibility-section");
  if (visibilitySection) {
    if ("paintWorklet" in CSS) {
      visibilitySection.style.backgroundImage = "paint(ring-particles)";
    }

    // Static centered ring
    visibilitySection.style.setProperty("--ring-x", "50");
    visibilitySection.style.setProperty("--ring-y", "50");
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

