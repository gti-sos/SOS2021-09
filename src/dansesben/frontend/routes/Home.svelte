<script>
    import {Col, Container, Row, Table, FormGroup, Label, Input
        , InputGroup, InputGroupText, Button, Icon, Modal, ModalBody,
        ModalFooter, ModalHeader, Form, Alert, InputGroupAddon} from 'sveltestrap';
    import ActionModal from './ActionModal.svelte';
    import {apiAlerts, apiData} from './stores.js';
    import {deleteRecord, deleteAllRecords, addRecord, searchRecords} from "./API";

    let data = [];
    let searchConfig = {"limit": 5, "page": 1};

    $:  {
        // Load Data
        searchRecords(searchConfig).then(data => apiData.update(_ => data));
    }

    const unsubscribe = apiData.subscribe(value => {
        data = value;
    });

    async function loadData(){
        let tmpData = await searchRecords(searchConfig);
        apiData.update(_ => tmpData);
    }

    function addAlert(message){
        apiAlerts.update(alerts => [...alerts, message]);
        setTimeout(() => apiAlerts.update(alerts => alerts.slice(1)), 1300);
    }

    // Alerts
    let alerts = [];

    const unsubscribeAlerts = apiAlerts.subscribe(value => {
        alerts = value;
    });

    ///
    /// Model logic
    ///

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
        let result = await deleteRecord(element);
        addAlert(result);

        toggleDeleteModal();
        await loadData(); // Renew data
    }

    // Delete all modal
    let deleteAllModal = false;
    const toggleDeleteAllModal = () => (deleteAllModal = !deleteAllModal);

    // Delete All
    async function deleteAllElements(){
        let result = await deleteAllRecords();
        addAlert(result);

        await loadData(); // Renew data
        toggleDeleteAllModal();
    }

    // Add all modal
    let addModal = false;
    const toggleAddModal = () => (addModal = !addModal);
    let rowToAdd = {};

    async function addElement(){
        let result = await addRecord(rowToAdd);
        addAlert(result);

        await loadData(); // Renew data
        toggleAddModal();
    }

    // Edit Element
    function editElement(index){
        let element = data[index];
        // The push function is broken.
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
                <Input type="select" on:change={(evt) => {searchConfig = {limit: evt.target.value, page: 1}}}>
                    <option>5</option>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                </Input>
            </InputGroup>
        </Col>
    </Row>
    <Row>
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
                <tr>
                    <td><Input type="search" placeholder="Campo Conocimiento" bind:value={searchConfig["field-of-knowledge"]}/></td>
                    <td><Input type="search" placeholder="Año" bind:value={searchConfig.year}/></td>
                    <td><Input type="search" placeholder="Rendimiento" bind:value={searchConfig["performance-percents"]}/></td>
                    <td><Input type="search" placeholder="Créditos superados" bind:value={searchConfig["credits-passed"]}/></td>
                    <td><Input type="search" placeholder="Créditos matriculados" bind:value={searchConfig["credits-enrolled"]}/></td>
                    <td><Input type="search" placeholder="Centro" bind:value={searchConfig.center}/></td>
                    <td>No hay acciones disponibles</td>
                </tr>
                {#each data as row,
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
    </Row>
    <Row>
        <Col>
            <div class="float-right">
                <InputGroup>
                    <Button class="btn-light bg-transparent" on:click={() => {if (searchConfig.page > 1) searchConfig.page--}}>Anterior</Button>
                    <InputGroupText class="bg-transparent">{searchConfig.page}</InputGroupText>
                    <Button class="btn-light bg-transparent" on:click={() => {if (data.length === parseInt(searchConfig.limit)) searchConfig.page++}}>Siguiente</Button>
                </InputGroup>
            </div>
        </Col>
    </Row>
</Container>