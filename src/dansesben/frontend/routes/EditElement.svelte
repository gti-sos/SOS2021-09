<script>
    import {Container, Alert, Row, Form, FormGroup, Label, Input, Button, Card} from 'sveltestrap';
    import { onMount } from 'svelte';
    import {pop} from 'svelte-spa-router';

    export let params = {} // URL params
    let alerts = [];
    let newDataEdit = {};
    let oldDataURL = params.center + "/" + params.year + "/" + params["field-of-knowledge"];

    onMount(async() =>{
        const res = await fetch('/api/v2/performances-by-degrees-us/' + oldDataURL);

        if(res.status === 404){
            alerts = [...alerts, {text: "Elemento " + oldDataURL + " no existe", color: "warning"}];
            setTimeout(() => {
                alerts.shift();
                alerts = alerts;
                window.location.href = "";
            }, 2000);
        }else{
            newDataEdit = await res.json();
        }
    })

    async function saveEditedElement(){
        let res = await fetch('/api/v2/performances-by-degrees-us/' + oldDataURL, {"method": "PUT", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newDataEdit)});

        if(res.status === 200){
            alerts = [...alerts, {text: "Modificado " + oldDataURL + " correctamente", color: "success"}];
            setTimeout(async () => {
                alerts.shift();
                alerts = alerts;
                window.location.href = "";
            }, 1200);
        }else if(res.status === 404){
            alerts = [...alerts, {text: "Elemento " + oldDataURL + " no existe", color: "warning"}];
            setTimeout(async () => {
                alerts.shift();
                alerts = alerts;
                window.location.href = "";
            }, 1200);
        }else{
            alerts = [...alerts, {text: "Error interno al intentar modificar " + oldDataURL, color: "danger"}];
            setTimeout(() => {
                alerts.shift();
                alerts = alerts;
            }, 1200);
        }
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

<Container>
    <Row class="justify-content-center">
        <Card class="pl-5 pr-5 pt-2 pb-2">
            <Form>
                <FormGroup>
                    <Label><b>Campo de conocimiento</b></Label>
                    <Input type="text" bind:value={newDataEdit["field-of-knowledge"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Año</b></Label>
                    <Input type="number" bind:value={newDataEdit.year} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Rendimiento</b></Label>
                    <Input type="text" bind:value={newDataEdit["performance-percents"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos superados</b></Label>
                    <Input type="number" bind:value={newDataEdit["credits-passed"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Créditos matriculados</b></Label>
                    <Input type="number" bind:value={newDataEdit["credits-enrolled"]} />
                </FormGroup>
                <FormGroup>
                    <Label><b>Centro</b></Label>
                    <Input type="text" bind:value={newDataEdit.center} />
                </FormGroup>
                <FormGroup>
                    <Button color="primary" on:click={saveEditedElement}>Guardar</Button>
                    <Button color="secundary" on:click={pop}>Cerrar</Button>
                </FormGroup>
            </Form>
        </Card>
    </Row>
</Container>