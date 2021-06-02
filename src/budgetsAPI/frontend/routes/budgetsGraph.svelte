<script>
    import Highcharts from 'highcharts';
    import {Container} from 'sveltestrap';
    import { onMount } from 'svelte';
    import ApexCharts from 'apexcharts'


    async function getBudgets(){
        console.log("Fetching budgets...");
        const res = await fetch("/api/v2/budgets-by-centers-us/budgets");

        if(res.ok){
            console.log("Ok.");
            return await res.json();
        }else{
            console.log("Error!");
        }
    }

    onMount(async () => {
        let data = await getBudgets();
        let dataCopy = data;


        // ------------------ BIBLIOTECA HIGHCHARTS ------------------

        // Filtering by year 2018.
        dataCopy = dataCopy.filter(o => o.year === 2018);

        var yAxisValuesColum = dataCopy.map(function(obj){
            var rObj = {};
            rObj["name"] = obj["center"];
            rObj["y"] = obj["total"];
            return rObj;
        });
        
        // console.log(dataCopy);
        // console.log(yAxisValuesColum);

        // 2018
        Highcharts.chart('container_Colum2018', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Presupuesto total por centro de la US, Año 2018'
            },
            subtitle: {
                text: 'Cantidades expresadas en miles de euros'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Cuantía total'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}'
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> €<br/>'
            },
            series: [
                {
                        name: 'Cuantía',
                        colorByPoint: true,
                        data: yAxisValuesColum,
                }
            ]
        });

        dataCopy = data;
        // Filtering by year 2019.
        dataCopy = dataCopy.filter(o => o.year === 2019);

        var yAxisValuesColum2019 = dataCopy.map(function(obj){
            var rObj = {};
            rObj["name"] = obj["center"];
            rObj["y"] = obj["total"];
            return rObj;
        });

        // 2019
        Highcharts.chart('container_Colum2019', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Presupuesto total por centro de la US, Año 2019'
            },
            subtitle: {
                text: 'Cantidades expresadas en miles de euros'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Cuantía total'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}'
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> €<br/>'
            },
            series: [
                {
                        name: 'Cuantías',
                        colorByPoint: true,
                        data: yAxisValuesColum2019,
                }
            ]
        });


        dataCopy = data;
        // Filtering by year 2020.
        dataCopy = dataCopy.filter(o => o.year === 2020);

        var yAxisValuesColum2020 = dataCopy.map(function(obj){
            var rObj = {};
            rObj["name"] = obj["center"];
            rObj["y"] = obj["total"];
            return rObj;
        });

        // 2020
        Highcharts.chart('container_Colum2020', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Presupuesto total por centro de la US, Año 2020'
            },
            subtitle: {
                text: 'Cantidades expresadas en miles de euros'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Cuantía total'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}'
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> €<br/>'
            },
            series: [
                {
                        name: 'Cuantías',
                        colorByPoint: true,
                        data: yAxisValuesColum2020,
                }
            ]
        });

        dataCopy = data;
        // Filtering by year 2021.
        dataCopy = dataCopy.filter(o => o.year === 2021);

        var yAxisValuesColum2021 = dataCopy.map(function(obj){
            var rObj = {};
            rObj["name"] = obj["center"];
            rObj["y"] = obj["total"];
            return rObj;
        });

        // 2021
        Highcharts.chart('container_Colum2021', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Presupuesto total por centro de la US, Año 2021'
            },
            subtitle: {
                text: 'Cantidades expresadas en miles de euros'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Cuantía total'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}'
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> €<br/>'
            },
            series: [
                {
                        name: 'Cuantías',
                        colorByPoint: true,
                        data: yAxisValuesColum2021,
                }
            ]
        });

        // ------------------ AWSOME - CHARTS Apexcharts ------------------

                //console.log(yAxisValuesAwsomeCharts);

        // var yAxisValuesAwsomeCharts = dataCopy.map(function(obj) {
        //     var fObj = {};
        //     fObj["name"] = obj["center"];
        //     fObj["data"] = obj["total"];
        //     fObj["year"] = obj["year"];
        //     return fObj;
        // });

        dataCopy = data;
        // Obtaining centers:
        var centers_awesome_chart = Array.from(new Set(dataCopy.map(o => o["center"])));
        console.log(centers_awesome_chart);
        console.log(dataCopy.filter(o => o["year"] == 2018 && o["center"] == "INSTID"));

        var yearsProv = Array.from(new Set(dataCopy.map(o => o["year"]))).sort();
        var centersProv = Array.from(new Set(dataCopy.map(o => o["center"])));

        var yAxisValuesAwsomeCharts = [];
        for(let i in yearsProv) {
            let total_per_center = [];
            for(let j in centersProv) {
                let res = dataCopy.filter(o => o["year"] == yearsProv[i] &&
                    o["center"] == centersProv[j]);

                    if(res.length == 0) {
                        total_per_center.push(0);
                    } else {
                        total_per_center.push(res.map(o => o["total"])[0]);
                    }
            }
            console.log(total_per_center);
            yAxisValuesAwsomeCharts.push(
                {
                    name: yearsProv[i],
                    data: total_per_center
                }
            );
        }

        console.log(yAxisValuesAwsomeCharts);

        var options = {
          series: yAxisValuesAwsomeCharts,
          chart: {
          type: 'bar',
          height: 350
        },
        title: {
            text: 'Presupuesto total por centro de la US, genérico de años'
        },
        subtitle: {
            text: 'Cantidades expresadas en miles de euros'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '60%',
            endingShape: 'rounded'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: centers_awesome_chart
        },
        yaxis: {
          title: {
            text: 'Cuantía en Miles de Euros'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return new Intl.NumberFormat("es-ES").format(val) + " Miles de Euros"
            }
          }
        }
        };

        var chart_awesome = new ApexCharts(document.querySelector("#chart_awesome"), options);
        chart_awesome.render();
    });


</script>
    <main>
        <h4>Gráficas de presupuestos por centro</h4>
    </main>

<!-- Highcharts charts -->
<Container>
    <figure class="highcharts-figure">
        <div id="container_Colum2018"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2018 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container_Colum2019"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2019 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container_Colum2020"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2020 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container_Colum2021"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2021 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<!-- Awesome charts -->
<Container>
    <figure class="awesomecharts-figure"></figure>
    <div id="chart_awesome" width="1700" height="600"></div>
    <p class="awsomecharts-description text-center">
        Se muestran los presupuestos por cada centro y año
        en la <code>Universidad de Sevilla.</code>
    </p>
</Container>