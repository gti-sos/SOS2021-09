<script>
    import Highcharts from 'highcharts';
    import {Container, Row, Col} from 'sveltestrap';
    import {getAllRecords} from './API';
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    onMount(async () => {
        let data = await getAllRecords();

        // Remove not ETSII and Computer-Science data
        data = data.filter(o => o.center === "ETSII" && o["field-of-knowledge"] === "Computer-Science");

        // Sort array by date
        data = data.sort(function(a, b) {
            if (a.year < b.year) return -1;
            if (a.year > b.year) return 1;
            return 0;
        });

        // X Axis
        let xAxisValues = data.map(o => o.year);
        let rangeStart = Math.min(...xAxisValues);
        // Y Axis
        let yAxisValues = data.map(o => o["credits-passed"]);

        Highcharts.chart('container', {
            title: {
                text: 'Créditos aprobados en la ETSII'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Número de créditos aprobados'
                }
            },

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                    pointStart: rangeStart
                }
            },

            series: [{
                name: 'Ingeniería informática',
                data: yAxisValues
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });

        let creditsEnrolled = data.map(o => o["credits-enrolled"]);
        let creditsPassed = data.map(o => o["credits-passed"]);

        Highcharts.chart('container-stack', {
            chart: {
                type: 'area'
            },
            title: {
                text: 'Evolución de créditos matriculados y aprobados en la ETSII para el grado de Ingenieria informatica'
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                categories: xAxisValues,
                tickmarkPlacement: 'on',
                title: {
                    enabled: false
                }
            },
            yAxis: {
                title: {
                    text: 'Creditos'
                }
            },
            tooltip: {
                split: true,
                valueSuffix: ' creditos'
            },
            plotOptions: {
                area: {
                    pointStart: rangeStart,
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Matriculados',
                data: creditsEnrolled
            }, {
                name: 'Aprobados',
                data: creditsPassed
            }]
        });

        // Chartjs
        const CHART_COLORS = {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        };

        let dataRawPie = await getAllRecords();
        let dataCounter = {};

        dataRawPie.forEach(o => {
            if(!(o.center in dataCounter)){
                dataCounter[o.center] = o["credits-enrolled"];
            }else{
                dataCounter[o.center] += o["credits-enrolled"];
            }
        });

        const dataPie = {
            labels: Object.keys(dataCounter),
            datasets: [
                {
                    label: 'Dataset 1',
                    data: Object.values(dataCounter),
                    backgroundColor: Object.values(CHART_COLORS),
                }
            ]
        };

        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'pie',
            data: dataPie,
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Creditos matriculados por centro'
                    }
                }
            },
        });
    });
</script>

<Container>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description text-center">
            Se muestra la evolución de créditos aprobados para el grado de <code>Ingeniería informática</code>
            en la <code>ETSII</code>.
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container-stack"></div>
        <p class="highcharts-description text-center">
            Se muestra la evolución de créditos aprobados frente a los matriculados para el grado de <code>Ingeniería informática</code>
            en la <code>ETSII</code>.
        </p>
    </figure>
</Container>

<Container>
        <canvas id="myChart" width="700" height="600"></canvas>
</Container>
