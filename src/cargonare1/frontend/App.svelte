<script>
	import Router from 'svelte-spa-router';
	import Landing from './routes/LandingPage.svelte';
	import surrendersIndex from './routes/surrendersTable.svelte';
	import SurrenderEdit from './routes/editSurrender.svelte';
//	import NotFound from './NotFound.svelte';
	const routes = {
		"/": Landing,
		"/surrenders": surrendersIndex,
		"/surrenders/:center": SurrenderEdit,
//		"*": NotFound
	};
</script>

<main>
	<Router {routes} />
</main>