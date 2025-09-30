<script lang="ts">
import { api } from '$lib/api';
import { pipelineStore } from '$lib/stores/pipeline.store';

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

let { isOpen, onClose }: Props = $props();

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
	<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 99999;">
		<div style="background: white; border-radius: 8px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 28rem; width: 100%; margin: 0 1rem;">
			<div style="padding: 1.5rem;">
				<h2 style="font-size: 1.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">Connect to MongoDB</h2>

				<div style="display: flex; flex-direction: column; gap: 1rem;">
					<div>
						<label for="name" style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
							Connection Name
						</label>
						<input
							id="name"
							type="text"
							bind:value={connectionName}
							style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem;"
							placeholder="My MongoDB"
						/>
					</div>

					<div>
						<label for="uri" style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
							Connection URI
						</label>
						<input
							id="uri"
							type="text"
							bind:value={connectionUri}
							style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem;"
							placeholder="mongodb://localhost:27017"
						/>
						<p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
							Example: mongodb://username:password@host:port
						</p>
					</div>

					{#if error}
						<div style="padding: 0.75rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem;">
							<p style="font-size: 0.875rem; color: #991b1b;">{error}</p>
						</div>
					{/if}
				</div>

				<div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
					<button
						type="button"
						onclick={onClose}
						disabled={isConnecting}
						style="flex: 1; padding: 0.5rem 1rem; color: #374151; background: white; border: 1px solid #d1d5db; border-radius: 0.5rem; font-weight: 500; cursor: pointer; opacity: {isConnecting ? 0.5 : 1};"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleConnect}
						disabled={isConnecting}
						style="flex: 1; padding: 0.5rem 1rem; color: white; background: #2563eb; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; opacity: {isConnecting ? 0.5 : 1};"
					>
						{isConnecting ? 'Connecting...' : 'Connect'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}