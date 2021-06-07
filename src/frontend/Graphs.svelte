<script>
    import Highcharts from 'highcharts';
    import {Container} from 'sveltestrap';
    import {getAllRecords} from './../dansesben/frontend/routes/API';
    import { onMount } from 'svelte';

    onMount(async () => {

        //DANI
        await fetch("/api/v2/performances-by-degrees-us/loadInitialData");
        let dataDansesben = await getAllRecords();
        dataDansesben = dataDansesben.filter(o => o.center === "ETSII" && o["field-of-knowledge"] === "Computer-Science");
        dataDansesben = dataDansesben.sort(function(a, b) {
            if (a.year < b.year) return -1;
            if (a.year > b.year) return 1;
            return 0;
        });

        // ADRI
        async function getBudgets(){
            console.log("Fetching budgets...");
            await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
            await fetch("/api/v2/budgets-by-centers-us/");
            const res = await fetch("/api/v2/budgets-by-centers-us/budgets");

            if(res.ok){
                console.log("Ok.");
                return await res.json();
            }else{
                console.log("Error!");
            }
        }
        let dataBudgets = await getBudgets();
        dataBudgets = dataBudgets.filter(o => o.center === "ETSII");
        // dataBudgets = dataBudgets.sort(function(a, b) {
        //     if (a.year < b.year) return -1;
        //     if (a.year > b.year) return 1;
        //     return 0;
        // });


        // X Axis (Range of years)
        let xAxisValues = dataDansesben.map(o => o.year);
        let rangeStart = Math.min(...xAxisValues);

        // DANI
        // Y Axis
        let yAxisValuesDansesben = dataDansesben.map(o => o["credits-passed"]);

        // ADRI
        // Y Axis
        let yAxisValuesBudgets = dataBudgets.map(o => o["total"]);

        // FRAN
        let res2 = await fetch('/api/v2/cut-off-marks-by-degrees-us/cuts?degree=Computer-Science');
        let arrayFran = [];

        let res_data2 = await res2.json();

        res_data2.forEach((data) => {
            if(data.year == 2017){
                arrayFran.push(data.cut_off_mark);
            }
            if(data.year == 2018){
                arrayFran.push(data.cut_off_mark);
            }
            if(data.year == 2019){
                arrayFran.push(data.cut_off_mark);
            }
            if(data.year == 2020){
                arrayFran.push(data.cut_off_mark);
            }
        });

        console.log(arrayFran)


        Highcharts.chart('container', {
            title: {
                text: 'Relacion fuentes de datos'
            },

            subtitle: {
                text: ''
            },

            yAxis: [{
                title: {
                    text: 'Número de créditos aprobados'
                }
            },
            {
                title: {
                    text: 'Número de aprobados'
                }
            }],

            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                    pointStart: rangeStart
                }
            },

            series: [{
                axis: 0,
                name: 'Ingeniería informática',
                data: yAxisValuesDansesben,
                tooltip: {
                    valueSuffix: ' creditos'
                }
            },
            {
                axis: 1,
                name: 'ETSII',
                data: yAxisValuesBudgets,
                tooltip: {
                    valueSuffix: ' cuantía total'
                }
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });

        Highcharts.chart('container-2', {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Relacion fuentes de datos'
            },

            yAxis: {
                min: 0,
                title: {
                    text: 'Valores',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },

            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                    pointStart: rangeStart
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

            series: [{
                axis: 0,
                name: 'Ingeniería informática',
                data: yAxisValuesDansesben,
                    tooltip: {
                        valueSuffix: ' creditos'
                    }
                },
                {
                axis: 1,
                name: 'ETSII',
                data: yAxisValuesBudgets,
                tooltip: {
                    valueSuffix: ' cuantía total'
                }
                },{
                axis: 2,
                name: 'Nota corte Ing. informática',
                data: arrayFran
                
            }]
        });
    });

</script>

<Container>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description text-center">
            Se muestra la relacion diferentes fuentes de datos
        </p>
    </figure>
    <figure class="highcharts-figure">
        <div id="container-2"></div>
        <p class="highcharts-description text-center">
            Se muestra la relacion diferentes fuentes de datos
        </p>
    </figure>
</Container>