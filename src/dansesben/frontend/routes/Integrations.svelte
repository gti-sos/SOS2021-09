<script>
    import { onMount } from 'svelte';
    import {Col, Container, Row} from 'sveltestrap';
    import Highcharts from "highcharts";
    import {getAllRecords} from "./API";

    onMount(async () =>{
       let dataLondon = await (await fetch("https://api.coronavirus.data.gov.uk/v1/data?filters=areaType=region;areaName=london&structure={%22date%22:%22date%22,%22newCases%22:%22newCasesByPublishDate%22}")).json();
       let dataRemoteGithub = await (await fetch("/dansesben/getDataAdzuna")).json();

       let dataLondonParsed = [];

       dataLondon.data.forEach(o =>{
           dataLondonParsed.push([Date.parse(o.date), o.newCases]);
       });

       let dataGithubParsed = [];
       let monthsSorted = Object.keys(dataRemoteGithub.month).sort();

       for (let k in monthsSorted){
           dataGithubParsed.push([Date.parse(monthsSorted[k]), dataRemoteGithub.month[monthsSorted[k]]])
       }

       dataGithubParsed = dataGithubParsed.sort()

        let dataAPI = await getAllRecords();

        // Remove not ETSII and Computer-Science data
        dataAPI = dataAPI.filter(o => o.center === "ETSII" && o["field-of-knowledge"] === "Computer-Science");
        let yAxisValues = dataAPI.map(o => [Date.parse(o["year"]), o["credits-passed"]]);

        Highcharts.chart('container', {
            chart: {
                type: 'column'
            },
            accessibility: {
                description: '.'
            },
            title: {
                text: 'Nuevos casos de COVID19, salario medio de trabajos de TI en Londres y creditos aprobados en la ETSII'
            },
            subtitle: {
                text: 'Obtenidos de https://coronavirus.data.gov.uk/, https://adzuna.com y performances-by-degrees'
            },

            yAxis: [{
                title: {
                    text: 'Nuevos casos'
                },
                min: 0
            },
            {
                title: {
                    text: 'Salario TI'
                },
                min: 0
            },
            {
                title: {
                    text: 'Creditos aprobados en la ETSII'
                },
                min: 0
            }
            ],
            tooltip: {
                pointFormat: '{series.name} had stockpiled <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
            },

            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },

            series: [{
                name: "Nuevos casos",
                data: dataLondonParsed,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%e. %b %Y}: {point.y:.0f} nuevos casos'
                }
            },
            {
                name: "Salario de TI",
                data: dataGithubParsed,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%e. %b %Y}: {point.y:.0f} libras'
                }
            },
            {
                name: "Creditos aprobados en la ETSII",
                data: yAxisValues,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%Y}: {point.y:.0f} creditos'
                }
            }],
        });
    });


</script>

<Container class="mt-4">
    <Row class="text-center">
        <Col>
            <h3>Integracion dos APIs externas y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API de sueldos</h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="highcharts-figure">
                    <div id="container"></div>
                    <p class="highcharts-description text-center">
                        Se muestra la evolución de de contagios de <code>COVID19</code>
                        en la ciudad de <code>Londres</code>, el <code>sueldo</code> de trabajos de TI
                        en <code>Londres</code> y los <code>creditos</code> aprobados en la <code>ETSII</code>
                    </p>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>
