<script>
	import Router from 'svelte-spa-router';

	import Landing from './routes/LandingPage.svelte';
	import budgetsIndex from './routes/budgetsTable.svelte';
	import BudgetEdit from './routes/editBudget.svelte';
//	import NotFound from './NotFound.svelte';

	const routes = {
		"/": Landing,
		"/budgets": budgetsIndex,
		"/budgets/:center": BudgetEdit,
//		"*": NotFound
	};

</script>

<main>
	<Router {routes} />
</main>
