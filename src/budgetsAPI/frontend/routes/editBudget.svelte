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
    let updatedFixedFees = 12345;
    let updatedAmountByECTS = 12345;
    let updatedAmountByProff = 12345;
    let updatedTotal = 12345;
    let errorMsg = "";

    onMount(getBudget);

    async function getBudget() {

        console.log("Fetching budget..." + params.center);
        const res = await fetch("/api/v1/budgets-by-centers-us/budgets/"+ params.center + "/2018");

        if (res.ok) {
            console.log("Ok:");
            const json = await res.json();
            budget = json;
            updatedCenter = budget.center;
            updatedYear = parseInt(budget.year, 10);
            updatedFixedFees = parseInt(budget.fixed_fees, 10);
            updatedAmountByECTS = parseInt(budget.amounts_by_number_of_etc, 10);
            updatedAmountByProff = parseInt(budget.amounts_by_number_of_proffessors, 10);
            updatedTotal = parseInt(budget.total, 10);

            console.log("Received budget.");
        } else {
            errorMsg = res.status + ": " + res.statusText;
            console.log("ERROR!" + errorMsg);
        }
    }


    async function updateBudget() {

        console.log("Updating budget..." + JSON.stringify(params.center));

        const res = await fetch("/api/v1/budgets-by-centers-us/budgets/" + params.center + "/2018", {
            method: "PUT",
            body: JSON.stringify({
                center: params.center,
                year: updatedYear,
                fixed_fees: updatedFixedFees,
                amounts_by_number_of_etc: updatedAmountByECTS,
                amounts_by_number_of_proffessors: updatedAmountByProff,
                total: updatedTotal
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (res) {
            getBudget();
        });



    }
</script>
<main>
    <h3>Editar Presupuesto <strong>{params.center}</strong></h3>
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
                    <td>{updatedCenter}</td>
                    <td>{updatedYear}</td>
                    <td><input bind:value="{updatedFixedFees}"></td>
                    <td><input bind:value="{updatedAmountByECTS}"></td>
                    <td><input bind:value="{updatedAmountByProff}"></td>
                    <td><input bind:value="{updatedTotal}"></td>
                    <td> <Button outline  color="primary" on:click={updateBudget}>Actualizar</Button> </td>
                </tr>
        </tbody>
        </Table>
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>