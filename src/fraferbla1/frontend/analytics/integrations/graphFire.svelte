<script>
    async function loadData() {
        let res1 = await fetch ('https://sos2021-21.herokuapp.com/api/v2/fire-stats');
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')
        
        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        let paises = []
        let carreras = []
        let precio = [];
        let numIncendio = [];

        let total_label = [];
        let total_data = [];

        //Meter pais de la api fire
        res_data1.forEach((data) => {
            paises.push(data.country+"-"+data.year+"-Incendios")
            numIncendio.push(data.fire_nfc)
        })

        res_data2.forEach((data) => {
            carreras.push(data.degree+"-"+data.year+"-Precio matricula")
            precio.push(data.price_admision);
        })


        let cont = 0;
        paises.forEach((data) =>{
            total_label.push(data)
        })
        carreras.forEach((data) =>{
            total_label.push(data)
        })
        numIncendio.forEach((data) =>{
            total_data.push(data)
        })
        console.log(total_data)
        precio.forEach((data) =>{
            total_data.push(data)
        })

        console.log(total_data)

        let c  = {
        type: 'doughnut',
        data: {
            datasets: [
            {
                data: total_data
            },
            ],
            labels: total_label,
        },
        options: {
            title: {
            display: true,
            text: 'Chart.js Doughnut Chart',
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
    <h1>Gráfico que muestra el nº de incendios en algunos países y el nº de presentados en selectividad en Sevilla</h1>
    <body>
        <img src="" id="graph"/>
    </body>
</main>

<svelte:head>

</svelte:head>