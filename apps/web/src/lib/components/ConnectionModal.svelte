<script lang="ts">
import { api } from '$lib/api';
import { pipelineStore } from '$lib/stores/pipeline.store';

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

const { isOpen, onClose }: Props = $props();

let connectionName = $state('Local MongoDB');
let connectionUri = $state('mongodb://admin:password@localhost:27017');
let isConnecting = $state(false);
let error = $state('');

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
	<div class="modal-backdrop">
		<div class="modal">
			<div class="modal-header">
				<h2 class="modal-title">Connect to MongoDB</h2>
			</div>

			<div class="modal-body">
				<div class="input-group">
					<label for="name" class="input-label">
						Connection Name
					</label>
					<input
						id="name"
						type="text"
						bind:value={connectionName}
						class="input"
						placeholder="My MongoDB"
					/>
				</div>

				<div class="input-group" style="margin-top: var(--space-md);">
					<label for="uri" class="input-label">
						Connection URI
					</label>
					<input
						id="uri"
						type="text"
						bind:value={connectionUri}
						class="input"
						style="font-family: var(--font-mono);"
						placeholder="mongodb://localhost:27017"
					/>
					<p style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-xs);">
						Example: mongodb://username:password@host:port
					</p>
				</div>

				{#if error}
					<div class="alert alert-error" style="margin-top: var(--space-md);">
						<svg style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<p style="font-size: var(--text-sm); margin: 0;">{error}</p>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button
					type="button"
					onclick={onClose}
					disabled={isConnecting}
					class="btn btn-secondary"
					style="flex: 1;"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleConnect}
					disabled={isConnecting}
					class="btn btn-primary"
					style="flex: 1;"
				>
					{#if isConnecting}
						<span class="spinner"></span>
					{/if}
					{isConnecting ? 'Connecting...' : 'Connect'}
				</button>
			</div>
		</div>
	</div>
{/if}