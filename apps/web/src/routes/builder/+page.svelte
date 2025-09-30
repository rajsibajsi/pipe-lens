<script lang="ts">
import { Editor } from '@monaco-editor/react';
import { onMount } from 'svelte';

const editorContent = `[
  {
    "$match": {
      "status": "active"
    }
  },
  {
    "$group": {
      "_id": "$category",
      "count": { "$sum": 1 }
    }
  }
]`;

let isEditorReady = false;

onMount(() => {
	isEditorReady = true;
});
</script>

<div class="h-screen flex flex-col">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 px-6 py-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Pipeline Builder</h1>
				<p class="text-sm text-gray-500 mt-1">Build and test MongoDB aggregation pipelines</p>
			</div>
			<div class="flex gap-3">
				<button
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Save
				</button>
				<button
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
				>
					Run Pipeline
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar - Stage Library -->
		<aside class="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
			<div class="p-4">
				<h2 class="text-sm font-semibold text-gray-900 mb-3">Pipeline Stages</h2>
				<div class="space-y-2">
					{#each ['$match', '$project', '$group', '$sort', '$limit', '$skip', '$lookup', '$unwind', '$addFields', '$replaceRoot'] as stage}
						<button
							class="w-full text-left px-3 py-2 text-sm font-mono text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50"
						>
							{stage}
						</button>
					{/each}
				</div>
			</div>

			<div class="p-4 border-t border-gray-200">
				<h2 class="text-sm font-semibold text-gray-900 mb-3">Connection</h2>
				<button
					class="w-full px-3 py-2 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-500"
				>
					<div class="flex items-center gap-2">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<span>Local MongoDB</span>
					</div>
					<div class="text-xs text-gray-500 mt-1">localhost:27017</div>
				</button>
			</div>
		</aside>

		<!-- Editor and Results -->
		<div class="flex-1 flex flex-col">
			<!-- Editor -->
			<div class="flex-1 border-b border-gray-200">
				<div class="h-full">
					{#if isEditorReady}
						<Editor
							height="100%"
							defaultLanguage="json"
							defaultValue={editorContent}
							theme="vs-dark"
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								lineNumbers: 'on',
								renderWhitespace: 'selection',
								tabSize: 2,
								formatOnPaste: true,
								formatOnType: true,
							}}
						/>
					{/if}
				</div>
			</div>

			<!-- Results Panel -->
			<div class="h-1/3 bg-gray-900 text-white p-4 overflow-auto">
				<h3 class="text-sm font-semibold mb-3">Pipeline Results</h3>
				<div class="text-sm text-gray-400">
					<p>Connect to MongoDB and run your pipeline to see results here.</p>
				</div>
			</div>
		</div>
	</div>
</div>