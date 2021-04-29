<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button} from 'sveltestrap';
    import { onMount } from 'svelte';
    
    
    let cuts = [];
    async function getcuts(){
        console.log("Fetching cuts...");
        const res = await fetch("/api/v1/cut-off-marks-by-degrees-us/cuts");
        if(res.ok){
            console.log("Ok.");
            const json = await res.json();
            cuts = json;
            console.log(`We have received ${cuts.length} cuts.`);
        }else{
            console.log("Error!");
        }
    }   
    
    onMount(getcuts);
</script>

<main>
    <h3>Notas de corte por grado</h3>
    <Table bordered>
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
</main>