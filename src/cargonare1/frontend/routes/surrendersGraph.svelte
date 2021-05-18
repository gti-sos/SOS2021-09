<script>
    import Highcharts from 'highcharts';
    import {Container} from 'sveltestrap';
    import { onMount } from 'svelte';


    async function getSurrenders(){
        console.log("Fetching surrenders...");
        const res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders/");

        if(res.ok){
            console.log("Ok.");
            return await res.json();
        }else{
            console.log("Error!");
        }
    }

    onMount(async () => {
        let data = await getSurrenders();
        let dataCopy = data;

        // Filtering by year 2018.
        dataCopy = dataCopy.filter(o => o.year === 2018);
        // X Axis
        let xAxisValues = dataCopy.map(o => o.new_students);
        // Y Axis
        let yAxisValues = dataCopy.map(o => o.surrender_counts);


        console.log(dataCopy);
        console.log(xAxisValues);
        console.log(yAxisValues);

        Highcharts.chart('container', {
            title: {
                text: 'Abandonos por grado en 2018'
            },

            subtitle: {
                text: 'Nuevos estudiantes'
            },

            yAxis: {
                title: {
                    text: 'Número de abandonos'
                }
            },

            xAxis: {
                categories: xAxisValues,
                title: {
                    text: 'Grado'
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
                name: 'Número de abandonos',
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
        let xAxisValues2 = dataCopy.map(o => o.new_students);
        // Y Axis
        let yAxisValues2 = dataCopy.map(o => o.surrender_counts);

        Highcharts.chart('container2', {
            title: {
                text: 'Abandonos por grado en 2019'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Número de abandonos'
                }
            },

            xAxis: {
                categories: xAxisValues2,
                title: {
                    text: 'Nuevos estudiantes '
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
                name: 'Número de abandonos',
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
        let xAxisValues3 = dataCopy.map(o => o.new_students);
        // Y Axis
        let yAxisValues3 = dataCopy.map(o => o.surrender_counts);

        Highcharts.chart('container3', {
            title: {
                text: 'Abandonos por grado en 2020'
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
                    text: 'Nuevos estudiantes'
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
                name: 'Número de abandonos',
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
          let xAxisValues4 = dataCopy.map(o => o.new_students);
        // Y Axis
        let yAxisValues4 = dataCopy.map(o => o.surrender_counts);

        Highcharts.chart('container4', {
            title: {
                text: 'Abandonos por centro en 2021'
            },

            subtitle: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'Número de abandonos'
                }
            },

            xAxis: {
                categories: xAxisValues4,
                title: {
                    text: 'Número de estudiantes'
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
                name: 'Número de abandonos',
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
        <h4>Gráficas de abandonos por grado</h4>
    </main>

<Container>
    <figure class="highcharts-figure">
        <div id="container"></div>
        <p class="highcharts-description text-center">
            Se muestran los abandonos por cada centro del <code>año 2018 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container2"></div>
        <p class="highcharts-description text-center">
            Se muestran los abandonos por cada centro del <code>año 2019 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container3"></div>
        <p class="highcharts-description text-center">
            Se muestran los abandonos por cada centro del <code>año 2020 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>

<Container>
    <figure class="highcharts-figure">
        <div id="container4"></div>
        <p class="highcharts-description text-center">
            Se muestran los abandonos por cada centro del <code>año 2021 </code>
            en la <code>Universidad de Sevilla.</code>
        </p>
    </figure>
</Container>