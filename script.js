document.addEventListener("DOMContentLoaded", function() {
    const basePrice = 0;
    const priceEl = document.getElementById("price");
    const personalForm = document.getElementById("personal-form");
    const personalInputs = personalForm ? personalForm.querySelectorAll("input[type='checkbox'], input[type='radio']") : [];
    const forms = document.querySelectorAll(".package-form");

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

    updatePrice();
});
