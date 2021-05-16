<script>
	import Router from 'svelte-spa-router';
	import Landing from './routes/LandingPage.svelte';
	import surrenderIndex from './routes/surrendersTable.svelte';
	import SurrenderEdit from './routes/editSurrender.svelte';
	import SurrenderSearch from './routes/searchSurrender.svelte';
//	import NotFound from './NotFound.svelte'
	const routes = {
		"/": Landing,
		"/surrenders": surrenderIndex,
		"/surrenders/:degree/:year": SurrenderEdit,
		"/surrenders/search": SurrenderSearch
//		"*": NotFound
	};
</script>

<main>
	<Router {routes} />
</main>

searchSurrender

<script>
    import {Table, Button, InputGroupText, InputGroup, Input,
        InputGroupAddon, Row, Col} from 'sveltestrap';
    import { onMount } from 'svelte';

    import {
        pop
    } from "svelte-spa-router";

let surrenders = [];
let newSurrender ={
    degree: "",
    year: "",
    surrender_counts: "",
    new_students: "",
    surrender_percent: "",
    center: ""
};

$: {
    searchSurrenders(newSurrender);
}

// UNA FORMA DE BUSCAR LOS RECURSOS PR1b5 ENTREGABLE 2
async function searchSurrenders(newSurrender) {
        console.log("Searching...");
        let ruta = "/api/v2/surrenders-by-degrees-us/surrenders?";
        
        if(newSurrender.degree != "") ruta = ruta + "degree=" + newSurrender.degree;
        if(newSurrender.year != "") ruta = ruta + "&year=" + newSurrender.year;
        if(newSurrender.surrender_counts != "") ruta = ruta + "&surrender_counts=" + newSurrender.surrender_counts;
        if(newSurrender.new_students != "") {
            ruta = ruta + "&new_students=" + newSurrender.new_students;
         }
        if(newSurrender.surrender_percent != "") {
            ruta = ruta + "&surrender_percent=" + newSurrender.surrender_percent;
        }
        if(newSurrender.center != "") ruta = ruta + "&center=" + newSurrender.center;

        const res = await fetch(ruta);     

        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            surrenders = json;
        }else{
            console.log("Error!");
        }
    }
</script>
<main>
    <h3>Búsqueda de Abandono</h3>
    <Table bordered>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Cantidad de abandonos</td>
                <td>Nuevos estudiantes</td>
                <td>Porcentaje de abandonos</td>
                <td>Centro</td>
                <!--<td>Acción</td>-->
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input placeholder="Ej: History" bind:value="{newSurrender.degree}"></td>
                <td><input placeholder="Ej: 2021" bind:value= {newSurrender.year}></td>
                <td><input placeholder="Ej: 135" bind:value="{newSurrender.surrender_counts}"></td>
                <td><input placeholder="Ej: 653" bind:value="{newSurrender.new_students}"></td>
                <td><input placeholder="Ej: 5647.3" bind:value="{newSurrender.surrender_percent}"></td>
                <td><input placeholder="Ej: ETSII" bind:value="{newSurrender.center}"></td>
                <!--<td><Button on:click={searchBudgets(newBudget)}>Buscar</Button></td>-->
            </tr>
        </tbody>
    </Table>

    <h3>Abandonos encontrados según búsqueda</h3>
    <Table>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Número de abandonos</td>
                <td>Nuevos estudiantes</td>
                <td>Porcentaje de abandonos</td>
                <td>Centro</td>
            </tr>
        </thead>
        <tbody>
            {#each surrenders as surrender}
                <tr>
                    <td>{surrender.degree}</td>
                    <td>{surrender.year}</td>
                    <td>{surrender.surrender_counts}</td>
                    <td>{surrender.new_students}</td>
                    <td>{surrender.surrender_percent}</td>
                    <td>{surrender.center}</td>
                </tr>
            {/each}
        </tbody>
    </Table>

    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>