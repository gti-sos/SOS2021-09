<script>
    import { onMount } from "svelte";
    import { pop } from "svelte-spa-router";
    import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";

    export let params = {};
    let selectedYear = params.year;
    let surrender = {};
    let updatedDegree = "XXXX";
    let updatedYear = 1234;
    let updatedSurrenderPercent = 12345.22;
    let updatedsurrenderCounts = 12345;
    let updatedNew_Students = 12345;
    let updatedCenter = "XXX";
    let errorMsg = "";

    onMount(getSurrender);

    async function getSurrender() {
        console.log("Fetching surrender..." + params.degree);
        const res = await fetch(
            "/api/v2/surrenders-by-degrees-us/surrenders/" +
                params.degree +
                "/" +
                params.year
        );

        if (res.ok) {
            console.log("Ok:");
            const json = await res.json();
            surrender = json;
            updatedCenter = surrender.center;
            updatedDegree = surrender.degree;
            updatedYear = parseInt(surrender.year, 10);
            updatedSurrenderPercent = parseFloat(
                surrender.surrender_percent,
                10
            );
            updatedNew_Students = parseInt(surrender.new_students, 10);
            updatedsurrenderCounts = parseInt(surrender.surrender_counts, 10);

            console.log("Received surrender.");
        } else {
            errorMsg = res.status + ": " + res.statusText;
            console.log("ERROR!" + errorMsg);
            if (res.status === 404) {
                window.alert("No se encuentra el abandono");
            }
        }
    }

    async function updateSurrender() {
        console.log(
            "Updating surrender..." +
                JSON.stringify(params.degree) +
                params.year
        );

        const res = await fetch(
            "/api/v2/surrenders-by-degrees-us/surrenders/" +
                params.degree +
                "/" +
                params.year,
            {
                method: "PUT",
                body: JSON.stringify({
                    degree: params.degree,
                    year: parseInt(updatedYear, 10),
                    surrender_percent: parseFloat(updatedSurrenderPercent, 10),
                    new_students: parseInt(updatedNew_Students, 10),
                    surrender_counts: parseInt(updatedsurrenderCounts, 10),
                    center: updatedCenter,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        ).then(function (res) {
            if (res.status === 400) {
                window.alert(
                    "Datos introducidos incorrectamente. Introduzcalos de nuevo, por favor."
                );
            }
            if (res.status === 200) {
                window.alert("Presupuesto Actualizado");
                console.log("Actualizado");
                history.go(-1);
            }
        });
    }
</script>

<main>
    <h3>Editar Abandono <strong>{params.degree}</strong></h3>
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
                <td><input bind:value={updatedYear} /></td>
                <td><input bind:value={updatedsurrenderCounts} /></td>
                <td><input bind:value={updatedNew_Students} /></td>
                <td><input bind:value={updatedSurrenderPercent} /></td>
                <td><input bind:value={updatedCenter} /></td>
                <td>
                    <Button outline color="primary" on:click={updateSurrender}
                        >Actualizar</Button
                    >
                </td>
            </tr>
        </tbody>
    </Table>
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click={pop}>Atrás</Button>
</main>
