<script>

import { onMount } from 'svelte';
import {Table, Row, Col} from 'sveltestrap';
import {Container} from 'sveltestrap';


async function loadIntegration() {
		//  			------------------- CANVAS GRAPH bar / CHILDREN OUT SCHOOL -------------------

	// Pedimos los datos de children mediante proxySOS. Y los almacenamos en el array
	await fetch("/budgetsAPI/proxyRequest/children-out-school/loadInitialData");
	let childrenChar1 = await (await fetch("/budgetsAPI/proxyRequest/children-out-school")).json();
	
	// Pedimos los datos de budgets. Y los almacenamos en el array.
	// Borramos antes para evitar duplicidades.
	await fetch("/api/v2/budgets-by-centers-us/budgets", {method: "DELETE"});
	await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
	let budgetsChar1 = await(await fetch("/api/v2/budgets-by-centers-us/budgets")).json();

	// console.log(childrenChar1);
	// console.log(budgetsChar1);

	// Tratamiento de datos
	let centers_budgetsChart1_2018 = budgetsChar1.filter(o => o["year"] == 2018).map(o => o["center"]);
	console.log(centers_budgetsChart1_2018);

	let spain_childrenChar1_2018 = childrenChar1.filter(o => o["year"] == 2018 && o["country"] == "Spain")
		.map(o => o["children_out_school_total"]);
	console.log(spain_childrenChar1_2018);

	let budgets_budgetsChart1_2018 = budgetsChar1.filter(o => o["year"] == 2018);
	console.log(budgets_budgetsChart1_2018);

	let children_series = budgets_budgetsChart1_2018.map(function(obj){
            var rObj = {};
            rObj["y"] = spain_childrenChar1_2018[0];
			rObj["label"] = "Niños";
            return rObj;
        });
	console.log(children_series);
	console.log(Array.isArray(children_series))

	let budgets_series = budgets_budgetsChart1_2018.map(function(obj){
            var rObj = {};
            rObj["y"] = obj["total"];
			rObj["label"] = obj["center"];
            return rObj;
        });
	console.log(budgets_series);
	console.log(centers_budgetsChart1_2018[0]);


	// Gráfico
	var integration1_chart = new CanvasJS.Chart("integration1_chart", {
		animationEnabled: true,
		title:{
			text: "Niños fuera del colegio y presupuestos por centro US, año 2018, España"
		},
		axisY: {
			title: "Cuantías totales / Niños totales",
			includeZero: true
		},
		legend: {
			cursor:"pointer"
		},
		data: [{
			type: "bar",
			showInLegend: true,
			name: "Niños fuera del cole",
			color: "Silver",
			dataPoints: children_series
		},
		{
			type: "bar",
			showInLegend: true,
			name: "Cuantía designada a cada centro",
			color: "Green",
			dataPoints: budgets_series
		}]
	});
	integration1_chart.render();
}

onMount(async () => {
	await loadIntegration();

});


</script>

<svelte:head>
	<script src="https://canvasjs.com/assets/script/canvasjs.min.js" on:load="{loadIntegration}"> </script>
</svelte:head>

<Container>
	<Row class="text-center">
        <Col>
            <h3>Integracion de la API children-out-school y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API children-out-school</h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="integration1_chart-figure">
                    <div id="integration1_chart"></div>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>