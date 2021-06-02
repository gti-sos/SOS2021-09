<script>
	import Router from 'svelte-spa-router';

    import LandingPage from './LandingPage.svelte';
	import info from './info.svelte';
	import NotFound from './NotFound.svelte';
	import Graphs from './Graphs.svelte';
	import Integrations from './Integrations.svelte';

	const routes = {
        "/": LandingPage,
		"/info": info,
		"/analytics": Graphs,
		"/integrations": Integrations,
		"*": NotFound 
	};

</script>

<main>
	<Router {routes} />
</main>