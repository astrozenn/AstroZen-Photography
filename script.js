document.addEventListener("DOMContentLoaded", function() {
    const basePrice = 0;
    const priceEl = document.getElementById("price");
    const personalForm = document.getElementById("personal-form");
    const personalInputs = personalForm ? personalForm.querySelectorAll("input[type='checkbox'], input[type='radio']") : [];
    const forms = document.querySelectorAll(".package-form");
    const contactForm = document.getElementById("contact-form");

    function getBasePrice() {
        if (!personalForm) {
            return basePrice;
        }
        const baseInput = personalForm.querySelector('input[name="basePrice"]');
        return baseInput ? Number(baseInput.value) : basePrice;
    }

    function updatePrice() {
        const total = getBasePrice() + Array.from(personalInputs).reduce((sum, input) => {
            return sum + (input.checked ? Number(input.value) : 0);
        }, 0);

        if (priceEl) {
            priceEl.textContent = total;
        }
        return total;
    }

    function getSelectedOptions() {
        return Array.from(personalInputs)
            .filter((input) => input.checked)
            .map((input) => input.parentElement.textContent.trim())
            .join("; ") || "Nicio opțiune selectată";
    }

    personalInputs.forEach((input) => {
        input.addEventListener("change", updatePrice);
    });

    forms.forEach((form) => {
        form.addEventListener("submit", function(event) {
            event.preventDefault();

            const name = form.querySelector("[name='name']").value.trim();
            const email = form.querySelector("[name='email']").value.trim();
            const message = form.querySelector("[name='message']").value.trim();
            const packageName = form.querySelector("[name='package']").value;
            const fixedPrice = form.querySelector("[name='price']");

            let total;
            let selectedOptions = "N/A";

            if (fixedPrice) {
                total = fixedPrice.value;
            } else {
                total = updatePrice();
                selectedOptions = getSelectedOptions();
            }

            const subject = encodeURIComponent(`Cerere ${packageName}`);
            const optionsLine = fixedPrice ? `` : `Opțiuni: ${selectedOptions}\n`;
            const body = encodeURIComponent(
                `Nume: ${name}\nEmail: ${email}\nPachet: ${packageName}\n${optionsLine}Total: ${total} Lei\n\nMesaj:\n${message}`
            );

            const mailtoLink = `mailto:astrozenphoto@gmail.com?subject=${subject}&body=${body}`;
            window.open(mailtoLink);
        });
    });

    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const name = contactForm.querySelector("[name='name']").value.trim();
            const email = contactForm.querySelector("[name='email']").value.trim();
            const message = contactForm.querySelector("[name='message']").value.trim();
            const subject = encodeURIComponent("Mesaj de pe site");
            const body = encodeURIComponent(`Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`);
            const mailtoLink = `mailto:astrozenphoto@gmail.com?subject=${subject}&body=${body}`;
            window.open(mailtoLink);
        });
    }

    const hero = document.querySelector(".page-hero");
    if (hero) {
        const applyHeroBlur = () => {
            const progress = Math.min(1, Math.max(0, (window.scrollY - hero.offsetTop + 120) / Math.max(1, hero.offsetHeight - 220)));
            const blur = progress * 22;
            document.documentElement.style.setProperty("--hero-blur", `${blur}px`);
        };

        window.addEventListener("scroll", applyHeroBlur, { passive: true });
        window.addEventListener("resize", applyHeroBlur);
        applyHeroBlur();
    }

    updatePrice();
});

window.onload = function () {

    const images = document.querySelectorAll(".testimonial-attachment-img");
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const close = document.getElementById("close");

    images.forEach(image => {
        image.onclick = function () {
            lightbox.style.display = "flex";
            lightboxImage.src = this.src;
        };
    });

    close.onclick = function () {
        lightbox.style.display = "none";
    };

    lightbox.onclick = function (e) {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    };

};