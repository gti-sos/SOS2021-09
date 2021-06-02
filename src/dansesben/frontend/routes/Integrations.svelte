<script>
    import { onMount } from 'svelte';
    import {Col, Container, Row} from 'sveltestrap';
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
        let dataAPI = await (await fetch("/api/v2/performances-by-degrees-us/?limit=5&center=ETSII&field-of-knowledge=Computer-Science&offset=0")).json();

        // Remove not ETSII and Computer-Science data
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
        await fetch("/dansesben/proxyRequest/education-expenditures/loadInitialDataReduced");
        let educationExpeditures = await (await fetch("/dansesben/proxyRequest/education-expenditures/reduced?c=Spain")).json();

        educationExpeditures = [...new Map(educationExpeditures.map(item => [item["year"], item])).values()]

        let educationValue2016 = 0;

        educationExpeditures.forEach(o =>{
            if(o.year === 2016) educationValue2016 = o["education_expenditure_per_millions"];
        });

        let dataAPI2 = await (await fetch("/api/v2/performances-by-degrees-us/")).json();
        let creditosAprobados = 0;

        dataAPI2.forEach(o => {
           creditosAprobados = creditosAprobados + o["credits-passed"];
        });

        let options2 = {
            chart: {
                type: 'treemap'
            },
            series: [{
                data: [
                    {
                        x: "Gasto en educacion en 2016",
                        y: educationValue2016
                    },
                    {
                        x: "Creditos aprobados en la US en total",
                        y: creditosAprobados
                    }
                ]
            }]
        }

        let chart3 = new ApexCharts(document.querySelector("#myChart"), options2);
        chart3.render();


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
            chart: { title: 'Casos de ansiedad vs Creditos aprobados en Ingenieria Informatica en la ETSII', width: 900, height: 400 },
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
            <h6>Libreria ApexCharts</h6>
        </Col>
    </Row>
    <Row class="text-center">
        <Col>
            <Container>
                <figure class="highcharts-figure">
                    <div id="myChart"></div>
                    <p class="highcharts-description text-center">
                        Se muestra la relación entre los <code>créditos aprobados</code> y el <code>gasto en educación</code> de 2016.
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
