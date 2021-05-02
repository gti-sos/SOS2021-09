<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button, Icon, Modal, ModalBody,
        ModalFooter, ModalHeader, Form, Alert, InputGroupAddon} from 'sveltestrap';
    import { onMount } from 'svelte';
    import ActionModal from './ActionModal.svelte';

    let data = [];
    let maxElements = 10; // Max table elements
    let currentPage = 1;

    // Load Initial Data
    onMount(async() =>{
        const res = await fetch('/api/v2/performances-by-degrees-us/');
        data = await res.json();
    })

    //Load data
    async function loadData(){
        const res = await fetch('/api/v2/performances-by-degrees-us/');
        data = await res.json();
    }

    function previousPage() {
        if (currentPage > 1) currentPage--;
    }

    function nextPage() {
        if (currentPage < data.length / maxElements) currentPage++;
    }

    // Alerts
    let alerts = [];

    // Delete modal
    let deleteModal = false;
    let deleteModalIndex = 0;
    const toggleDeleteModal = () => (deleteModal = !deleteModal);

    function openDeleteModal(index){
        deleteModalIndex = index;
        toggleDeleteModal();
    }

    async function deleteElement(){
        let element = data[deleteModalIndex];
        let res = await fetch('/api/v2/performances-by-degrees-us/' + element.center + "/" + element.year + "/" + element["field-of-knowledge"], {"method": "DELETE"});

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

    // Delete all modal
    let deleteAllModal = false;
    const toggleDeleteAllModal = () => (deleteAllModal = !deleteAllModal);

    // Delete All
    async function deleteAllElements(){
        let res = await fetch('/api/v2/performances-by-degrees-us/', {"method": "DELETE"});

        if(res.status === 200){
            alerts = [...alerts, {text: "Todos los elementos han sido eliminados", color: "success"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }else{
            alerts = [...alerts, {text: "Error interno al intentar borrar todos los elementos", color: "danger"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }

        await loadData(); // Renew data
        toggleDeleteAllModal();
    }

    // Add all modal
    let addModal = false;
    const toggleAddModal = () => (addModal = !addModal);
    let rowToAdd = {};

    async function addElement(){
        let res = await fetch('/api/v2/performances-by-degrees-us/', {"method": "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rowToAdd)});

        if(res.status === 201){
            alerts = [...alerts, {text: "Elemento correctamente añadido", color: "success"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }
        else if(res.status === 400){
            alerts = [...alerts, {text: "Elemento inválido, revise que los valores sean válidos", color: "warning"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }
        else{
            alerts = [...alerts, {text: "Error interno al intentar añadir el elemento", color: "danger"}];
            setTimeout(() => {alerts.shift(); alerts = alerts;}, 3000);
        }

        await loadData(); // Renew data
        toggleAddModal();
    }

    // Edit Element
    function editElement(index){
        let element = data[index];
        let oldDataURL = "?#/" + element.center + "/" + element.year + "/" + element["field-of-knowledge"];
        window.location.href = oldDataURL;
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
<ActionModal modalVisible={deleteModal} title="¿Seguro que quiere borrar el elemento?"
             description="Esta acción es irreversible."
             actionName="Borrar" actionFunction={deleteElement}/>

<!-- Delete All Modal -->
<ActionModal modalVisible={deleteAllModal} title="¿Seguro que quiere borrar todos los elementos?"
             description="Esta acción es irreversible."
             actionName="Borrar" actionFunction={deleteAllElements}/>

<!-- Add modal -->
<div>
    <Modal isOpen={addModal} {toggleAddModal}>
        <ModalHeader {toggleAddModal}>Añadir entrada</ModalHeader>
        <ModalBody>
            <Form>
                <FormGroup>
                    <Label><b>Campo de conocimiento</b></Label>
                    <Input type="text" bind:value={rowToAdd["field-of-knowledge"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Año</b></Label>
                    <Input type="number" bind:value={rowToAdd.year} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Rendimiento</b></Label>
                    <Input type="text" bind:value={rowToAdd["performance-percents"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos superados</b></Label>
                    <Input type="number" bind:value={rowToAdd["credits-passed"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos matriculados</b></Label>
                    <Input type="number" bind:value={rowToAdd["credits-enrolled"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Centro</b></Label>
                    <Input type="text" bind:value={rowToAdd.center} />
                </FormGroup>
            </Form>
        </ModalBody>
        <ModalFooter>
            <Button color="primary" on:click={addElement}>Guardar</Button>
            <Button color="secundary" on:click={toggleAddModal}>Cerrar</Button>
        </ModalFooter>
    </Modal>
</div>

<!-- Table -->
<Container>
    <Row class="mt-3">
        <Col>
            <FormGroup class="float-left">
                <Button color="success" on:click={() => toggleAddModal()}><Icon name="plus"/>Añadir elemento</Button>
                <Button color="danger" on:click={() => toggleDeleteAllModal()}><Icon name="trash-fill"/>Borrar todo</Button>
            </FormGroup>
        </Col>
        <Col>
            <InputGroup>
                <InputGroupAddon addonType="prepend">
                    <InputGroupText>Elementos</InputGroupText>
                </InputGroupAddon>
                <Input type="select" bind:value={maxElements} on:change={() => {currentPage = 1}}>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                </Input>
            </InputGroup>
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
    <Row>
        <Col>
            <div class="float-right">
                <InputGroup>
                    <Button class="btn-light bg-transparent" on:click={previousPage}>Anterior</Button>
                    <InputGroupText class="bg-transparent">{currentPage}</InputGroupText>
                    <Button class="btn-light bg-transparent" on:click={nextPage}>Siguiente</Button>
                </InputGroup>
            </div>
        </Col>
    </Row>
</Container>