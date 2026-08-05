document.addEventListener("DOMContentLoaded", function() {
    const basePrice = 0;
    const priceEl = document.getElementById("price");
    const personalForm = document.getElementById("personal-form");
    const personalInputs = personalForm ? personalForm.querySelectorAll("input[type='checkbox'], input[type='radio']") : [];
    const majoratForm = document.getElementById("majorat-form");
    const majoratHoursInput = document.getElementById("majorat-hours");
    const majoratHoursReadout = document.getElementById("majorat-hours-readout");
    const majoratPriceEl = document.getElementById("majorat-price");
    const majoratLocationInput = document.getElementById("majorat-location");
    const majoratLocationButton = document.getElementById("majorat-location-btn");
    const majoratLocationUnknown = document.getElementById("majorat-location-unknown");
    const majoratLocationSuggestions = document.getElementById("majorat-location-suggestions");
    const majoratDistanceText = document.getElementById("majorat-distance-text");
    const majoratDistanceCost = document.getElementById("majorat-distance-cost");
    const majoratDiscountCodeInput = document.getElementById("majorat-discount-code");
    const majoratDiscountButton = document.getElementById("majorat-discount-btn");
    const majoratDiscountStatus = document.getElementById("majorat-discount-status");
    const majoratButtons = majoratForm ? majoratForm.querySelectorAll(".counter-btn") : [];
    const majoratInputs = majoratForm ? majoratForm.querySelectorAll("input[type='checkbox'], input[type='radio']") : [];
    const forms = document.querySelectorAll(".package-form");
    const contactForm = document.getElementById("contact-form");
    const baseVenue = { lat: 45.26609, lon: 27.95552 };
    const distanceRate = 2;
    let majoratDistanceKm = 0;
    let majoratDistanceFee = 0;
    let locationSearchTimeout = null;
    let autocompleteResults = [];
    let selectedLocationCoordinates = null;
    let appliedDiscount = {
        code: '',
        percent: 0,
        value: 0
    };

    function getBasePrice(form) {
        if (!form) {
            return basePrice;
        }
        const baseInput = form.querySelector('input[name="basePrice"]');
        return baseInput ? Number(baseInput.value) : basePrice;
    }

    function updatePrice() {
        const total = getBasePrice(personalForm) + Array.from(personalInputs).reduce((sum, input) => {
            return sum + (input.checked ? Number(input.value) : 0);
        }, 0);

        if (priceEl) {
            priceEl.textContent = total;
        }
        return total;
    }

    function getSelectedOptions(form) {
        const inputs = form ? form.querySelectorAll("input[type='checkbox'], input[type='radio']") : [];
        return Array.from(inputs)
            .filter((input) => input.checked)
            .map((input) => {
                const label = input.closest("label");
                return label ? label.textContent.trim() : input.value;
            })
            .join("; ") || "Nicio opțiune selectată";
    }

    function haversineDistanceKm(lat1, lon1, lat2, lon2) {
        const toRadians = (value) => (value * Math.PI) / 180;
        const earthRadiusKm = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    function updateDistanceLabels() {
        if (majoratDistanceText) {
            majoratDistanceText.textContent = `Distanță: ${majoratDistanceKm.toFixed(1)} km`;
        }

        if (majoratDistanceCost) {
            majoratDistanceCost.textContent = `Taxă kilometraj: ${majoratDistanceFee.toFixed(2)} lei`;
        }
    }

    function clearLocationSuggestions() {
        if (majoratLocationSuggestions) {
            majoratLocationSuggestions.innerHTML = '';
            majoratLocationSuggestions.classList.add('hidden');
        }
        autocompleteResults = [];
    }

    function renderLocationSuggestions(results) {
        if (!majoratLocationSuggestions) {
            return;
        }

        if (!Array.isArray(results) || !results.length) {
            clearLocationSuggestions();
            return;
        }

        majoratLocationSuggestions.innerHTML = '';
        results.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'location-suggestion-item';
            button.textContent = item.display_name;
            button.addEventListener('click', function() {
                if (majoratLocationInput) {
                    majoratLocationInput.value = item.display_name;
                }
                selectedLocationCoordinates = {
                    lat: Number(item.lat),
                    lon: Number(item.lon)
                };
                clearLocationSuggestions();
            });
            majoratLocationSuggestions.appendChild(button);
        });

        majoratLocationSuggestions.classList.remove('hidden');
    }

    function normalizeLocationQuery(query) {
        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) {
            return '';
        }

        return trimmedQuery
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function buildLocationSearchUrl(query, limit = 5) {
        const normalizedQuery = normalizeLocationQuery(query);
        return `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=ro&limit=${limit}&q=${encodeURIComponent(normalizedQuery)}`;
    }

    async function fetchRoadDistanceKm(destination) {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${baseVenue.lon},${baseVenue.lat};${destination.lon},${destination.lat}?overview=false`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Road routing failed');
        }

        const data = await response.json();
        const distanceMeters = data?.routes?.[0]?.distance;
        if (typeof distanceMeters !== 'number') {
            throw new Error('Road routing response invalid');
        }

        return Number((distanceMeters / 1000).toFixed(1));
    }

    async function fetchLocationSuggestions(query) {
        const trimmedQuery = (query || '').trim();
        const normalizedQuery = normalizeLocationQuery(trimmedQuery);
        if (!normalizedQuery || normalizedQuery.length < 3) {
            clearLocationSuggestions();
            return;
        }

        try {
            const response = await fetch(buildLocationSearchUrl(normalizedQuery, 5), {
                headers: {
                    'Accept-Language': 'ro'
                }
            });

            if (!response.ok) {
                throw new Error('Suggestions failed');
            }

            const data = await response.json();
            autocompleteResults = Array.isArray(data) ? data
                .map((item) => ({
                    display_name: item.display_name,
                    lat: Number(item.lat),
                    lon: Number(item.lon)
                }))
                .filter((item) => item.display_name) : [];

            renderLocationSuggestions(autocompleteResults);
        } catch (error) {
            clearLocationSuggestions();
        }
    }

    function resetDistancePricing() {
        selectedLocationCoordinates = null;
        majoratDistanceKm = 0;
        majoratDistanceFee = 0;
        updateDistanceLabels();
        updateMajoratPrice();
    }

    async function calculateDistance() {
        if (!majoratLocationInput) {
            return;
        }

        if (majoratLocationUnknown && majoratLocationUnknown.checked) {
            resetDistancePricing();
            return;
        }

        const locationValue = majoratLocationInput.value.trim();
        const normalizedLocationValue = normalizeLocationQuery(locationValue);
        if (!normalizedLocationValue) {
            selectedLocationCoordinates = null;
            majoratDistanceKm = 0;
            majoratDistanceFee = 0;
            updateDistanceLabels();
            updateMajoratPrice();
            return;
        }

        try {
            let destination = selectedLocationCoordinates;

            if (!destination) {
                const response = await fetch(buildLocationSearchUrl(normalizedLocationValue, 1), {
                    headers: {
                        'Accept-Language': 'ro'
                    }
                });

                if (!response.ok) {
                    throw new Error('Request failed');
                }

                const data = await response.json();
                if (!Array.isArray(data) || !data.length) {
                    throw new Error('Address not found');
                }

                destination = {
                    lat: Number(data[0].lat),
                    lon: Number(data[0].lon)
                };
                selectedLocationCoordinates = destination;
            }

            const roadDistanceKm = await fetchRoadDistanceKm(destination);
            majoratDistanceKm = roadDistanceKm;
            majoratDistanceFee = Number((majoratDistanceKm * distanceRate).toFixed(2));
            updateDistanceLabels();
            updateMajoratPrice();
        } catch (error) {
            if (selectedLocationCoordinates) {
                majoratDistanceKm = haversineDistanceKm(
                    baseVenue.lat,
                    baseVenue.lon,
                    Number(selectedLocationCoordinates.lat),
                    Number(selectedLocationCoordinates.lon)
                );
            } else {
                majoratDistanceKm = 0;
            }
            majoratDistanceFee = Number((majoratDistanceKm * distanceRate).toFixed(2));
            updateDistanceLabels();
            updateMajoratPrice();
        }
    }

    function updateMajoratPrice() {
        if (!majoratForm || !majoratHoursInput || !majoratPriceEl) {
            return 0;
        }

        const base = getBasePrice(majoratForm);
        const extraHours = Number(majoratHoursInput.value) || 0;
        const optionsTotal = Array.from(majoratInputs).reduce((sum, input) => {
            return sum + (input.checked ? Number(input.value) : 0);
        }, 0);
        const subtotal = base + extraHours * 100 + optionsTotal + majoratDistanceFee;
        const discountAmount = Math.round((subtotal * (appliedDiscount.percent || 0)) / 100);
        const total = Math.max(0, subtotal - discountAmount);

        appliedDiscount.value = discountAmount;
        majoratPriceEl.textContent = total;
        updateDiscountStatus();
        return total;
    }

    function updateDiscountStatus() {
        if (!majoratDiscountStatus) {
            return;
        }

        if (appliedDiscount.code && appliedDiscount.percent > 0) {
            majoratDiscountStatus.textContent = `Reducere: ${appliedDiscount.code} (-${appliedDiscount.percent}%)`;
        } else {
            majoratDiscountStatus.textContent = 'Reducere: nicio reducere aplicată';
        }
    }
async function applyDiscountCode() {
    if (!majoratDiscountCodeInput || !majoratForm) {
        return;
    }

    const code = (majoratDiscountCodeInput.value || '').trim().toUpperCase();

    const emailInput = majoratForm.querySelector("[name='email']");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";


    if (!code) {
        appliedDiscount = {
            code: '',
            percent: 0,
            value: 0
        };

        updateDiscountStatus();
        updateMajoratPrice();
        return;
    }


    try {

        const response = await fetch("/api/discount/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                email
            })
        });


        const result = await response.json();


        if (!response.ok || !result.valid) {

            appliedDiscount = {
                code: '',
                percent: 0,
                value: 0
            };

            majoratDiscountStatus.textContent =
                `Reducere: ${result.error || "Cod invalid"}`;

            updateMajoratPrice();

            return;
        }


        appliedDiscount = {
            code: result.code,
            percent: Number(result.percent || 0),
            value: 0
        };


        updateDiscountStatus();
        updateMajoratPrice();


    } catch (error) {

        console.error("Discount error:", error);

        appliedDiscount = {
            code: '',
            percent: 0,
            value: 0
        };

        majoratDiscountStatus.textContent =
            "Reducere: eroare la validarea codului";

        updateMajoratPrice();
    }
}
setMajoratHours(nextValue) {
        if (!majoratHoursInput || !majoratHoursReadout) {
            return;
        }

        const boundedValue = Math.min(5, Math.max(0, Number(nextValue) || 0));
        majoratHoursInput.value = boundedValue;
        majoratHoursReadout.textContent = boundedValue;
        updateMajoratPrice();
    }

    personalInputs.forEach((input) => {
        input.addEventListener("change", updatePrice);
    });

    if (majoratLocationButton && majoratLocationInput && majoratLocationSuggestions) {
        majoratLocationButton.addEventListener("click", calculateDistance);
        majoratLocationInput.addEventListener("input", function() {
            if (majoratLocationUnknown) {
                majoratLocationUnknown.checked = false;
            }
            window.clearTimeout(locationSearchTimeout);
            locationSearchTimeout = window.setTimeout(() => {
                fetchLocationSuggestions(majoratLocationInput.value);
            }, 500);
        });
        majoratLocationInput.addEventListener("keydown", function(event) {
            if (event.key === 'Escape') {
                clearLocationSuggestions();
            }
        });
    }

    if (majoratDiscountButton && majoratDiscountCodeInput) {
        majoratDiscountButton.addEventListener("click", applyDiscountCode);
        majoratDiscountCodeInput.addEventListener("keydown", function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                applyDiscountCode();
            }
        });
    }

    if (majoratLocationUnknown && majoratLocationInput) {
        majoratLocationUnknown.addEventListener("change", function() {
            if (this.checked) {
                majoratLocationInput.value = '';
                majoratLocationInput.disabled = true;
                clearLocationSuggestions();
                resetDistancePricing();
            } else {
                majoratLocationInput.disabled = false;
                resetDistancePricing();
            }
        });
    }

    document.addEventListener('click', function(event) {
        if (!majoratLocationInput || !majoratLocationSuggestions) {
            return;
        }

        if (!majoratLocationInput.contains(event.target) && !majoratLocationSuggestions.contains(event.target)) {
            clearLocationSuggestions();
        }
    });

    majoratButtons.forEach((button) => {
        button.addEventListener("click", function() {
            const direction = button.dataset.action === "increase" ? 1 : -1;
            const nextValue = Number(majoratHoursInput.value) + direction;
            setMajoratHours(nextValue);
        });
    });

    majoratInputs.forEach((input) => {
        input.addEventListener("change", updateMajoratPrice);
    });

    forms.forEach((form) => {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();

            const name = form.querySelector("[name='name']").value.trim();
            const email = form.querySelector("[name='email']").value.trim();
            const message = form.querySelector("[name='message']").value.trim();
            const packageName = form.querySelector("[name='package']").value;
            const fixedPrice = form.querySelector("[name='price']");

            let total;
            let selectedOptions = "N/A";

            if (form.id === "majorat-form") {
                total = updateMajoratPrice();
                selectedOptions = getSelectedOptions(form);
                const locationText = majoratLocationInput ? majoratLocationInput.value.trim() : "";
                const discountText = appliedDiscount.code ? `; Cod discount: ${appliedDiscount.code} (-${appliedDiscount.percent}%)` : '';
                selectedOptions += `; Locație: ${locationText || "Nu a fost furnizată"}; Distanță: ${majoratDistanceKm.toFixed(1)} km; Taxă kilometraj: ${majoratDistanceFee.toFixed(2)} lei${discountText}`;

if (appliedDiscount.code && appliedDiscount.percent > 0) {
    try {
        const redeemResponse = await fetch('/api/discount/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: appliedDiscount.code,
                email
            })
        });

        const redeemResult = await redeemResponse.json();

        if (!redeemResponse.ok) {
            alert(redeemResult.error || "Codul a fost deja folosit");
            return;
        }
    } catch (error) {
        console.log("Discount redeem failed:", error);
    }
}
            } else if (fixedPrice) {
                total = fixedPrice.value;
            } else {
                total = updatePrice();
                selectedOptions = getSelectedOptions(form);
            }

            const subject = encodeURIComponent(`Cerere ${packageName}`);
            const optionsLine = fixedPrice ? `` : `Opțiuni: ${selectedOptions}\n`;
            const body = encodeURIComponent(
                `Nume: ${name}\nEmail: ${email}\nPachet: ${packageName}\n${optionsLine}Total: ${total} Lei\n\nMesaj:\n${message}`
            );

            const mailtoLink = `mailto:astrozenphoto@gmail.com?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;
        });
    });

    const majoratBannerLink = document.querySelector('.packages-highlight-banner');
    if (majoratBannerLink) {
        majoratBannerLink.addEventListener('click', function(event) {
            event.preventDefault();
            const target = document.getElementById('majorat-configurator');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const name = contactForm.querySelector("[name='name']").value.trim();
            const email = contactForm.querySelector("[name='email']").value.trim();
            const message = contactForm.querySelector("[name='message']").value.trim();
            const subject = encodeURIComponent("Mesaj de pe site");
            const body = encodeURIComponent(`Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`);
            const mailtoLink = `mailto:astrozenphoto@gmail.com?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;
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
    updateMajoratPrice();
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