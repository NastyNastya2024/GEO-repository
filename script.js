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

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
      nav.classList.toggle("nav-open", !expanded);
    });
  }

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

  // Ensure header "Контакты" opens the same footer contacts popup
  const headerContactsBtn = document.querySelector(".header-cta");
  if (headerContactsBtn) {
    headerContactsBtn.addEventListener("click", e => {
      e.preventDefault();
      openModal("contacts");
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
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

