```
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

openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    overlay.style.display = 'block';
});

function closeModal() {
    modal.style.display = 'none';
    overlay.style.display = 'none';
}

closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

