<script>
    import { onMount } from 'svelte';
    import {Table, Row, Col} from 'sveltestrap';
    import {Container} from 'sveltestrap';
    import ApexCharts from 'apexcharts'


    async function loadIntegration() {
            //      ------------------- APexcharts GRAPH scatter / GOOGLE SEARCHS -------------------ç
        
            // Pedimos los datos de google searchs mediante proxySOSExt. Y los almacenamos en el array

        let google_searchs_US_Char4 = 
                await (await fetch("/budgetsAPI/proxyRequestExt/google-searchs-us")).json();
                console.log(google_searchs_US_Char4);

        // Pedimos los datos de budgets. Y los almacenamos en el array.
        // Borramos antes para evitar duplicidades.
        await fetch("/api/v2/budgets-by-centers-us/budgets", {method: "DELETE"});
        await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
        let budgetsChart4 = await(await fetch("/api/v2/budgets-by-centers-us/budgets")).json();


        // Tratamiento de datos
        let total_google_searchs_US_Char4 = google_searchs_US_Char4["total"];
        console.log(total_google_searchs_US_Char4);

        let total_budgets_US = 0;
        budgetsChart4.forEach(
            e => total_budgets_US = total_budgets_US + parseInt(e["total"], 10)
        );
        console.log(total_budgets_US);

        var options = {
          series: [{
          name: "Total Budgets",
          data: [[0, total_budgets_US]]
        },{
          name: "Google Search for University of Seville",
          data: [[0, total_google_searchs_US_Char4]]
        }],
          chart: {
          height: 350,
          type: 'scatter',
          zoom: {
            enabled: true,
            type: 'xy'
          }
        },
        xaxis: {
          tickAmount: 2,
          labels: {
            formatter: function(val) {
              return parseFloat(val).toFixed(1)
            }
          }
        },
        yaxis: {
          tickAmount: 2
        }
        };

        var integration4_chart = new ApexCharts(document.querySelector("#integration4_chart"), options);
        integration4_chart.render();
    }

    onMount(async () => {
	await loadIntegration();

    });

</script>

<Container>
	<Row class="text-center">
        <Col>
            <h3>Integracion de la API Google - Searchs y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API Google - Searchs</h5>
            <h5> Suma del gasto en total por centro de la US vs Cantidad de búsquedas en Google
                de "University Of Seville"
            </h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="integration4_chart-figure">
                    <div id="integration4_chart"></div>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>