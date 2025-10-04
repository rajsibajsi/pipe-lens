import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

// Declare MonacoEnvironment on the global scope
declare global {
	interface Window {
		MonacoEnvironment?: {
			getWorker: (workerId: string, label: string) => Worker;
		};
	}
}

// Setup Monaco environment for Web Workers
(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
	getWorker(_: unknown, label: string) {
		if (label === 'json') {
			return new jsonWorker();
		}
		return new editorWorker();
	},
};

export { monaco };
