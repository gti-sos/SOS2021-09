<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';
    import {
        pop
    } from "svelte-spa-router";
let cuts = [];
let newCut ={
    degree: "",
    year: "",
    cut_off_mark: "",
    selectivity_presented_seville: "",
    price_admision: "",
    faculty: ""
};
$: {
    searchCuts(newCut);
}
// UNA FORMA DE BUSCAR LOS RECURSOS PR1b5 ENTREGABLE 2
async function searchCuts(newCut) {
        console.log("Searching...");
        let ruta = "/api/v2/cut-off-marks-by-degrees-us/cuts?";
        
        if(newCut.degree != "") ruta = ruta + "degree=" + newCut.degree;
        if(newCut.year != "") ruta = ruta + "&year=" + newCut.year;
        if(newCut.cut_off_mark != "") ruta = ruta + "&cut_off_mark=" + newCut.cut_off_mark;
        if(newCut.selectivity_presented_seville != "") {
            ruta = ruta + "&selectivity_presented_seville=" + newCut.selectivity_presented_seville;
         }
        if(newCut.price_admision != "") {
            ruta = ruta + "&price_admision=" + newCut.price_admision;
        }
        if(newCut.faculty != "") ruta = ruta + "&faculty=" + newCut.faculty;
        const res = await fetch(ruta);     
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            cuts = json;
        }else{
            console.log("Error!");
        }
    }
</script>
<main>
    <h3>Búsqueda de dato</h3>
    <Table bordered>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Nota de corte</td>
                <td>Presentados en selectividad</td>
                <td>Precio de matrícula</td>
                <td>Facultad</td>
                <!--<td>Acción</td>-->
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input placeholder="Ej: Geography" bind:value="{newCut.degree}"></td>
                <td><input placeholder="Ej: 2021" bind:value= {newCut.year}></td>
                <td><input placeholder="Ej: 3553.1" bind:value="{newCut.cut_off_mark}"></td>
                <td><input placeholder="Ej: 13569.1" bind:value="{newCut.selectivity_presented_seville}"></td>
                <td><input placeholder="Ej: 5647.3" bind:value="{newCut.price_admision}"></td>
                <td><input placeholder="Ej: FHISTRY" bind:value="{newCut.faculty}"></td>
                <!--<td><Button on:click={searchcuts(newCut)}>Buscar</Button></td>-->
            </tr>
        </tbody>
    </Table>

    <h3>Datos encontrados según búsqueda</h3>
    <Table>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Nota de corte</td>
                <td>Presentados en selectividad</td>
                <td>Precio de matrícula</td>
                <td>Facultad</td>
            </tr>
        </thead>
        <tbody>
            {#each cuts as cut}
                <tr>
                    <td>{cut.degree}</td>
                    <td>{cut.year}</td>
                    <td>{cut.cut_off_mark}</td>
                    <td>{cut.selectivity_presented_seville}</td>
                    <td>{cut.price_admision}</td>
                    <td>{cut.faculty}</td>
                </tr>
            {/each}
        </tbody>
    </Table>

    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>