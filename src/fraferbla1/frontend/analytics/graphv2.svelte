<script>
async function load_api_graph(){
    let url_api = "/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science";
    let res_api = await fetch(url_api)
    let res_data = await res_api.json()
    let precios = []
    let asistentes = []
    let years = []
    res_data.forEach((d) =>{
        years.push(d.year)
        precios.push(d.price_admision)
        asistentes.push(d.selectivity_presented_seville)
    });
    console.log(years)
    console.log(precios)
    console.log(asistentes)

    //Propiedades del grafico
    let c = {
        type:'bar',
        data: {labels:years, 
        datasets:[
            {label:'Precios',data:precios},
            {label:'Asistentes',data:asistentes}
        ]}
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

load_api_graph()
</script>

<main>
    <h1>Grafico que muestra el precio de la matrícula del grado de Ingeniería informática y los asistentes de selectividad cada año</h1>
    <body>
        <img src="" id="graph"/>
    </body>

</main>

<svelte:head>

</svelte:head>

<style>

</style>