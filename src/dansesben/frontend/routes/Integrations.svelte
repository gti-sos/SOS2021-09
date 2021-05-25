<script>
    import { onMount } from 'svelte';
    import {Col, Container, Row, Table} from 'sveltestrap';
    import Highcharts from "highcharts";

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
        Highcharts.chart('container', {
            chart: {
                type: 'column'
            },
            accessibility: {
                description: '.'
            },
            title: {
                text: 'Nuevos casos de COVID19 y salario medio de trabajos de TI en Londres'
            },
            subtitle: {
                text: 'Obtenidos de https://coronavirus.data.gov.uk/ y https://adzuna.com'
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
                    pointFormat: '{point.x:%e. %b}: {point.y:.0f} nuevos casos'
                }
            },
                {
                    name: "Salario de TI",
                    data: dataGithubParsed,
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x:%e. %b}: {point.y:.0f} libras'
                    }
                }],
        });
    });


</script>

<Container class="mt-4">
    <Row class="text-center">
        <Col>
            <h3 class="mb-3">Casos de COVID19</h3>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="highcharts-figure">
                    <div id="container"></div>
                    <p class="highcharts-description text-center">
                        Se muestra la evolución de de contagios de <code>COVID19</code>
                        en la ciudad de <code>Londres</code>.
                    </p>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>
