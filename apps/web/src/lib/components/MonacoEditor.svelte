<script lang="ts">
	import { browser } from '$app/environment';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { onDestroy, onMount } from 'svelte';

	// Props (Svelte 5 runes)
	const { value, language, theme, onChange } = $props<{
		value: string;
		language?: string;
		theme?: string;
		onChange?: (value: string | undefined) => void;
	}>();

	// Expose a method to update the editor value
	export function updateValue(newValue: string) {
		if (editor) {
			editor.setValue(newValue);
		}
	}

	// Locals
	const editorContainer: HTMLDivElement | null = null;
	let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	let monaco: typeof Monaco | null = null;

		onMount(async () => {
		// Import Monaco with worker setup
		const monacoModule = await import('$lib/monaco-setup');
		monaco = monacoModule.monaco;

		if (editorContainer) {
			editor = monaco.editor.create(editorContainer, {
				value: value,
				language: language ?? 'plaintext',
				theme: theme ?? 'vs-dark',
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

	// Update editor value when prop changes (client-only)
    $effect(() => {
        if (!browser) return;
        if (editor) {
            // Explicitly reference the value prop to ensure reactivity
            const newValue = value;
            const currentValue = editor.getValue();
            if (newValue !== currentValue) {
                editor.setValue(newValue);
            }
        }
    });

	// Update editor theme when prop changes (client-only)
    $effect(() => {
        if (!browser) return;
		if (monaco && editor && theme) {
			monaco.editor.setTheme(theme);
        }
    });

	// Update editor language when prop changes (client-only)
    $effect(() => {
        if (!browser) return;
		if (monaco && editor && language) {
            const model = editor.getModel();
            if (model) {
				monaco.editor.setModelLanguage(model, language);
            }
        }
    });
</script>

<div bind:this={editorContainer} class="w-full h-full"></div>