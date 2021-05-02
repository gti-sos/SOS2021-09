<script>
import Router from 'svelte-spa-router'
import Home from './routes/Home.svelte'
import NotFound from './routes/NotFound.svelte'
import EditElement from './routes/EditElement.svelte';
import {Container, Row, Col} from 'sveltestrap';

const routes = {
    '/': Home,
    '/:center/:year/:field-of-knowledge': EditElement,
    '*': NotFound
}
</script>

<!-- Title -->
<Container>
    <Row>
        <Col><h1 class="text-center mt-3">Rendimiento según grado</h1></Col>
    </Row>
</Container>

<body>
    <Router {routes}/>
</body>