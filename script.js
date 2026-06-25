document.addEventListener("DOMContentLoaded", function() {
    const basePrice = 300;
    const priceEl = document.getElementById("price");
    const checkboxes = document.querySelectorAll(".card input[type='checkbox']");
    const form = document.getElementById("contact-form");

    function updatePrice() {
        const total = basePrice + Array.from(checkboxes).reduce((sum, checkbox) => {
            return sum + (checkbox.checked ? Number(checkbox.value) : 0);
        }, 0);

        priceEl.textContent = total;
        return total;
    }

    function getSelectedOptions() {
        return Array.from(checkboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.parentElement.textContent.trim())
            .join("; ") || "Nicio opțiune selectată";
    }

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updatePrice);
    });

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = form.querySelector("[name='name']").value.trim();
        const email = form.querySelector("[name='email']").value.trim();
        const message = form.querySelector("[name='message']").value.trim();
        const packageName = form.querySelector("[name='package']").value;
        const total = updatePrice();
        const selectedOptions = getSelectedOptions();

        const subject = encodeURIComponent(`Cerere ${packageName}`);
        const body = encodeURIComponent(
            `Nume: ${name}\nEmail: ${email}\nPachet: ${packageName}\nOpțiuni: ${selectedOptions}\nTotal: ${total} Lei\n\nMesaj:\n${message}`
        );

        const mailtoLink = `mailto:astrozenphoto@gmail.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink);
    });

    updatePrice();
});
