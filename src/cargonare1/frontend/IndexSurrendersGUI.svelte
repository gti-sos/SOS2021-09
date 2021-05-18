<script>
	import Router from 'svelte-spa-router';
	import Landing from './routes/LandingPage.svelte';
	import surrenderIndex from './routes/surrendersTable.svelte';
	import SurrenderEdit from './routes/editSurrender.svelte';
	import SurrenderSearch from './routes/searchSurrender.svelte';
	import SurrendersGraph from './routes/surrendersGraph.svelte';
//	import NotFound from './NotFound.svelte'
	const routes = {
		"/": Landing,
		"/surrenders": surrenderIndex,
		"/surrenders/:degree/:year": SurrenderEdit,
		"/surrenders/search": SurrenderSearch,
		"/surrenders/graphs": SurrendersGraph
//		"*": NotFound
	};
</script>

<main>
	<Router {routes} />
</main>