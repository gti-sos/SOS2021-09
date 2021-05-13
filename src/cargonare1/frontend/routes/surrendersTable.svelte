<script>
    import {Table, Button} from 'sveltestrap';
    import { onMount } from 'svelte';
    

    let newSurrender ={
        degree: "",
        year: "",
        surrender_counts: null,
        new_students: null,
        surrender_percent: null,
        center: null
    };

    // CREAR RECURSOS F08 PR P1B1.
    async function insertSurrender(){
        console.log("Inserting surrender "+ JSON.stringify(newSurrender));
        var newSurrenderYear = parseInt(newSurrender.year);
        var newSurrenderSurrenderCounts = parseInt(newSurrender.surrender_counts);
        var newSurrenderNewStudents = parseInt(newSurrender.new_students);
        var newSurrenderPercent = parseFloat(newSurrender.surrender_percent);
        var newSurrendercenter = newSurrender.center;
        newSurrender.year = newSurrenderYear;
        newSurrender.surrender_counts = newSurrenderSurrenderCounts;
        newSurrender.new_students = newSurrenderNewStudents;
        newSurrender.surrender_percent = newSurrenderPercent;
        newSurrender.center = newSurrendercenter;
        console.log(newSurrender);

        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders",
                            {
                                method: "POST",
                                body: JSON.stringify(newSurrender),
                                headers:{
                                    "Content-Type": "application/json"
                                }
                            }
                           ).then( (res) => {
                               getSurrenders();
                           })
    }
    
    // LISTAR TODOS LOS RECURSOS F08 PR P1B2.
    let surrenders = [];
    let errorMsg = "";
    
    async function getSurrenders(){
        console.log("Fetching surrenders...");
        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders");

        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            surrenders = json;
            console.log(`We have received ${surrenders.length} surrenders.`);
        }else{
            errorMsg = res.status + ": " + res.statusText;
            console.log("Error!" + errorMsg);
        }
    }   
    
    // BORRAR TODOS LOS RECURSOS F08 PR P1B3.
    async function deleteSurrenders(){
        console.log("Deleting all surrenders...");

        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders",
                            {
                                method: "DELETE"
                            }
                           ).then( (res) => {
                            console.log("All surrenders deleted...");
                                getSurrenders();
                           })
    }

    // BORRAR UN RECURSO CONCRETO F08 PR P1B4.
    async function deleteSurrender(surrenderDegree, surrenderYear){
        console.log("Deleting contact with degree " + surrenderDegree + " and year: " + surrenderYear);

        const res = await fetch("/api/v1/surrenders-by-degrees-us/surrenders/"+ surrenderDegree + "/" + surrenderYear,
                            {
                                method: "DELETE"
                            }
                           ).then( (res) => {
                                getSurrenders();
                           })
    }
    onMount(getSurrenders);

</script>

<main>
    <h3>Abandonos en la Universidad de Sevilla</h3>
    <Table bordered>
        <thead>
            <tr>
                <td>Grado</td>
                <td>Año</td>
                <td>Número de Abandonos</td>
                <td>Nuevos estudiantes</td>
                <td>Porcentaje de abandonos</td>
                <td>Centro</td>
                <td>Acción</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><input bind:value="{newSurrender.degree}"></td>
                <td><input bind:value= {newSurrender.year}></td>
                <td><input bind:value="{newSurrender.surrender_counts}"></td>
                <td><input bind:value="{newSurrender.new_students}"></td>
                <td><input bind:value="{newSurrender.surrender_percent}"></td>
                <td><input bind:value="{newSurrender.center}"></td>
                <td><Button on:click={insertSurrender}>Añadir</Button></td>
            </tr>
            {#each surrenders as surrender}
                <tr>
                    <td><a href="#/surrenders/{surrender.degree}">{surrender.degree}</a></td>
                    <td>{surrender.year}</td>
                    <td>{surrender.surrender_counts}</td>
                    <td>{surrender.new_students}</td>
                    <td>{surrender.surrender_percent}</td>
                    <td>{surrender.center}</td>
                    <td><Button on:click={deleteSurrender(surrender.degree, surrender.year)}>Borrar</Button></td>
                </tr>
            {/each}
        </tbody>
    </Table>
    <Button on:click={deleteSurrenders}>Borrar Abandono</Button>
</main>
