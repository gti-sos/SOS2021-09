<script>
    let aux = 0;
    let Andalucia = [];
    let stringAndalucia;
    let numPresentados;
    async function loadGraph(){

        let res1 = await fetch("https://covid-19-statistics.p.rapidapi.com/reports?iso=ESP", {
	"method": "GET",
	"headers": {
		"x-rapidapi-key": "1e9f511ec0msh4589404febe3c78p1bb28bjsnb97a048b0ff2",
		"x-rapidapi-host": "covid-19-statistics.p.rapidapi.com"
	}
    });
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')
        
        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        res_data2.forEach((data) => {
            if(data.year == 2020){
                numPresentados = data.selectivity_presented_seville;
            }
        })

        res_data1.data.forEach((data) => {
            if(data.region.province == 'Andalusia'){
                stringAndalucia = 'Fallecidos totales en ' +  data.region.province;
                Andalucia.push(data);
            }
        })
        let muertesAndalucia = Andalucia[0].deaths;

        Highcharts.chart('container', {
  chart: {
    type: 'pie'
  },
  series: [{
    colorByPoint: true,
    data: [{
      name: stringAndalucia,
      y: muertesAndalucia,
      sliced: true,
      selected: true
    }, {
      name: 'Presentados selectividad 2020',
      y: numPresentados
    }
    ]
  }]
});

    }
    
</script>

<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js" on:load="{loadGraph}"></script>
</svelte:head>


<main>


    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description">
            Gráfica que muestra el nº de fallecidos totales en Andalucía por covid a día de hoy y el nº de presentados a selectividad en Sevilla en 2020
        </p>
    </figure>
</main>