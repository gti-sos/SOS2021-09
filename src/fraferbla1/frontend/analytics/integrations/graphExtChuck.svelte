<script>

    let datosDegrees = [];
    let datosAux = [];
    async function loadGraph() {
        let res1 = await fetch('https://api.chucknorris.io/jokes/random');
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts');

        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        res_data2.forEach((data) => {
            datosDegrees.push(data.year);
            datosDegrees.push(data.cut_off_mark)
            datosAux.push(datosDegrees);
            datosDegrees = [];
        });

        console.log(res_data1);

        Highcharts.chart('container', {
    chart: {
        type: 'scatter',
        zoomType: 'xy'
    },
    title: {
        text: res_data1.value
    },
    xAxis: {
        title: {
            enabled: true,
            text: 'Height (cm)'
        },
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true
    },
    yAxis: {
        title: {
            text: 'Weight (kg)'
        }
    },
    legend: {
        layout: 'vertical',
        align: 'left',
        verticalAlign: 'top',
        x: 100,
        y: 70,
        floating: true,
        backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
        borderWidth: 1
    },
    plotOptions: {
        scatter: {
            marker: {
                radius: 5,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)'
                    }
                }
            },
            states: {
                hover: {
                    marker: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.x}, {point.y}'
            }
        }
    },
    series: [{
        name: 'Año y nota de corte de grados',
        color: 'rgba(223, 83, 83, .5)',
        data: datosAux
    }]
});
    }
</script>

<main>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description">
            Gráfica que muestra la nota de corte y el año de varios grados de la US, y que tiene como título una frase aleatoria de Chuck Norris
        </p>
    </figure>
</main>

<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"on:load="{loadGraph}"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
    
</svelte:head>