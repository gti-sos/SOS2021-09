<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button} from 'sveltestrap';
    import { onMount } from 'svelte';
    
    
    let budgets = [];

    async function getBudgets(){
        console.log("Fetching budgets...");
        const res = await fetch("/api/v1/budgets-by-centers-us/budgets");

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
    
    onMount(getBudgets);
</script>

<main>
    <h3>Presupuestos por centro</h3>
    <Table bordered>
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
</main>
