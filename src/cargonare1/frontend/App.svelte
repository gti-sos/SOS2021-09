<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button} from 'sveltestrap';
    import { onMount } from 'svelte';
    
    
    let surrenders = [];

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
    
    onMount(getSurrenders);
</script>

<main>
    <h3>Abandonos por grado en la Universidad de Sevilla</h3>
    <Table bordered>
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
</main>
