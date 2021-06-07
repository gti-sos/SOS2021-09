
<script>
async function loadChart(){

    let res1 = await fetch('https://sos2021-07.herokuapp.com/api/v2/buy_sell');
    await fetch('https://sos2021-07.herokuapp.com/api/v2/buy_sell/loadInitialData');

    let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')



    let res_data1 = await res1.json()
    let res_data2 = await res2.json()

    let desahucios = [];
    let precio = [];
    let anyos = [];
    let total_label;
    let total_label2;

    res_data1.forEach((data) => {
            if(data.province == "sevilla"){
                desahucios.push(data.eviction);
                anyos.push(data.year);
                total_label = 'Nº desahucios en ' + data.province;
            }
        })

    let anyo = anyos[0];

    res_data2.forEach((data) => {
            if(data.degree == "Computer-Science" && data.year == anyo){
                precio.push(data.price_admision);
                total_label2 = 'Precio matrícula del grado ' + data.degree;
            }
        })

    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: anyos,
        datasets: [{
            label: total_label,
            data: desahucios,
            borderWidth: 1 
        }, {
            label: total_label2,
            data: precio,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
}
</script>

<main>
    <h1>Gráfico que muestra el nº de desahucios en Sevilla y el precio de la matrícula del grado de Ingeniería informática en la US en el año 2017</h1>
    <canvas id="myChart" width="400" height="400"></canvas>
</main>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" on:load={loadChart}></script>
</svelte:head>