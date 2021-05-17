<script>
	import Router from 'svelte-spa-router';

	import Landing from './routes/LandingPage.svelte';
	import budgetsIndex from './routes/budgetsTable.svelte';
	import BudgetEdit from './routes/editBudget.svelte';
	import BudgetsSearch from './routes/searchBudget.svelte';
	import BudgetsGraph from './routes/budgetsGraph.svelte';
//	import NotFound from './NotFound.svelte';

	const routes = {
		"/": Landing,
		"/budgets": budgetsIndex,
		"/budgets/:center/:year": BudgetEdit,
		"/budgets/search": BudgetsSearch,
		"/budgets/graphs": BudgetsGraph
//		"*": NotFound
	};

</script>

<main>
	<Router {routes} />
</main>
