<script>

    let array = [];
    let arrayLabel = [];

    async function loadChart(){
        let res1 = await (await fetch("/fraferbla1/proxyRequest/covid-india"));
        await fetch('https://sos2021-08.herokuapp.com/api/v1/statewisetestingdetails/loadInitialData');

        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science')

        let res_data1 = await res1.json()
        let res_data2 = await res2.json()

        res_data1.forEach((data) => {

            array.push(data.positive);
            arrayLabel.push(data.state + ' positivos');
        });

        res_data2.forEach((data) => {

            array.push(data.cut_off_mark);
            arrayLabel.push(data.degree + ' nota de corte');
        });


const data = {
  labels: arrayLabel,
  datasets: [
    {
      label: 'Dataset 1',
      data: array,
      backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ]
    }
  ]
};

        const config = {
  type: 'doughnut',
  data: data,
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Gráfica que muestra el nº de pruebas positivas de covid en la India en diferentes estados y la nota de corte de varios años del grado de Ing. informática en la US'
      }
    }
  },
};

        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, config);

    }
</script>

<main>
    <canvas id="myChart" width="400" height="400"></canvas>

</main>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" on:load={loadChart}></script>
</svelte:head>