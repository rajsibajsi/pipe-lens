<script lang="ts">
import { api } from '$lib/api';
import { pipelineStore } from '$lib/stores/pipeline.store';

export const isOpen = false;
export let onClose: () => void;

const connectionName = 'Local MongoDB';
const connectionUri = 'mongodb://admin:password@localhost:27017';
let isConnecting = false;
let error = '';

async function handleConnect() {
	isConnecting = true;
	error = '';

	try {
		// Test connection first
		const testResult = await api.testConnection(connectionUri);
		if (!testResult.success) {
			error = 'Failed to connect to MongoDB. Please check your connection string.';
			return;
		}

		// Create connection ID
		const connectionId = `conn_${Date.now()}`;

		// Connect
		await api.connect(connectionId, connectionUri);

		// Update store
		pipelineStore.setConnection({
			id: connectionId,
			name: connectionName,
			uri: connectionUri,
			isConnected: true,
		});

		// Load databases
		const { databases } = await api.listDatabases(connectionId);
		pipelineStore.setDatabases(databases);

		onClose();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to connect';
	} finally {
		isConnecting = false;
	}
}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-4">Connect to MongoDB</h2>

				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Connection Name
						</label>
						<input
							id="name"
							type="text"
							bind:value={connectionName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="My MongoDB"
						/>
					</div>

					<div>
						<label for="uri" class="block text-sm font-medium text-gray-700 mb-1">
							Connection URI
						</label>
						<input
							id="uri"
							type="text"
							bind:value={connectionUri}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
							placeholder="mongodb://localhost:27017"
						/>
						<p class="text-xs text-gray-500 mt-1">
							Example: mongodb://username:password@host:port
						</p>
					</div>

					{#if error}
						<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm text-red-800">{error}</p>
						</div>
					{/if}
				</div>

				<div class="flex gap-3 mt-6">
					<button
						type="button"
						on:click={onClose}
						disabled={isConnecting}
						class="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={handleConnect}
						disabled={isConnecting}
						class="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
					>
						{isConnecting ? 'Connecting...' : 'Connect'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}