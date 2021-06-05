<script>
    import { onMount } from 'svelte';
    import {Table, Row, Col} from 'sveltestrap';
    import {Container} from 'sveltestrap';



    async function loadIntegration() {
            //  			------------------- CANVAS GRAPH doughnut / ANXIETY STATS -------------------

        // Pedimos los datos de anxiety stats mediante proxySOS. Y los almacenamos en el array
        await fetch("/budgetsAPI/proxyRequest/anxiety_stats/loadInitialData");
        let anxiety_stats_Char2 = await (await fetch("/budgetsAPI/proxyRequest/anxiety_stats")).json();
        
        // Pedimos los datos de budgets. Y los almacenamos en el array.
        // Borramos antes para evitar duplicidades.
        await fetch("/api/v2/budgets-by-centers-us/budgets", {method: "DELETE"});
        await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
        let budgetsChar2 = await(await fetch("/api/v2/budgets-by-centers-us/budgets")).json();

        console.log(anxiety_stats_Char2);
        console.log(budgetsChar2);

        
        // Tratamiento de datos
        let budgets_series = budgetsChar2.map(function(obj){
                var rObj = {};
                rObj["y"] = obj["total"];
                rObj["label"] = obj["center"];
                return rObj;
            })
        console.log(budgets_series);

        let anxiety_series = anxiety_stats_Char2.map(function(obj){
                var rObj = {};
                rObj["y"] = obj["anxiety_population"]*10000;
                rObj["label"] = obj["country"];
                return rObj;
            });
        console.log(anxiety_series);
        console.log(budgets_series);
        let budgets_anxiety_series = budgets_series.concat(anxiety_series);
        console.log(budgets_anxiety_series);



        // Gráfico
        var integration2_chart = new CanvasJS.Chart("integration2_chart", {
        animationEnabled: true,
        title:{
            text: "Presupuestos por centro y Ansiedad por comunidades",
            horizontalAlign: "left"
        },
        data: [{
            type: "doughnut",
            startAngle: 60,
            //innerRadius: 60,
            indexLabelFontSize: 17,
            indexLabel: "{label} - {y}",
            toolTipContent: "<b>{label}:</b> {y}",
            dataPoints: budgets_anxiety_series
        }]
    });
    integration2_chart.render();
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
            <h3>Integracion de la API anxiety_stats y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API anxiety_stats</h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="integration2_chart-figure">
                    <div id="integration2_chart"></div>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>