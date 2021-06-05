<script>
    import { onMount } from 'svelte';
    import {Table, Row, Col} from 'sveltestrap';
    import {Container} from 'sveltestrap';
    import Highcharts from 'highcharts';


    async function loadIntegration() {
            //      ------------------- APexcharts GRAPH scatter / GOOGLE SEARCHS -------------------ç
        
        // Pedimos los datos de google searchs mediante proxySOSExt. Y los almacenamos en el array

        // Pedimos los datos de budgets del 2019.
        let budgets_2018_2019_Chart5 = await(await fetch("/api/v2/budgets-by-centers-us/budgets")).json();

        let centers_budgets_2018_2019 = budgets_2018_2019_Chart5.filter(o => o["year"] == 2019 
            || o["year"] == 2018).map(e => e["center"]);

        let categories_Chart5 = [];
        let data_series_Chart5 = [];
        for(let c = 0; c < centers_budgets_2018_2019.length - 1; c++) {

            let love_calculator_Char5 = 
            await (await fetch("/budgetsAPI/proxyRequestExt2/love-calculator/" 
                + centers_budgets_2018_2019[c] + "/" + centers_budgets_2018_2019[c + 1])).json();
            
            categories_Chart5.push(centers_budgets_2018_2019[c]+" & "+centers_budgets_2018_2019[c + 1]);
            data_series_Chart5.push(parseInt(love_calculator_Char5["percentage"], 10));
        }
        console.log(data_series_Chart5);

        // Gráfico
        Highcharts.chart('integration5_chart', {
            chart: {
                type: 'areaspline'
            },
            title: {
                text: 'Compatibilidad entre nombres de centros'
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 150,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor:
                    Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
            },
            xAxis: {
                categories: categories_Chart5,
            },
            yAxis: {
                title: {
                    text: 'Compatibilidad %'
                }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' %'
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                areaspline: {
                    fillOpacity: 0.5
                }
            },
            series: [{
                name: 'Compatibilidad',
                data: data_series_Chart5
            }]
        });
        
        // var sname = "Alicia";
        // var fname = "Sara";
        // let love_calculator_Char5 = 
        //         await (await fetch("/budgetsAPI/proxyRequestExt2/love-calculator/" 
        //             + sname + "/" + fname)).json();
        //         console.log(love_calculator_Char5);

        // Tratamiento de datos
    }

    onMount(async () => {
	await loadIntegration();

    });
</script>

<Container>
	<Row class="text-center">
        <Col>
            <h3>Integracion de la API Love Calculator y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API Love Calculator</h5>
            <h5> Porcentaje de compatibilidad entre los nombres de los centros de los años
                2018 y 2019
            </h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="integration5_chart-figure">
                    <div id="integration5_chart"></div>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>