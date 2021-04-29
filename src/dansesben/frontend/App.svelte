<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button} from 'sveltestrap';
    import { onMount } from 'svelte';

    let data = [];
    let maxElements = 10; // Max table elements
    let currentPage = 1;

    // Load Initial Data
    onMount(async() =>{
        const res = await fetch('/api/v1/performances-by-degrees-us/');
        data = await res.json();
    })

    function previousPage() {
        if (currentPage > 1) currentPage--;
    }

    function nextPage() {
        if (currentPage < data.length / maxElements) currentPage++;
    }

</script>

<!-- Title -->
<Container>
    <Row>
        <Col><h1 class="text-center mt-3">Rendimiento según grado</h1></Col>
    </Row>
</Container>

<!-- Table -->
<Container>
    <Row>
        <Col>
            <FormGroup>
                <Label>Elementos</Label>
                <Input type="select" bind:value={maxElements} on:change={() => {currentPage = 1}}>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                </Input>
            </FormGroup>
        </Col>
        <Col>
        </Col>
    </Row>
    <Row>
        <Col>
            <Table class="mt-4" responsive>
                <thead>
                <tr>
                    <th>Campo de conocimiento</th>
                    <th>Año</th>
                    <th>Rendimiento</th>
                    <th>Créditos superados</th>
                    <th>Créditos matriculados</th>
                    <th>Centro</th>
                </tr>
                </thead>
                <tbody>
                {#each data.slice(maxElements * (currentPage - 1), maxElements * currentPage) as row}
                    <tr>
                        <td>{row["field-of-knowledge"]}</td>
                        <td>{row.year}</td>
                        <td>{row["performance-percents"]}</td>
                        <td>{row["credits-passed"]}</td>
                        <td>{row["credits-enrolled"]}</td>
                        <td>{row.center}</td>
                    </tr>
                {/each}
                </tbody>
            </Table>
        </Col>
    </Row>
    <Row class="float-right">
        <Col>
            <InputGroup>
                <Button class="btn-light bg-transparent" on:click={previousPage}>Anterior</Button>
                <InputGroupText class="bg-transparent">{currentPage}</InputGroupText>
                <Button class="btn-light bg-transparent" on:click={nextPage}>Siguiente</Button>
            </InputGroup>
        </Col>
    </Row>
</Container>