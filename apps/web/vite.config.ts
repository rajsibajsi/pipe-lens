import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import monacoEditorPluginDefault from 'vite-plugin-monaco-editor';

const monacoEditorPlugin = monacoEditorPluginDefault.default || monacoEditorPluginDefault;

export default defineConfig({
	plugins: [
		sveltekit(),
		monacoEditorPlugin({
			languageWorkers: ['json', 'typescript'],
		}),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
});
