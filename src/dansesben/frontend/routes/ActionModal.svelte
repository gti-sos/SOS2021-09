<script>
    import {Button, Modal, ModalBody,
        ModalFooter, ModalHeader} from 'sveltestrap';

    export let modalVisible;
    const toggleModal = () => (modalVisible = !modalVisible);

    export let title;
    export let description;
    export let actionName;
    export let actionFunction;

</script>

<div>
    <Modal isOpen={modalVisible} {toggleModal}>
        <ModalHeader {toggleModal}>{title}</ModalHeader>
        <ModalBody>
            {description}
        </ModalBody>
        <ModalFooter>
            <Button color="danger" on:click={actionFunction}>{actionName}</Button>
            <Button color="secundary" on:click={toggleModal}>Cerrar</Button>
        </ModalFooter>
    </Modal>
</div>