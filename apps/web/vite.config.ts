import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['monaco-editor'],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					monaco: ['monaco-editor'],
				},
			},
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
});
