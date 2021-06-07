<script>
	import Router from 'svelte-spa-router';

    import LandingPage from './LandingPage.svelte';
	import info from './info.svelte';
	import NotFound from './NotFound.svelte';
	import Graphs from './Graphs.svelte';
	import Integrations from './Integrations.svelte';
	import About from './About.svelte';

	const routes = {
        "/": LandingPage,
		"/info": info,
		"/analytics": Graphs,
		"/integrations": Integrations,
		"/about": About,
		"*": NotFound 
	};

</script>

<main>
	<Router {routes} />
</main>