// Transition utilities for smooth animations

export const fadeIn = {
	duration: 300,
	css: (t: number) => `
		opacity: ${t};
		transform: translateY(${(1 - t) * 20}px);
	`
};

export const slideIn = {
	duration: 300,
	css: (t: number) => `
		opacity: ${t};
		transform: translateX(${(1 - t) * 100}%);
	`
};

export const scaleIn = {
	duration: 200,
	css: (t: number) => `
		opacity: ${t};
		transform: scale(${0.9 + t * 0.1});
	`
};

export const slideUp = {
	duration: 250,
	css: (t: number) => `
		opacity: ${t};
		transform: translateY(${(1 - t) * 30}px);
	`
};

export const slideDown = {
	duration: 250,
	css: (t: number) => `
		opacity: ${t};
		transform: translateY(${(1 - t) * -30}px);
	`
};

export const bounceIn = {
	duration: 400,
	css: (t: number) => {
		const bounce = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
		return `
			opacity: ${t};
			transform: scale(${bounce});
		`;
	}
};

export const stagger = (delay: number = 50) => ({
	duration: 300,
	delay: (i: number) => i * delay,
	css: (t: number) => `
		opacity: ${t};
		transform: translateY(${(1 - t) * 20}px);
	`
});

// CSS classes for common transitions
export const transitionClasses = {
	fadeIn: 'transition-fade-in',
	fadeOut: 'transition-fade-out',
	slideIn: 'transition-slide-in',
	slideOut: 'transition-slide-out',
	scaleIn: 'transition-scale-in',
	scaleOut: 'transition-scale-out',
	bounceIn: 'transition-bounce-in',
	slideUp: 'transition-slide-up',
	slideDown: 'transition-slide-down'
} as const;

// CSS keyframes for transitions
export const transitionStyles = `
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes fadeOut {
		from { opacity: 1; transform: translateY(0); }
		to { opacity: 0; transform: translateY(-20px); }
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateX(100%); }
		to { opacity: 1; transform: translateX(0); }
	}

	@keyframes slideOut {
		from { opacity: 1; transform: translateX(0); }
		to { opacity: 0; transform: translateX(-100%); }
	}

	@keyframes scaleIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}

	@keyframes scaleOut {
		from { opacity: 1; transform: scale(1); }
		to { opacity: 0; transform: scale(0.9); }
	}

	@keyframes bounceIn {
		0% { opacity: 0; transform: scale(0.3); }
		50% { opacity: 1; transform: scale(1.05); }
		70% { transform: scale(0.9); }
		100% { opacity: 1; transform: scale(1); }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.transition-fade-in {
		animation: fadeIn 0.3s ease-out;
	}

	.transition-fade-out {
		animation: fadeOut 0.3s ease-in;
	}

	.transition-slide-in {
		animation: slideIn 0.3s ease-out;
	}

	.transition-slide-out {
		animation: slideOut 0.3s ease-in;
	}

	.transition-scale-in {
		animation: scaleIn 0.2s ease-out;
	}

	.transition-scale-out {
		animation: scaleOut 0.2s ease-in;
	}

	.transition-bounce-in {
		animation: bounceIn 0.4s ease-out;
	}

	.transition-slide-up {
		animation: slideUp 0.25s ease-out;
	}

	.transition-slide-down {
		animation: slideDown 0.25s ease-out;
	}

	/* Hover transitions */
	.hover-lift {
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.hover-lift:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.hover-scale {
		transition: transform 0.2s ease;
	}

	.hover-scale:hover {
		transform: scale(1.05);
	}

	.hover-glow {
		transition: box-shadow 0.3s ease;
	}

	.hover-glow:hover {
		box-shadow: 0 0 20px rgba(0, 237, 100, 0.3);
	}

	/* Loading animations */
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	.shimmer {
		background: linear-gradient(
			90deg,
			var(--color-bg-tertiary) 25%,
			var(--color-bg-secondary) 50%,
			var(--color-bg-tertiary) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
`;
