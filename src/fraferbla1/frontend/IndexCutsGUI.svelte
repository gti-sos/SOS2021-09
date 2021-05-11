<script>
	import Router from 'svelte-spa-router';
	import Landing from './routes/LandingPage.svelte';
	import cutsIndex from './routes/cutsTable.svelte';
	import CutEdit from './routes/editCut.svelte';
	import CutsSearch from './routes/searchCut.svelte';
//	import NotFound from './NotFound.svelte';
	const routes = {
		"/": Landing,
		"/cuts": cutsIndex,
		"/cuts/:center/:year": CutEdit,
		"/cuts/search": CutsSearch
//		"*": NotFound
	};
</script>

<main>
	<Router {routes} />
</main>