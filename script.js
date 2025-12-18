// Мобильное меню (без анимаций пролистывания)
document.addEventListener("DOMContentLoaded", () => {
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
});

