<script>
    import {
        onMount
    } from "svelte";

    import {
        pop
    } from "svelte-spa-router";


    import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";

    export let params = {};
    let selectedYear = params.year;
    let budget = {};
    let updatedCenter = "XXXX";
    let updatedYear = 1234;
    let updatedFixedFees = 12345.22;
    let updatedAmountByECTS = 12345;
    let updatedAmountByProff = 12345;
    let updatedTotal = 12345;
    let errorMsg = "";

    onMount(getBudget);

    async function getBudget() {

        console.log("Fetching budget..." + params.center);
        const res = await fetch("/api/v2/budgets-by-centers-us/budgets/"+ params.center + "/" + params.year);

        if (res.ok) {
            console.log("Ok:");
            const json = await res.json();
            budget = json;
            updatedCenter = budget.center;
            updatedYear = parseInt(budget.year, 10);
            updatedFixedFees = parseFloat(budget.fixed_fees, 10);
            updatedAmountByECTS = parseFloat(budget.amounts_by_number_of_etc, 10);
            updatedAmountByProff = parseFloat(budget.amounts_by_number_of_proffessors, 10);
            updatedTotal = parseFloat(budget.total, 10);

            console.log("Received budget.");
        } else {
            errorMsg = res.status + ": " + res.statusText;
            console.log("ERROR!" + errorMsg);
            if(res.status === 404) {
                window.alert("No se encuentra el presupuesto");
            }
        }
    }


    async function updateBudget() {

        console.log("Updating budget..." + JSON.stringify(params.center) + params.year);

        const res = await fetch("/api/v2/budgets-by-centers-us/budgets/"+ params.center + "/" + params.year, {
            method: "PUT",
            body: JSON.stringify({
                center: params.center,
                year: parseInt(updatedYear, 10),
                fixed_fees: parseFloat(updatedFixedFees, 10),
                amounts_by_number_of_etc: parseFloat(updatedAmountByECTS, 10),
                amounts_by_number_of_proffessors: parseFloat(updatedAmountByProff, 10),
                total: parseFloat(updatedTotal, 10)
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (res) {
            if(res.status === 400) {
                window.alert("Datos introducidos incorrectamente. Introduzcalos de nuevo, por favor.");
            }
            if(res.status === 200) {
                window.alert("Presupuesto Actualizado");
                console.log("Actualizado");
                history.go(-1);
            }
        });
    }

</script>
<main>
    <h3>Editar Presupuesto <strong>{params.center}</strong></h3>
        <Table id= "editBudgetsTable" bordered>
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
                    <td>{updatedCenter}</td>
                    <td><input id= "year_editBduget" bind:value="{updatedYear}"></td>
                    <td><input id= "fixed_fees_editBduget" bind:value="{updatedFixedFees}"></td>
                    <td><input id= "amount_ects_editBduget" bind:value="{updatedAmountByECTS}"></td>
                    <td><input id= "amount_proff_editBduget" bind:value="{updatedAmountByProff}"></td>
                    <td><input id= "total_editBduget" bind:value="{updatedTotal}"></td>
                    <td> <Button id= "button_editBduget" outline  color="primary" on:click={updateBudget}>Actualizar</Button> </td>
                </tr>
        </tbody>
        </Table>
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>