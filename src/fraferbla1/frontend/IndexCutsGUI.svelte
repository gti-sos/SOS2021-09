<script>
	import Router from 'svelte-spa-router';
	import Landing from './routes/LandingPage.svelte';
	import cutsIndex from './routes/cutsTable.svelte';
	import CutEdit from './routes/editCut.svelte';
	import CutsSearch from './routes/searchCut.svelte';
	import GraphHighcharts from './analytics/graphHighcharts.svelte';
	import Graphv2 from './analytics/graphv2.svelte';
	import graphs from './analytics/graphs.svelte';
	import graphFire from './analytics/integrations/graphFire.svelte';
	import graphSmoking from './analytics/integrations/graphSmoking.svelte';
	import graphBuysell from './analytics/integrations/graphBuysell.svelte';
	import graphExtCovid from './analytics/integrations/graphExtCovid.svelte';
	import graphExtNumbers from './analytics/integrations/graphExtNumbers.svelte';
	import graphExtChuck from './analytics/integrations/graphExtChuck.svelte';
	import graphExtCrypto from './analytics/integrations/graphExtCrypto.svelte';
	import integrations from './analytics/integrations/integrations.svelte';

//	import NotFound from './NotFound.svelte';
	const routes = {
		"/": Landing,
		"/graphs": graphs,
		"/cuts": cutsIndex,
		"/cuts/:degree/:year": CutEdit,
		"/cuts/search": CutsSearch,
		"/cuts/graficas": GraphHighcharts,
		"/cuts/graficav2" : Graphv2,
		"/integrations/fire" : graphFire,
		"/integrations/smoking" : graphSmoking,
		"/integrations/buysell" : graphBuysell,
		"/integrations/extcovid" : graphExtCovid,
		"/integrations/extnumbers" : graphExtNumbers,
		"/integrations/extchuck" : graphExtChuck,
		"/integrations/extcrypto" : graphExtCrypto,
		"/integrations" : integrations
//		"*": NotFound
	};
</script>
 
<main>
	<Router {routes} />
</main>