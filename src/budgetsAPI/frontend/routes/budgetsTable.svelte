<script>
    import {Table, Button} from 'sveltestrap';
    import { onMount } from 'svelte';
    

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
        var newBudgetFixedFees = parseInt(newBudget.fixed_fees);
        var newBudgetAmountsByETC = parseInt(newBudget.amounts_by_number_of_etc);
        var newBudgetByProffesors = parseInt(newBudget.amounts_by_number_of_proffessors);
        var newBudgetTotal = parseInt(newBudget.total);
        newBudget.year = newBudgetYear;
        newBudget.fixed_fees = newBudgetFixedFees;
        newBudget.amounts_by_number_of_etc = newBudgetAmountsByETC;
        newBudget.amounts_by_number_of_proffessors = newBudgetByProffesors;
        newBudget.total = newBudgetTotal;
        console.log(newBudget);

        const res = await fetch("/api/v1/budgets-by-centers-us/budgets",
                            {
                                method: "POST",
                                body: JSON.stringify(newBudget),
                                headers:{
                                    "Content-Type": "application/json"
                                }
                            }
                           ).then( (res) => {
                               getBudgets();
                           })
    }
    
    // LISTAR TODOS LOS RECURSOS F08 PR P1B2.
    let budgets = [];
    let errorMsg = "";
    
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
    
    // BORRAR TODOS LOS RECURSOS F08 PR P1B3.
    async function deleteBudgets(){
        console.log("Deleting all budgets...");

        const res = await fetch("/api/v1/budgets-by-centers-us/budgets",
                            {
                                method: "DELETE"
                            }
                           ).then( (res) => {
                            console.log("All budgets deleted...");
                                getBudgets();
                           })
    }

    // BORRAR UN RECURSO CONCRETO F08 PR P1B4.
    async function deleteBudget(budgetCenter, budgetYear){
        console.log("Deleting contact with center " + budgetCenter + " and year: " + budgetYear);

        const res = await fetch("/api/v1/budgets-by-centers-us/budgets/"+ budgetCenter + "/" + budgetYear,
                            {
                                method: "DELETE"
                            }
                           ).then( (res) => {
                                getBudgets();
                           })
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
                <td>Acción</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input bind:value="{newBudget.center}"></td>
                <td><input bind:value= {newBudget.year}></td>
                <td><input bind:value="{newBudget.fixed_fees}"></td>
                <td><input bind:value="{newBudget.amounts_by_number_of_etc}"></td>
                <td><input bind:value="{newBudget.amounts_by_number_of_proffessors}"></td>
                <td><input bind:value="{newBudget.total}"></td>
                <td><Button on:click={insertBudget}>Añadir</Button></td>
            </tr>
            {#each budgets as budget}
                <tr>
                    <td><a href="#/budgets/{budget.center}">{budget.center}</a></td>
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
</main>
