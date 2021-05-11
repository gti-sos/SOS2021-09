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
    let cut = {};
    let updatedDegree = "XXXX";
    let updatedYear = 1234;
    let updatedCutOffs = 12345.22;
    let updatedSelectPresented = 12345;
    let updatedPriceAdmision = 12345;
    let updatedFaculty = "XXXX";
    let errorMsg = "";
    onMount(getcut);
    async function getcut() {
        console.log("Fetching cut..." + params.degree);
        const res = await fetch("/api/v2/cut-off-marks-by-degrees-us/cuts/"+ params.degree + "/" + params.year);
        if (res.ok) {
            console.log("Ok:");
            const json = await res.json();
            cut = json;
            updatedDegree = cut.degree;
            updatedYear = parseInt(cut.year, 10);
            updatedCutOffs = parseFloat(cut.cut_off_mark, 10);
            updatedSelectPresented = parseFloat(cut.selectivity_presented_seville, 10);
            updatedPriceAdmision = parseFloat(cut.price_admision, 10);
            updatedFaculty = String(cut.faculty, 10);
            console.log("Received cut.");
        } else {
            errorMsg = res.status + ": " + res.statusText;
            console.log("ERROR!" + errorMsg);
            if(res.status === 404) {
                window.alert("No se encuentra el dato");
            }
        }
    }
    async function updatecut() {
        console.log("Updating cut..." + JSON.stringify(params.degree) + params.year);
        const res = await fetch("/api/v2/cuts-by-degrees-us/cuts/"+ params.degree + "/" + params.year, {
            method: "PUT",
            body: JSON.stringify({
                degree: params.degree,
                year: parseInt(updatedYear, 10),
                cut_off_mark: parseFloat(updatedCutOffs, 10),
                selectivity_presented_seville: parseFloat(updatedSelectPresented, 10),
                price_admision: parseFloat(updatedPriceAdmision, 10),
                total: String(updatedFaculty, 10)
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
    <h3>Editar Presupuesto <strong>{params.degree}</strong></h3>
        <Table bordered>
            <thead>
                <tr>
                    <td>Grado</td>
                    <td>Año</td>
                    <td>Nota de corte</td>
                    <td>Presentados a selectividad</td>
                    <td>Precio de matrícula</td>
                    <td>Facultad</td>
                    <td>Acción</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{updatedDegree}</td>
                    <td><input bind:value="{updatedYear}"></td>
                    <td><input bind:value="{updatedCutOffs}"></td>
                    <td><input bind:value="{updatedSelectPresented}"></td>
                    <td><input bind:value="{updatedPriceAdmision}"></td>
                    <td><input bind:value="{updatedFaculty}"></td>
                    <td> <Button outline  color="primary" on:click={updatecut}>Actualizar</Button> </td>
                </tr>
        </tbody>
        </Table>
    {#if errorMsg}
        <p style="color: red">ERROR: {errorMsg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>