<script>
    import {
        onMount
    } from "svelte";
 
    let MyData = [];
    let ejeX = [];
    let notaCorte = [];
    let presentadosSelect = [];
    let precio = [];
    
    async function loadGraph(){  
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts");
        if(res.ok){
            MyData = await res.json();
            console.log(MyData);
            console.log(JSON.stringify(MyData, null, 2))
            MyData.forEach(data => {
                ejeX.push(data.degree + "-" + data.year);
                notaCorte.push(data["cut_off_mark"]);
                presentadosSelect.push(data["selectivity_presented_seville"]);
                precio.push(data["price_admision"]);
            });
        }else{
            console.log("Error loading cuts");
        }

        Highcharts.chart('container', {
    chart: {
        type: 'bar'
    },
    title: {
        text: 'Notas de corte del grado de Ingeniería Informática según el año'
    },
    xAxis: {
        categories: ejeX,
        title: {
            text: 'Grado-año'
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Nota de corte',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        }
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: true
            }
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor:
            Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        shadow: true
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'Precio',
        data: precio
    },{
        name: 'Presentados a selectividad',
        data: presentadosSelect
    }]
    });
  }
</script>

<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js" on:load="{loadGraph}"></script>
    <script src="https://code.highcharts.com/modules/series-label.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"></script>
</svelte:head>

<main>
    <figure class="highcharts-figure">
        <div id="container"></div>
    </figure>  
</main>