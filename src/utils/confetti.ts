const CONFETTI_PARTICLES = 64;
const BURST_FORCE_X = 400;
const BURST_FORCE_Y = 250;
const FALL_SPEED_MIN = 1.5;
const FALL_SPEED_MAX = 3.0;

export const triggerStickerConfetti = (imgUrl: string | null | undefined, x: number, y: number): void => {
    if (!imgUrl) return;

    const distanceToBottom = window.innerHeight - y + 100;

    for (let i = 0; i < CONFETTI_PARTICLES; i++) {
        const particle = document.createElement('img');
        particle.src = imgUrl;
        particle.className = 'tetrone-sticker-particle';

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        document.body.appendChild(particle);

        const burstX = (Math.random() - 0.5) * BURST_FORCE_X;
        const burstY = -(Math.random() * BURST_FORCE_Y + 50);
        const driftX = (Math.random() - 0.5) * 150;
        const rot = (Math.random() - 0.5) * 720;
        const fallDuration = Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN) + FALL_SPEED_MIN;

        particle.style.setProperty('--burst-x', `${burstX}px`);
        particle.style.setProperty('--burst-y', `${burstY}px`);
        particle.style.setProperty('--drift-x', `${driftX}px`);
        particle.style.setProperty('--fall-y', `${distanceToBottom}px`);
        particle.style.setProperty('--rot', `${rot}deg`);
        particle.style.animationDuration = `${fallDuration}s`;

        requestAnimationFrame(() => {
            particle.classList.add('animate');
        });

        setTimeout(() => {
            particle.remove();
        }, fallDuration * 1000 + 100);
    }
};