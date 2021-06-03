<script>
    let frase;
    async function loadGraph(){

        let Datas = [];
        let myData={
            name: 'Nota de corte',
            data: []
        };

        let res1 = await fetch("https://numbersapi.p.rapidapi.com/2017/year?json=true&fragment=true", {
	"method": "GET",
	"headers": {
		"x-rapidapi-key": "1e9f511ec0msh4589404febe3c78p1bb28bjsnb97a048b0ff2",
		"x-rapidapi-host": "numbersapi.p.rapidapi.com"
	}
    });
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts')
        
        let res_data1 = await res1.json()
        let res_data2 = await res2.json()
        console.log(res_data1)

        frase = res_data1.text;

        res_data2.forEach((data) => {
            if(data.year == 2017){
                myData['data'].push({
                    name:data.degree  + " " +data.year,
                    value: data.cut_off_mark
            });
            }
        });
        
        Datas.push(myData);


        Highcharts.chart('container', {
    chart: {
        type: 'packedbubble',
        height: '100%'
    },
    title: {
        text: frase
    },
    tooltip: {
        useHTML: true,
        pointFormat: '<b>{point.name}:</b> {point.value}'
    },
    plotOptions: {
        packedbubble: {
            minSize: '30%',
            maxSize: '100%',
            zMin: 0,
            zMax: 1000,
            layoutAlgorithm: {
                splitSeries: false,
                gravitationalConstant: 0.02
            },
            dataLabels: {
                enabled: true,
                format: '{point.name}',
                filter: {
                    property: 'y',
                    operator: '>',
                    value: 250
                },
                style: {
                    color: 'black',
                    textOutline: 'none',
                    fontWeight: 'normal'
                }
            }
        }
    },
    series: Datas
});

    }
    
</script>

<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/highcharts-more.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js"on:load="{loadGraph}"></script>    
</svelte:head>


<main>

    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description">
            Gráfica que muestra las notas de corte de grados de la US en 2017 la cual tiene como título acontecimientos aleatorios que sucedieron en 2017
        </p>
    </figure>
</main>

<style>
    .highcharts-figure {
    min-width: 320px; 
    max-width: 1000px;
    margin: 1em auto;
    }
</style>