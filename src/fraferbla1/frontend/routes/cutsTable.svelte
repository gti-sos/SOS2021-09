<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';
    import {apiData} from './stores.js';
import { get } from 'svelte/store';
    
    let newCut ={
        degree: "",
        year: "",
        cut_off_mark: null,
        selectivity_presented_seville: null,
        price_admision: null,
        faculty: null
    };
    // CREAR RECURSOS F08 PR P1B1.
    async function insertCut(){
        console.log("Inserting cut "+ JSON.stringify(newCut));
        var newCutYear = parseInt(newCut.year);
        var newCutCutOffs = parseFloat(newCut.cut_off_mark);
        var newCutSelectPresented = parseFloat(newCut.selectivity_presented_seville);
        var newCutPrice = parseFloat(newCut.price_admision);
        var newCutFaculty = parseFloat(newCut.total);
        newCut.year = newCutYear;
        newCut.cut_off_mark = newCutCutOffs;
        newCut.selectivity_presented_seville = newCutSelectPresented;
        newCut.price_admision = newCutPrice;
        newCut.total = newCutFaculty;
        console.log(newCut);
        let res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts",
                            {
                                method: "POST",
                                body: JSON.stringify(newCut),
                                headers:{
                                    "Content-Type": "application/json"
                                }
                            }
                           );
        if(res.status === 400) {
            window.alert("Datos introducidos incorrectamente. Introduzcalos de nuevo, por favor.");
        }
        if(res.status === 201) {
            window.alert("Dato añadido");
        }
        if(res.status === 409) {
            window.alert("Ese dato ya existe, no puede duplicarse");
        }
        getCuts();
    }
    
    // LISTAR TODOS LOS RECURSOS F08 PR P1B2.
    let cuts = [];
    let errorMsg = "";
    
    export async function getCuts(){
        console.log("Fetching cuts...");
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts");
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            cuts = json;
            console.log(`We have received ${cuts.length} cuts.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
            if(res.status === 404) {
                window.alert("Datos no encontrados");
            }
            if(res.status === 500 || res.status === 503) {
                window.alert("Aplicación/servidor no disponible en este momento");
            }
        }
        if(res.status === 200) {
            window.alert("Datos obtenidos");
        }
    }
    let limit;
    let offset = 0;
    let page = 1;
    // UNA FORMA DE PAGINAR EL LISTADO DE RECURSOS PR1b6 ENTREGABLE 2
    async function getCutsP(limit, offset){
        console.log("Fetching cuts as selected...");
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts?limit=" + limit + "&offset=" + offset);
        console.log(limit + " || " + offset);
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            cuts = json;
            console.log(`We have received ${cuts.length} cuts.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
        }
    }
    // BORRAR TODOS LOS RECURSOS F08 PR P1B3.
    async function deletecuts(){
        console.log("Deleting all cuts...");
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts",
                            {
                                method: "DELETE"
                            }
                           );
        console.log("All cuts deleted...");
        if(res.status === 200) {
            window.alert("Datos borrados");
        }
        window.location.reload();
    }
    // BORRAR UN RECURSO CONCRETO F08 PR P1B4.
    async function deleteCut(cutdegree, cutYear){
        console.log("Deleting contact with degree " + cutdegree + " and year: " + cutYear);
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts/"+ cutdegree + "/" + cutYear,
                            {
                                method: "DELETE"
                            }
                           );
        if(res.status === 404) {
            window.alert("Dato no encontrado");
        }
        if(res.status === 200) {
            window.alert("Dato borrado");
        }
        window.location.reload();
    }
    // Carga de recursos
    async function loadcuts() {
        console.log("Loading initial data...");
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/loadInitialData");
        // const res = await fetch("/api/v1/cut-off-marks-by-degrees-us/loadInitialData",
        //                     {
        //                         method: "GET"
        //                     }
        //                    );
        if(res.status === 201) {
            window.alert("Datos cargados");
        }
        window.location.reload();
    }
    onMount(getCuts);
</script>

<main>
    <h3>Datos por grado</h3>
    <Row>
        <Col>
            <InputGroupAddon addonType="prepend">
                <InputGroupText>Elementos por página</InputGroupText>
                <Button on:click={loadcuts}>Cargar Datos</Button>
                <a href="#/cuts/search"><button type="button">Buscar Dato</button></a>
            </InputGroupAddon>

            <Input type="select" id= "elementospag" name= "elementospag" bind:value={limit} on:change={
                () => {getCutsP(document.getElementById("elementospag").value, offset)}}>
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
                <td>Nota de corte</td>
                <td>Presentados en selectividad</td>
                <td>Precio de matrícula</td>
                <td>Facultad</td>
                <td>Acción</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input placeholder="Ej: ETSII" bind:value="{newCut.degree}"></td>
                <td><input placeholder="Ej: 2021" bind:value= {newCut.year}></td>
                <td><input placeholder="Ej: 3553.1" bind:value="{newCut.cut_off_mark}"></td>
                <td><input placeholder="Ej: 13569.1" bind:value="{newCut.selectivity_presented_seville}"></td>
                <td><input placeholder="Ej: 5647.3" bind:value="{newCut.price_admision}"></td>
                <td><input placeholder="Ej: 465675.2" bind:value="{newCut.total}"></td>
                <td><Button on:click={insertCut}>Añadir</Button></td>
            </tr>
            {#each cuts as cut}
                <tr>
                    <td><a href="#/cuts/{cut.degree}/{cut.year}">{cut.degree}</a></td>
                    <td>{cut.year}</td>
                    <td>{cut.cut_off_mark}</td>
                    <td>{cut.selectivity_presented_seville}</td>
                    <td>{cut.price_admision}</td>
                    <td>{cut.total}</td>
                    <td><Button on:click={deleteCut(cut.degree, cut.year)}>Borrar</Button></td>
                </tr>
            {/each}
        </tbody>
    </Table>
    <Button on:click={deletecuts}>Borrar Datos</Button>

    <div class="float-right">
        <InputGroup>
            <Button on:click={() => {
                                        page--;
                                        offset = parseInt(offset, 10) - parseInt(limit, 10); 
                                        getCutsP(limit, parseInt(offset, 10));
                                    }
            }>Anterior</Button>
            <InputGroupText class="bg-transparent">{page}</InputGroupText>
            <Button on:click={() => {
                                        page++;
                                        offset = parseInt(limit, 10) + 0;
                                        getCutsP(limit, parseInt(offset, 10));
                                    }
            }>Siguiente</Button>
            
        </InputGroup>
    </div>
</main>