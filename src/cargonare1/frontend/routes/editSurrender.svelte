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
    let surrender = {};
    let updatedDegree = "XXXX";
    let updatedYear = 1234;
    let updatedSurrenderCounts = 12345;
    let updatedNewStudents = 12.2;
    let updatedSurrenderPercent = 12.2;
    let updatedCenter = "XXXX";
    let errorMsg = "";

    onMount(getSurrender);

    async function getSurrender() {

        console.log("Fetching surrender..." + params.center);
        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders/"+ params.center + "/2018");

        if (res.ok) {
            console.log("Ok:");
            const json = await res.json();
            surrender = json;
            updatedDegree = surrender.degree;
            updatedYear = parseInt(surrender.year, 10);
            updatedSurrenderCounts = parseInt(surrender.surrender_counts, 10);
            updatedNewStudents = parseInt(surrender.new_students, 10);
            updatedSurrenderPercent = parseFloat(surrender.surrender_percent, 10);
            updatedCenter = surrender.center;

            console.log("Received surrender.");
        } else {
            errorMsg = res.status + ": " + res.statusText;
            console.log("ERROR!" + errorMsg);
        }
    }


    async function updateSurrender() {

        console.log("Updating surrender..." + JSON.stringify(params.center));

        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders/" + params.center + "/2018", {
            method: "PUT",
            body: JSON.stringify({
                degree: params.degree,
                year: updatedYear,
                surrender_counts: updatedSurrenderCounts,
                new_students: updatedNewStudents,
                surrender_percent: updatedSurrenderPercent,
                center: params.center
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(function (res) {
            getSurrender();
        });



    }
</script>
<main>
    <h3>Editar Abandono <strong>{params.center}</strong></h3>
        <Table bordered>
            <thead>
                <tr>
                    <td>Grado</td>
                    <td>Año</td>
                    <td>Número de abandonos</td>
                    <td>Nuevos estudiantes</td>
                    <td>Porcentaje de abandonos</td>
                    <td>Centro</td>
                    <td>Acción</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{updatedDegree}</td>
                    <td>{updatedYear}</td>
                    <td><input bind:value="{updatedSurrenderCounts}"></td>
                    <td><input bind:value="{updatedNewStudents}"></td>
                    <td><input bind:value="{updatedSurrenderPercent}"></td>
                    <td><input bind:value="{updatedCenter}"></td>
                    <td> <Button outline  color="primary" on:click={updateSurrender}>Actualizar</Button> </td>
                </tr>
        </tbody>
        </Table>
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>