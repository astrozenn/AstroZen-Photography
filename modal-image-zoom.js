document.addEventListener("DOMContentLoaded", () => {
    const modal = document.querySelector(".img-zoom-modal");
    if (!modal) return;

    const modalImg = modal.querySelector(".img-zoom-img");
    const closeBtn = modal.querySelector(".img-zoom-close");
    const buttons = document.querySelectorAll(".testimonial-attachment-btn[data-full-src]");

    const openModal = (src, alt = "") => {
        modalImg.src = src;
        modalImg.alt = alt;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modalImg.src = "";
        modalImg.alt = "";
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("open");
        document.body.style.overflow = "";
    };

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const src = btn.getAttribute("data-full-src");
            const img = btn.querySelector("img");
            openModal(src, img?.alt || "");
        });
    });

    closeBtn?.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const isOpen = modal.getAttribute("aria-hidden") === "false" || modal.classList.contains("open");
            if (isOpen) closeModal();
        }
    });
});

