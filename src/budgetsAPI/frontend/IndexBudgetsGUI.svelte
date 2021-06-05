<script>
	import Router from 'svelte-spa-router';

	import Landing from './routes/LandingPage.svelte';
	import budgetsIndex from './routes/budgetsTable.svelte';
	import BudgetEdit from './routes/editBudget.svelte';
	import BudgetsSearch from './routes/searchBudget.svelte';
	import BudgetsGraph from './routes/budgetsGraph.svelte';
	import BudgetsIntegrations from './routes/Integrations.svelte';
	import Children_out_school_integration from './routes/IntegrationChildrenOutSchool.svelte';
	import Anxiety_stats_integration from './routes/IntegrationAnxietyStats.svelte';
	import International_tourims_integration from './routes/IntegrationInternationalTourisms.svelte';
	import Google_Searchs_US_integration from './routes/IntegrationGoogleSearchsUS.svelte';
	import Love_Calculator_integration from './routes/IntegrationsLoveCalculator.svelte';
//	import NotFound from './NotFound.svelte';

	const routes = {
		"/": Landing,
		"/budgets": budgetsIndex,
		"/budgets/:center/:year": BudgetEdit,
		"/budgets/search": BudgetsSearch,
		"/budgets/graphs": BudgetsGraph,
		"/integrations" : BudgetsIntegrations,
		"/integrations/children-out-school_integration" : Children_out_school_integration,
		"/integrations/anxiety-stats_integration" : Anxiety_stats_integration,
		"/integrations/international-tourisms_integration" : International_tourims_integration,
		"/integrations/google-search-us_integration" : Google_Searchs_US_integration,
		"/integrations/love-calculator_integration" : Love_Calculator_integration
//		"*": NotFound
	};

</script>

<main>
	<Router {routes} />
</main>
