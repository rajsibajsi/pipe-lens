<script lang="ts">
	import '../app.css';
	import '../styles/design-system.css';
	import '../styles/components.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}