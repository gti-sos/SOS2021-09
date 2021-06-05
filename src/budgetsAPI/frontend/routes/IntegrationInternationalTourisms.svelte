<script>
    import { onMount } from 'svelte';
    import {Table, Row, Col} from 'sveltestrap';
    import {Container} from 'sveltestrap';
    import Chartkick from "chartkick";
    import "chartkick/chart.js";


    async function loadIntegration() {
            //      ------------------- CHARTkICK GRAPH pie / INTERNATIONAL TOURISMS -------------------

        // Pedimos los datos de anxiety stats mediante proxySOS. Y los almacenamos en el array
//        await fetch("/budgetsAPI/proxyRequest/international-tourisms/loadInitialData");
        let international_tourisms_Char3 = 
                await (await fetch("/budgetsAPI/proxyRequest/international-tourisms")).json();
        
        // Pedimos los datos de budgets. Y los almacenamos en el array.
        // Borramos antes para evitar duplicidades.
        await fetch("/api/v2/budgets-by-centers-us/budgets", {method: "DELETE"});
        await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
        let budgetsChart3 = await(await fetch("/api/v2/budgets-by-centers-us/budgets")).json();
        
        // Tratamiento de datos
        let total_by_num_of_prof_budgets_2018 = 0;
        budgetsChart3.filter(o => o["year"] == 2018).forEach(
            e => total_by_num_of_prof_budgets_2018 = total_by_num_of_prof_budgets_2018 + 
                e["amounts_by_number_of_proffessors"]
        );

        let total_num_arrivals = 0;
        international_tourisms_Char3.filter(o => o["country"] == "Spain").forEach(
            e => total_num_arrivals = total_num_arrivals + e["numberofarrivals"]
        );

        // Gráfico
        var integration3_chart = new Chartkick.PieChart("integration3_chart", 
            [["Gasto por profesores", total_by_num_of_prof_budgets_2018], 
                ["Llegadas a españa", total_num_arrivals]]);

        //Chartkick.charts["integration3p_chart"].redraw();
        integration3_chart.getChartObject()
    }

    onMount(async () => {
	await loadIntegration();

    });


</script>

<Container>
	<Row class="text-center">
        <Col>
            <h3>Integracion de la API international-tourisms y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API international-tourisms</h5>
            <h5> Suma del gasto en profesorado en 2018 por centro de la US vs Llegadas de turistas
                a España en los años 2009 y 2015.
            </h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="integration3_chart-figure">
                    <div id="integration3_chart"></div>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>