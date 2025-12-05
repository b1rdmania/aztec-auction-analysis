// Basic interaction or data loading can go here.
// For now, the artifact is static based on the analysis results found in the previous step.

console.log("Aztec Intelligence Dashboard Loaded");

// Data is now statically injected by the build script (src/index.ts).
// No client-side fetching required.

// Modal Logic
const modal = document.getElementById('methodology-modal');
const overlay = document.getElementById('modal-overlay');
const openBtn = document.getElementById('open-methodology');
const closeBtn = document.getElementById('close-modal');

if (openBtn && modal && overlay && closeBtn) {
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        overlay.classList.add('active');
    });

    function closeModal() {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
} else {
    console.error("Modal elements not found!");
}

// Countdown Logic
// Target: Dec 6th 9pm GMT 2025
const targetDate = new Date('2025-12-06T21:00:00Z').getTime();
const timerElement = document.getElementById('time-remaining');

function updateCountdown() {
    if (!timerElement) return;

    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        timerElement.innerHTML = "AUCTION ENDED";
        timerElement.style.color = "var(--color-ink)";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Format: 01d 04h 20m 33s
    timerElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call

