<script>
    import Highcharts from 'highcharts';
    import {Container} from 'sveltestrap';
    import { onMount } from 'svelte';


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

        // Filtering by year 2018.
        dataCopy = dataCopy.filter(o => o.year === 2018);
        // X Axis
        let xAxisValues = dataCopy.map(o => o.center);
        // Y Axis
        let yAxisValues = dataCopy.map(o => o["total"]);


        console.log(dataCopy);
        console.log(xAxisValues);
        console.log(yAxisValues);

        Highcharts.chart('container', {
            title: {
                text: 'Presupuestos por centro en 2018'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Cuantías totales'
                }
            },

            xAxis: {
                categories: xAxisValues,
                title: {
                    text: 'Centros'
                }
            },
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
                    pointStart: 4
                }
            },

            series: [{
                name: 'Cuantía',
                data: yAxisValues,
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 1000
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

        dataCopy = data;
        // Filtering by year 2019.
        dataCopy = dataCopy.filter(o => o.year === 2019);
        // X Axis
        let xAxisValues2 = dataCopy.map(o => o.center);
        // Y Axis
        let yAxisValues2 = dataCopy.map(o => o["total"]);

        Highcharts.chart('container2', {
            title: {
                text: 'Presupuestos por centro en 2019'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Cuantías totales'
                }
            },

            xAxis: {
                categories: xAxisValues2,
                title: {
                    text: 'Centros'
                }
            },
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
                    pointStart: 0
                }
            },

            series: [{
                name: 'Cuantía',
                data: yAxisValues2
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 1000
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

        dataCopy = data;
        // Filtering by year 2020.
        dataCopy = dataCopy.filter(o => o.year === 2020);
        // X Axis
        let xAxisValues3 = dataCopy.map(o => o.center);
        // Y Axis
        let yAxisValues3 = dataCopy.map(o => o["total"]);

        Highcharts.chart('container3', {
            title: {
                text: 'Presupuestos por centro en 2020'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Cuantías totales'
                }
            },

            xAxis: {
                categories: xAxisValues3,
                title: {
                    text: 'Centros'
                }
            },
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
                    pointStart: 0
                }
            },

            series: [{
                name: 'Cuantía',
                data: yAxisValues3
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 1000
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

        dataCopy = data;
        // Filtering by year 2021.
        dataCopy = dataCopy.filter(o => o.year === 2021);
        // X Axis
        let xAxisValues4 = dataCopy.map(o => o.center);
        // Y Axis
        let yAxisValues4 = dataCopy.map(o => o["total"]);

        Highcharts.chart('container4', {
            title: {
                text: 'Presupuestos por centro en 2021'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Cuantías totales'
                }
            },

            xAxis: {
                categories: xAxisValues4,
                title: {
                    text: 'Centros'
                }
            },
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
                    pointStart: 0
                }
            },

            series: [{
                name: 'Cuantía',
                data: yAxisValues4
            }],

            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 1000
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
    });

</script>
    <main>
        <h4>Gráficas de presupuestos por centro</h4>
    </main>

<Container>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2018 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container2"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2019 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container3"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2020 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container4"></div>
        <p class="highcharts-description text-center">
            Se muestran los presupuestos por cada centro del <code>año 2021 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>