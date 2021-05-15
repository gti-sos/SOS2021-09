<script>
    import Highcharts from 'highcharts';
    import {Container} from 'sveltestrap';
    import {getAllRecords} from './API';
    import { onMount } from 'svelte';

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