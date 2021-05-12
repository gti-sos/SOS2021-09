<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';
    import {apiData} from './stores.js';
import { get } from 'svelte/store';
    

    let newSurrender ={
        degree: "",
        year: "",
        surrender_counts: null,
        new_students: null,
        surrender_percent: null,
        center: ""
    };

    // CREAR RECURSOS F08 PR P1B1.
    async function insertSurrender(){
        console.log("Inserting surrender "+ JSON.stringify(newSurrender));
        var newSurrenderYear = parseInt(newSurrender.year);
        var newSurrenderCounts = parseInt(newSurrender.surrender_counts);
        var newSurrenderNewStudents = parseInt(newSurrender.new_students);
        var newSurrenderPercent = parseFloat(newSurrender.surrender_percent);

      
        newSurrender.year = newSurrenderYear;
        newSurrender.surrender_counts = newSurrenderCounts;
        newSurrender.new_students = newSurrenderNewStudents;
        newSurrender.surrender_percent = newSurrenderPercent;
        console.log(newSurrender);

        let res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders/",
                            {
                                method: "POST",
                                body: JSON.stringify(newSurrender),
                                headers:{
                                    "Content-Type": "application/json"
                                }
                            }
                           );

        if(res.status === 400) {
            window.alert("Datos introducidos incorrectamente. Introduzcalos de nuevo, por favor.");
        }
        if(res.status === 201) {
            window.alert("Abandono añadido");
        }
        if(res.status === 409) {
            window.alert("Ese Abandono ya existe, no puede duplicarse");
        }
        getSurrenders();
    }
    
    // LISTAR TODOS LOS RECURSOS F08 PR P1B2.
    let surrenders = [];
    let errorMsg = "";
    
    export async function getSurrenders(){
        console.log("Fetching surrenders...");
        const res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders/");

        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            surrenders = json;
            console.log(`We have received ${surrenders.length} surrenders.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
            if(res.status === 404) {
                window.alert("Abandonos no encontrados");
            }
            if(res.status === 500 || res.status === 503) {
                window.alert("Aplicación/servidor no disponible en este momento");
            }
        }

        if(res.status === 200) {
            window.alert("Abandonos obtenidos");
        }
    }

    let limit;
    let offset = 0;
    let page = 1;

    // UNA FORMA DE PAGINAR EL LISTADO DE RECURSOS PR1b6 ENTREGABLE 2
    async function getSurrendersP(limit, offset){
        console.log("Fetching surrenders as selected...");
        const res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders?limit=" + limit + "&offset=" + offset);
        console.log(limit + " || " + offset);
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            surrenders = json;
            console.log(`We have received ${surrenders.length} surrenders.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
        }
    }

    // BORRAR TODOS LOS RECURSOS F08 PR P1B3.
    async function deleteSurrenders(){
        console.log("Deleting all surrenders...");

        const res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders/",
                            {
                                method: "DELETE"
                            }
                           );

        console.log("All surrenders deleted...");
        if(res.status === 200) {
            window.alert("Abandonos borrados");
        }
        window.location.reload();
    }

    // BORRAR UN RECURSO CONCRETO F08 PR P1B4.
    async function deleteSurrender(surrenderDegree, surrenderYear){
        console.log("Deleting contact with Degree " + surrenderDegree + " and year: " + surrenderYear);

        const res = await fetch("/api/v2/surrenders-by-degrees-us/surrenders/"+ surrenderDegree + "/" + surrenderYear,
                            {
                                method: "DELETE"
                            }
                           );

        if(res.status === 404) {
            window.alert("Abandono no encontrado");
        }

        if(res.status === 200) {
            window.alert("Abandono borrado");
        }
        window.location.reload();
    }

    // Carga de recursos
    async function loadSurrenders() {
        console.log("Loading initial data...");
        const res = await fetch("/api/v2/surrenders-by-degrees-us/loadInitialData");
        // const res = await fetch("/api/v1/surrenders-by-centers-us/loadInitialData",
        //                     {
        //                         method: "GET"
        //                     }
        //                    );
        if(res.status === 201) {
            window.alert("Abandonos cargados");
        }
        window.location.reload();
    }

    onMount(getSurrenders);
</script>

<main>
    <h3>Abandonos por grado</h3>
    <Row>
        <Col>
            <InputGroupAddon addonType="prepend">
                <InputGroupText>Elementos por página</InputGroupText>
                <Button on:click={loadSurrenders}>Cargar Abandonos</Button>
                <a href="#/surrenders/search"><button type="button">Buscar Abandono</button></a>
            </InputGroupAddon>

            <Input type="select" id= "elementospag" name= "elementospag" bind:value={limit} on:change={
                () => {getSurrendersP(document.getElementById("elementospag").value, offset)}}>
                <option value="" disabled selected> Seleccione elementos por página</option>
                <!-- <option value=2>2</option>
                <option value=5>5</option> -->
                <option value=10>10</option>
                <!-- <option value=25>25</option> -->
            </Input>
        </Col>
    </Row>
    <Table bordered>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Número de abandonos</td>
                <td>Nuevos estudiantes</td>
                <td>Porcentaje de abandonos</td>
                <td>Centros</td>
                <td>Acción</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input placeholder="Ej: History" bind:value="{newSurrender.degree}"></td>
                <td><input placeholder="Ej: 2021" bind:value= {newSurrender.year}></td>
                <td><input placeholder="Ej: 133" bind:value="{newSurrender.surrender_counts}"></td>
                <td><input placeholder="Ej: 267" bind:value="{newSurrender.new_students}"></td>
                <td><input placeholder="Ej: 5647.3" bind:value="{newSurrender.surrender_percent}"></td>
                <td><input placeholder="Ej: ETSII" bind:value="{newSurrender.center}"></td>
                <td><Button on:click={insertSurrender}>Añadir</Button></td>
            </tr>
            {#each surrenders as surrender}
                <tr>
                    <td><a href="#/surrenders/{surrender.degree}/{surrender.year}">{surrender.center}</a></td>
                    <td>{surrender.year}</td>
                    <td>{surrender.surrender_counts}</td>
                    <td>{surrender.new_students}</td>
                    <td>{surrender.surrender_percent}</td>
                    <td>{surrender.center}</td>
                    <td><Button on:click={deleteSurrender(surrender.degree, surrender.year)}>Borrar</Button></td>
                </tr>
            {/each}
        </tbody>
    </Table>
    <Button on:click={deleteSurrenders}>Borrar Abandonos</Button>

    <div class="float-right">
        <InputGroup>
            <Button on:click={() => {
                                        page--;
                                        offset = parseInt(offset, 10) - parseInt(limit, 10); 
                                        getSurrendersP(limit, parseInt(offset, 10));
                                    }
            }>Anterior</Button>
            <InputGroupText class="bg-transparent">{page}</InputGroupText>
            <Button on:click={() => {
                                        page++;
                                        offset = parseInt(limit, 10) + 0;
                                        getSurrendersP(limit, parseInt(offset, 10));
                                    }
            }>Siguiente</Button>
            
        </InputGroup>
    </div>
</main>
