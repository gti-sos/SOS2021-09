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
                min: 0,
                opposite: true
            },
            {
                title: {
                    text: 'Creditos aprobados en la ETSII'
                },
                min: 0,
                opposite: true
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
                yAxis: 0,
                data: dataLondonParsed,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%e. %b %Y}: {point.y:.0f} nuevos casos'
                }
            },
            {
                name: "Salario de TI",
                yAxis: 1,
                data: dataGithubParsed,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%e. %b %Y}: {point.y:.0f} libras'
                }
            },
            {
                name: "Creditos aprobados en la ETSII",
                yAxis: 2,
                data: yAxisValues,
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%Y}: {point.y:.0f} creditos'
                }
            }],
        });

        // SOS Integration
        await fetch("/dansesben/proxyRequest/education-expenditures/loadInitialData");
        let educationExpeditures = await (await fetch("/dansesben/proxyRequest/education-expenditures/")).json();

        educationExpeditures = educationExpeditures.filter(o => o.country == "Spain");
        educationExpeditures = [...new Map(educationExpeditures.map(item => [item["year"], item])).values()]
        educationExpeditures = educationExpeditures.map(o => [Date.parse(o.year), o["education_expenditure_per_millions"]]);


/*        Highcharts.chart('container-2', {
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Gasto en educación vs Creditos aprobados'
            },
            subtitle: {
                text: 'Fuente: education-expenditures y performances-by-degrees'
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

            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value} creditos',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                title: {
                    text: 'Creditos',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                }
            }, { // Secondary yAxis
                title: {
                    text: 'Gasto en educacion',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                labels: {
                    format: '{value} millones de euros',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                opposite: true
            }],
            tooltip: {
                shared: true
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                x: 120,
                verticalAlign: 'top',
                y: 100,
                floating: true,
                backgroundColor:
                    Highcharts.defaultOptions.legend.backgroundColor || // theme
                    'rgba(255,255,255,0.25)'
            },
            series: [{
                name: 'Gasto en educacion',
                type: 'column',
                yAxis: 1,
                data: educationExpeditures,
                tooltip: {
                    valueSuffix: ' millones de euros'
                }

            }, {
                name: 'Creditos aprobados',
                type: 'spline',
                data: yAxisValues,
                tooltip: {
                    valueSuffix: ' creditos'
                }
            }]
        });*/

        await fetch("/dansesben/proxyRequest/mh-stats/loadInitialData");
        let mhStats = await (await fetch("/dansesben/proxyRequest/mh-stats/")).json();
        mhStats = mhStats.filter(o => o.country === "Spain");
        //mhStats = mhStats.map(o => [Date.parse(o.year), parseFloat(o.anxdaly)]);

        let mhStatsYears = mhStats.map(o => o.year);
        let mhStatsValues = mhStats.map(o => o.anxdaly)

        let apiValues = [];

        for(let i in mhStatsYears){
            let found = false;
            for(let x in dataAPI){
                if(mhStatsYears[i] == dataAPI[x].year){
                    apiValues.push(dataAPI[x]["credits-passed"]);
                    found = true;
                }
            }
            if(!found) apiValues.push(0);
        }



        const el = document.getElementById('chart-2');
        const data = {
            categories: mhStatsYears,
            series: [
                {
                    name: 'Casos de ansiedad',
                    data: mhStatsValues,
                },
                {
                    name: 'Creditos aprobados',
                    data: apiValues,
                }
            ],
        };

        const options = {
            chart: { title: 'Casos de ansiedad vs Creditos aprobados', width: 900, height: 400 },
        };

        const chart = toastui.Chart.barChart({ el, data, options });
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

    <Row class="text-center mt-2">
        <Col>
            <h3>Integracion API education-expenditures y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API education-expenditures</h5>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="highcharts-figure">
                    <div id="myChart"></div>
                    <p class="highcharts-description text-center">
                        Se muestra la relación entre los <code>créditos aprobados</code> y el <code>gasto en educación</code> de ese año.
                    </p>
                </figure>
            </Container>
        </Col>
    </Row>

    <Row class="text-center">
        <Col>
            <h3>Integracion API mh-stats y la propia</h3>
            <h5 class="mb-3">Se utiliza un proxy para acceder a la API mh-stats</h5>
            <h6>Librería Tui Chart</h6>
        </Col>
    </Row>
    <Row class="text-center mb-5 mt-2">
        <Col>
            <Container>
                <figure class="highcharts-figure">
                    <div id="chart-2"></div>
                    <p class="highcharts-description text-center">
                        Se muestra la relación entre los <code>créditos aprobados</code> y los <code>casos de ansiedad</code> en España de ese año.
                    </p>
                </figure>
            </Container>
        </Col>
    </Row>
</Container>
