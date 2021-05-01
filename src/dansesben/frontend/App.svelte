<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button, Icon, Modal, ModalBody,
        ModalFooter, ModalHeader, Form, Alert} from 'sveltestrap';
    import { onMount } from 'svelte';

    let data = [];
    let maxElements = 10; // Max table elements
    let currentPage = 1;

    // Load Initial Data
    onMount(async() =>{
        const res = await fetch('/api/v1/performances-by-degrees-us/');
        data = await res.json();
    })

    //Load data

    async function loadData(){
        const res = await fetch('/api/v1/performances-by-degrees-us/');
        data = await res.json();
    }

    function previousPage() {
        if (currentPage > 1) currentPage--;
    }

    function nextPage() {
        if (currentPage < data.length / maxElements) currentPage++;
    }

    // View modal
    let openViewModal = false;
    let editModalIndex = 0;
    const toggleViewModal = () => (openViewModal = !openViewModal);

    function editElement(index){
        editModalIndex = index;
        toggleViewModal();
    }

    // Delete modal
    let deleteModal = false;
    let deleteModalIndex = 0;
    const toggleDeleteModal = () => (deleteModal = !deleteModal);

    function openDeleteModal(index){
        deleteModalIndex = index;
        toggleDeleteModal();
    }

    // Alert
    let alerts = [];

    async function deleteElement(){
        let element = data[deleteModalIndex];
        let res = await fetch('/api/v1/performances-by-degrees-us/' + element.center + "/" + element.year + "/" + element["field-of-knowledge"], {"method": "DELETE"});

        if(res.status === 200){
            alerts = [...alerts, {text: "Eliminado " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " correctamente", color: "success"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }else if(res.status === 404){
            alerts = [...alerts, {text: "Elemento " + element.center + "/" + element.year + "/" + element["field-of-knowledge"] + " no existe", color: "warning"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }else{
            alerts = [...alerts, {text: "Error interno al intentar borrar " + element.center + "/" + element.year + "/" + element["field-of-knowledge"], color: "danger"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }

        toggleDeleteModal();
        await loadData(); // Renew data
    }


</script>

<!-- Alert -->
<Container>
    {#each alerts as alert}
        <Alert color={alert.color} class="mb-1" dismissible>
            {alert.text}
        </Alert>
    {/each}
</Container>

<!-- Delete Modal -->
<div>
    <Modal isOpen={deleteModal} {toggleDeleteModal}>
        <ModalHeader {toggleDeleteModal}>¿Seguro que quiere borrar el elemento?</ModalHeader>
        <ModalBody>
            El elemento será permanentemente borrado
        </ModalBody>
        <ModalFooter>
            <Button color="danger" on:click={deleteElement}>Borrar</Button>
            <Button color="secundary" on:click={toggleDeleteModal}>Cerrar</Button>
        </ModalFooter>
    </Modal>
</div>
<!-- Edit modal -->
<div>
    <Modal isOpen={openViewModal} {toggleViewModal}>
        <ModalHeader {toggleViewModal}>Editar entrada</ModalHeader>
        <ModalBody>

            <Form>
                <FormGroup>
                    <Label><b>Campo de conocimiento</b></Label>
                    <Input type="text" value={data[editModalIndex]["field-of-knowledge"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Año</b></Label>
                    <Input type="number" value={data[editModalIndex].year} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Rendimiento</b></Label>
                    <Input type="text" value={data[editModalIndex]["performance-percents"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos superados</b></Label>
                    <Input type="number" value={data[editModalIndex]["credits-passed"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos matriculados</b></Label>
                    <Input type="number" value={data[editModalIndex]["credits-enrolled"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Centro</b></Label>
                    <Input type="text" value={data[editModalIndex].center} />
                </FormGroup>
            </Form>
        </ModalBody>
        <ModalFooter>
            <Button color="primary" on:click={toggleViewModal}>Guardar</Button>
            <Button color="secundary" on:click={toggleViewModal}>Cerrar</Button>
        </ModalFooter>
    </Modal>
</div>

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
        </Col>
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
    </Row>
    <Row>
        <Col>
            <Table responsive>
                <thead>
                <tr>
                    <th>Campo de conocimiento</th>
                    <th>Año</th>
                    <th>Rendimiento</th>
                    <th>Créditos superados</th>
                    <th>Créditos matriculados</th>
                    <th>Centro</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {#each data.slice(maxElements * (currentPage - 1), maxElements * currentPage) as row,
                    index ({"year": row.year, "center": row.center, "field-of-knowledge": row["field-of-knowledge"]})}
                    <tr>
                        <td>{row["field-of-knowledge"]}</td>
                        <td>{row.year}</td>
                        <td>{row["performance-percents"]}</td>
                        <td>{row["credits-passed"]}</td>
                        <td>{row["credits-enrolled"]}</td>
                        <td>{row.center}</td>
                        <td>
                            <FormGroup>
                                <Button color="primary" on:click={() => editElement(index)}><Icon name="pencil-fill"/></Button>
                                <Button color="danger" on:click={() => openDeleteModal(index)}><Icon name="trash-fill"/></Button>
                            </FormGroup>
                        </td>
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