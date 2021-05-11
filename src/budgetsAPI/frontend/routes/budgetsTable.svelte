<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';
    import {apiData} from './stores.js';
import { get } from 'svelte/store';
    

    let newBudget ={
        center: "",
        year: "",
        fixed_fees: null,
        amounts_by_number_of_etc: null,
        amounts_by_number_of_proffessors: null,
        total: null
    };

    // CREAR RECURSOS F08 PR P1B1.
    async function insertBudget(){
        console.log("Inserting budget "+ JSON.stringify(newBudget));
        var newBudgetYear = parseInt(newBudget.year);
        var newBudgetFixedFees = parseFloat(newBudget.fixed_fees);
        var newBudgetAmountsByETC = parseFloat(newBudget.amounts_by_number_of_etc);
        var newBudgetByProffesors = parseFloat(newBudget.amounts_by_number_of_proffessors);
        var newBudgetTotal = parseFloat(newBudget.total);
        newBudget.year = newBudgetYear;
        newBudget.fixed_fees = newBudgetFixedFees;
        newBudget.amounts_by_number_of_etc = newBudgetAmountsByETC;
        newBudget.amounts_by_number_of_proffessors = newBudgetByProffesors;
        newBudget.total = newBudgetTotal;
        console.log(newBudget);

        let res = await fetch("/api/v2/budgets-by-centers-us/budgets",
                            {
                                method: "POST",
                                body: JSON.stringify(newBudget),
                                headers:{
                                    "Content-Type": "application/json"
                                }
                            }
                           );

        if(res.status === 400) {
            window.alert("Datos introducidos incorrectamente. Introduzcalos de nuevo, por favor.");
        }
        if(res.status === 201) {
            window.alert("Presupuesto añadido");
        }
        if(res.status === 409) {
            window.alert("Ese presupuesto ya existe, no puede duplicarse");
        }
        getBudgets();
    }
    
    // LISTAR TODOS LOS RECURSOS F08 PR P1B2.
    let budgets = [];
    let errorMsg = "";
    
    export async function getBudgets(){
        console.log("Fetching budgets...");
        const res = await fetch("/api/v2/budgets-by-centers-us/budgets");

        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            budgets = json;
            console.log(`We have received ${budgets.length} budgets.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
            if(res.status === 404) {
                window.alert("Presupuestos no encontrados");
            }
            if(res.status === 500 || res.status === 503) {
                window.alert("Aplicación/servidor no disponible en este momento");
            }
        }

        if(res.status === 200) {
            window.alert("Presupuestos obtenidos");
        }
    }

    let limit;
    let offset = 0;
    let page = 1;

    // UNA FORMA DE PAGINAR EL LISTADO DE RECURSOS PR1b6 ENTREGABLE 2
    async function getBudgetsP(limit, offset){
        console.log("Fetching budgets as selected...");
        const res = await fetch("/api/v2/budgets-by-centers-us/budgets?limit=" + limit + "&offset=" + offset);
        console.log(limit + " || " + offset);
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            budgets = json;
            console.log(`We have received ${budgets.length} budgets.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
        }
    }

    // BORRAR TODOS LOS RECURSOS F08 PR P1B3.
    async function deleteBudgets(){
        console.log("Deleting all budgets...");

        const res = await fetch("/api/v2/budgets-by-centers-us/budgets",
                            {
                                method: "DELETE"
                            }
                           );

        console.log("All budgets deleted...");
        if(res.status === 200) {
            window.alert("Presupuestos borrados");
        }
        window.location.reload();
    }

    // BORRAR UN RECURSO CONCRETO F08 PR P1B4.
    async function deleteBudget(budgetCenter, budgetYear){
        console.log("Deleting contact with center " + budgetCenter + " and year: " + budgetYear);

        const res = await fetch("/api/v2/budgets-by-centers-us/budgets/"+ budgetCenter + "/" + budgetYear,
                            {
                                method: "DELETE"
                            }
                           );

        if(res.status === 404) {
            window.alert("Presupuesto no encontrado");
        }

        if(res.status === 200) {
            window.alert("Presupuesto borrado");
        }
        window.location.reload();
    }

    // Carga de recursos
    async function loadBudgets() {
        console.log("Loading initial data...");
        const res = await fetch("/api/v2/budgets-by-centers-us/loadInitialData");
        // const res = await fetch("/api/v1/budgets-by-centers-us/loadInitialData",
        //                     {
        //                         method: "GET"
        //                     }
        //                    );
        if(res.status === 201) {
            window.alert("Presupuestos cargados");
        }
        window.location.reload();
    }

    onMount(getBudgets);
</script>

<main>
    <h3>Presupuestos por centro</h3>
    <Row>
        <Col>
            <InputGroupAddon addonType="prepend">
                <InputGroupText>Elementos por página</InputGroupText>
                <Button on:click={loadBudgets}>Cargar Presupuestos</Button>
                <a href="#/budgets/search"><button type="button">Buscar Presupuesto</button></a>
            </InputGroupAddon>

            <Input type="select" id= "elementospag" name= "elementospag" bind:value={limit} on:change={
                () => {getBudgetsP(document.getElementById("elementospag").value, offset)}}>
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
                <td>Centro</td>
                <td>Año</td>
                <td>Cuantía fija</td>
                <td>Cuantía por número de créditos ECTS</td>
                <td>Cuantía por número de profesores</td>
                <td>Total</td>
                <td>Acción</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input placeholder="Ej: ETSII" bind:value="{newBudget.center}"></td>
                <td><input placeholder="Ej: 2021" bind:value= {newBudget.year}></td>
                <td><input placeholder="Ej: 3553.1" bind:value="{newBudget.fixed_fees}"></td>
                <td><input placeholder="Ej: 13569.1" bind:value="{newBudget.amounts_by_number_of_etc}"></td>
                <td><input placeholder="Ej: 5647.3" bind:value="{newBudget.amounts_by_number_of_proffessors}"></td>
                <td><input placeholder="Ej: 465675.2" bind:value="{newBudget.total}"></td>
                <td><Button on:click={insertBudget}>Añadir</Button></td>
            </tr>
            {#each budgets as budget}
                <tr>
                    <td><a href="#/budgets/{budget.center}/{budget.year}">{budget.center}</a></td>
                    <td>{budget.year}</td>
                    <td>{budget.fixed_fees}</td>
                    <td>{budget.amounts_by_number_of_etc}</td>
                    <td>{budget.amounts_by_number_of_proffessors}</td>
                    <td>{budget.total}</td>
                    <td><Button on:click={deleteBudget(budget.center, budget.year)}>Borrar</Button></td>
                </tr>
            {/each}
        </tbody>
    </Table>
    <Button on:click={deleteBudgets}>Borrar Presupuestos</Button>

    <div class="float-right">
        <InputGroup>
            <Button on:click={() => {
                                        page--;
                                        offset = parseInt(offset, 10) - parseInt(limit, 10); 
                                        getBudgetsP(limit, parseInt(offset, 10));
                                    }
            }>Anterior</Button>
            <InputGroupText class="bg-transparent">{page}</InputGroupText>
            <Button on:click={() => {
                                        page++;
                                        offset = parseInt(limit, 10) + 0;
                                        getBudgetsP(limit, parseInt(offset, 10));
                                    }
            }>Siguiente</Button>
            
        </InputGroup>
    </div>
</main>
