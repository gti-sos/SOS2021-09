<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';

    import {
        pop
    } from "svelte-spa-router";

let budgets = [];
let newBudget ={
    center: "",
    year: "",
    fixed_fees: "",
    amounts_by_number_of_etc: "",
    amounts_by_number_of_proffessors: "",
    total: ""
};

$: {
    searchBudgets(newBudget);
}

// UNA FORMA DE BUSCAR LOS RECURSOS PR1b5 ENTREGABLE 2
async function searchBudgets(newBudget) {
        console.log("Searching...");
        let ruta = "/api/v2/budgets-by-centers-us/budgets?";
        
        if(newBudget.center != "") ruta = ruta + "center=" + newBudget.center;
        if(newBudget.year != "") ruta = ruta + "&year=" + newBudget.year;
        if(newBudget.fixed_fees != "") ruta = ruta + "&fixed_fees=" + newBudget.fixed_fees;
        if(newBudget.amounts_by_number_of_etc != "") {
            ruta = ruta + "&amounts_by_number_of_etc=" + newBudget.amounts_by_number_of_etc;
         }
        if(newBudget.amounts_by_number_of_proffessors != "") {
            ruta = ruta + "&amounts_by_number_of_proffessors=" + newBudget.amounts_by_number_of_proffessors;
        }
        if(newBudget.total != "") ruta = ruta + "&total=" + newBudget.total;

        const res = await fetch(ruta);     

        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            budgets = json;
        }else{
            console.log("Error!");
        }
    }
</script>
<main>
    <h3>Búsqueda de presupuesto</h3>
    <Table bordered>
        <thead>
            <tr>
                <td>Centro</td>
                <td>Año</td>
                <td>Cuantía fija</td>
                <td>Cuantía por número de créditos ECTS</td>
                <td>Cuantía por número de profesores</td>
                <td>Total</td>
                <!--<td>Acción</td>-->
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
                <!--<td><Button on:click={searchBudgets(newBudget)}>Buscar</Button></td>-->
            </tr>
        </tbody>
    </Table>

    <h3>Presupuestos encontrados según búsqueda</h3>
    <Table>
        <thead>
            <tr>
                <td>Centro</td>
                <td>Año</td>
                <td>Cuantía fija</td>
                <td>Cuantía por número de créditos ECTS</td>
                <td>Cuantía por número de profesores</td>
                <td>Total</td>
            </tr>
        </thead>
        <tbody>
            {#each budgets as budget}
                <tr>
                    <td>{budget.center}</td>
                    <td>{budget.year}</td>
                    <td>{budget.fixed_fees}</td>
                    <td>{budget.amounts_by_number_of_etc}</td>
                    <td>{budget.amounts_by_number_of_proffessors}</td>
                    <td>{budget.total}</td>
                </tr>
            {/each}
        </tbody>
    </Table>

    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>