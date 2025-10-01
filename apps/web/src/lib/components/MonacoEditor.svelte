<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

	interface Props {
		value?: string;
		language?: string;
		theme?: string;
		onChange?: (value: string) => void;
	}

	let { value = '', language = 'json', theme = 'vs-dark', onChange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let monaco: typeof Monaco;

	onMount(async () => {
		// Import Monaco with worker setup
		const monacoModule = await import('$lib/monaco-setup');
		monaco = monacoModule.monaco;

		if (editorContainer) {
			editor = monaco.editor.create(editorContainer, {
				value: value,
				language: language,
				theme: theme,
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 14,
				lineNumbers: 'on',
				renderWhitespace: 'selection',
				tabSize: 2,
				formatOnPaste: true,
				formatOnType: true,
			});

			// Listen for content changes
			editor.onDidChangeModelContent(() => {
				if (editor && onChange) {
					onChange(editor.getValue());
				}
			});
		}
	});

	onDestroy(() => {
		editor?.dispose();
	});

	// Update editor value when prop changes
	$effect(() => {
		if (editor && value !== editor.getValue()) {
			editor.setValue(value);
		}
	});

	// Update editor theme when prop changes
	$effect(() => {
		if (monaco && editor && theme) {
			monaco.editor.setTheme(theme);
		}
	});

	// Update editor language when prop changes
	$effect(() => {
		if (monaco && editor && language) {
			const model = editor.getModel();
			if (model) {
				monaco.editor.setModelLanguage(model, language);
			}
		}
	});
</script>

<div bind:this={editorContainer} class="w-full h-full"></div>