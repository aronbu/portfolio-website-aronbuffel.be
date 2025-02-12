const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

// Matrix characters
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
const drops = [];
const fontSize = 10;
let columns = canvas.width / fontSize;

// Initialize drops
for (let i = 0; i < columns; i++) {
    drops[i] = 1;
}

// Draw function
function draw() {
    // Semi-transparent black rectangle for fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Green text
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        // Draw
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Reset drop at random intervals
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Explode effect on click
canvas.addEventListener('click', (e) => {
    // Clear a circle around the click
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(e.clientX, e.clientY, 50, 0, Math.PI * 2);
    ctx.fill();
});

// Start the rain
setInterval(draw, 50);