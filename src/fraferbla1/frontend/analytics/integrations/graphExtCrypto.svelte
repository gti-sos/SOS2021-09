<script>

    let array = [];
    let array1 = [];
    let array2 = [];
    let cont = 0;

    async function loadGraph() {
        let res1 = await fetch ('https://api.coincap.io/v2/assets');
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')
        
        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        for(let i = 0; i < 4; i++) {
            if(cont < 4){
                array1.push(parseInt(res_data1.data[i].priceUsd));
                array.push(res_data1.data[i].name + ' price');
                cont++;
            }
        }
        console.log(res_data2)
        for(let j = 0; j < 4; j++){
            array1.push(res_data2[j].selectivity_presented_seville);
            array.push('Presentados selectividad Sevilla ' + res_data2[j].year);
        }

        var options = {
          series: array1,
          chart: {
          width: 600,
          type: 'pie',
        },
        labels: array,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();
    }

</script>

<main>
    <h1>Gráfico que muestra el valor de varias criptomonedas en USD a día de hoy y los presentados en selectidad en Sevilla varios años</h1>
    <div id="chart"></div>
</main>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts" on:load={loadGraph}></script>
</svelte:head>