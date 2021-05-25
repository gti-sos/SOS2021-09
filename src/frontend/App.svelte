<script>
	import Router from 'svelte-spa-router';

    import LandingPage from './LandingPage.svelte';
	import info from './info.svelte';
	import NotFound from './NotFound.svelte';
	import Graphs from './Graphs.svelte';

	const routes = {
        "/": LandingPage,
		"/info": info,
		"/analytics": Graphs,
		"*": NotFound 
	};

</script>

<main>
	<Router {routes} />
</main>