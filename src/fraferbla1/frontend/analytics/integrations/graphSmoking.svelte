<script>
    async function loadData() {
        let res1 = await fetch('https://sos2021-11.herokuapp.com/api/v2/smoking_stats/');
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')
        
        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        let smokingPopulation = [];
        let cutNota = [];
        let datos = [];
        let total_label = [];
        let aux = 0;

        res_data1.forEach((data) => {
            if(data.country == "Spain" && aux == 0){
                smokingPopulation.push(data.smoking_population);
                total_label.push(data.country+"-Porcentaje fumadores")
                aux = 1;
            }
        })
        
        smokingPopulation.forEach((data) => {
           datos.push(data);
        })

        res_data2.forEach((data) => {
            if(data.year == 2017){
                cutNota.push(data.cut_off_mark);
                total_label.push(data.degree+"-Nota de corte");
            }
        })
        
        cutNota.forEach((data) => {
           datos.push(data);
        })

        console.log(datos)


        let c = {
  type: 'polarArea',
  data: {
    datasets: [
      {
        data: datos,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        label: 'My dataset',
      },
    ],
    labels: total_label,
  },
  options: {
    legend: {
      position: 'right',
    },
    title: {
      display: true,
      text: 'Chart.js Polar Area Chart',
    },
  },

}
let url = "https://quickchart.io/chart?c="+JSON.stringify(c)
    let res = await fetch(url)
    if(res.ok){
        console.log("Respuesta OK")
        console.log(res)
        let url = res["url"]
        document.getElementById("graph").src = url;

    }else{
        console.log("Error")
    }    
    }



    
    loadData();

</script>

<main>
    <h1>Gráfico que muestra el porcentaje de fumadores en España y la nota de corte de Ingeniería informática en la US en el año 2017</h1>
    <body>
        <img src="" id="graph"/>
    </body>
</main>

<svelte:head>

</svelte:head>