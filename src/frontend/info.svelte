<script>
    import {Container} from 'sveltestrap';
</script>

<Container class="pb-3">
    <h2 class="text-center pt-3">Información del Grupo</h2>
    <ul>
        <li>
            <strong>Equipo</strong>
            <ul>
                <li>
                    <a href="https://github.com/Adrirofer">Adrián Román Fernández</a>
                </li>
                <li>
                    <a href="https://github.com/franfdezb">Francisco José Fernández Blanco</a>
                </li>
                <li>
                    <a href="https://github.com/cargonare1">Carlos González Arenas</a>
                </li>
                <li>
                    <a href="https://github.com/Wocanilo">Daniel Sesé Benjumea</a>
                </li>
            </ul>
        </li>
        <li><strong>Descripción del Proyecto</strong>: Vamos a estudiar la relación entre el rendimiento de los estudiantes de grado por centro de la Universidad de Sevilla y sus notas de corte, comprobando también la tasa de abandono de los títulos de dicho centro y el presupuesto asignado por la Universidad de Sevilla a ese centro. centro entre un rango de años. ¿Más inversión o mejores marcas significa un mejor rendimiento?</li>
        <br>
        <li>
            <strong>Repositorio</strong>: <a href="https://github.com/gti-sos/SOS2021-09">gti-sos/SOS2021-09</a>
        </li>
        <li>
            <p><strong>Enlace al Repositorio</strong>: <a href="http://sos2021-09.herokuapp.com">http://sos2021-09.herokuapp.com</a></p>
        </li>
        <li>
            <p><strong>Interfaces de Programación de Aplicaciones (IPA)</strong>:</p>
            <ul>
                <li>
                    <p><i>Fuente de datos:</i> <strong>"Budgets by Centers"</strong></p>
                    | Revisa la IPA en: <a href="https://sos2021-09.herokuapp.com/api/v2/budgets-by-centers-us/">https://sos2021-09.herokuapp.com/api/v2/budgets-by-centers-us</a> (desarrollada por <a href="https://github.com/Adrirofer">Adrian Roman Fernandez</a>)
                    <br>| Revisa la documentación V1 de la IPA en: <a href="https://documenter.getpostman.com/view/14937223/TzRShTVc"> Documentación IPA</a>
                    <br>| Revisa la documentación V2 de la IPA en: <a href="https://documenter.getpostman.com/view/14937223/TzJydbQt"> Documentación IPA</a>
                    <br>| Revisa la Interfaz Gráfica de Usuario de la IPA en: <a href="/budgetsAPI/"> Interfaz Gráfica de Usuario</a>
                    <br>| Revisa la IPA para la integración: <a href="https://sos2021-09.herokuapp.com/api/integration/budgets-by-centers-us"> IPA Integración</a>
                </li>
                <br>
                <li>
                    <p><i>Fuente de datos:</i> <strong>"Cut off marks by degrees US"</strong></p>
                    | Revisa la IPA en: <a href="https://sos2021-09.herokuapp.com/api/v2/cut-off-marks-by-degrees-us/">https://sos2021-09.herokuapp.com/api/v2/cut-off-marks-by-degrees-us/</a> (desarrollada por <a href="https://github.com/franfdezb">Francisco José Fernández Blanco</a>)
                    <br> | Revisa la documentación V1 en: <a href="https://documenter.getpostman.com/view/14962900/TzJsfJ4p">Documentación de la IPA cut off marks by degrees</a>
                    <br> | Revisa la documentación V2 en: <a href="https://documenter.getpostman.com/view/14962900/TzRSiTwM">Documentación de la IPA cut off marks by degrees</a>
                    <br> | Revisa la Interfaz Gráfica de Usuario de la IPA en: <a href="/fraferbla1/"> Interfaz Gráfica de Usuario</a>
                    <br> | Revisa las gráficas realizadas solo con datos de mi API en: <a href="/fraferbla1/#/graphs"> Gráficas</a>
                </li>
                <br>
                <li>
                    <p><i>Fuente de datos:</i> <strong>"Surrenders by degrees US"</strong></p>
                    | Revisa la IPA <a href="https://sos2021-09.herokuapp.com/api/v1/surrenders-by-degrees-us">https://sos2021-09.herokuapp.com/api/v1/surrenders-by-degrees-us</a> (desarrollada por <a href="https://github.com/cargonare1">Carlos González Arenas</a>)
                    <br> | Revisa la documentación de la IPA en: <a href="https://documenter.getpostman.com/view/12390654/TzJu8c5h">Documentación de la IPA surrenders by degrees</a>
                    <br>| Revisa la documentación de la IPAv2 en: <a href="https://documenter.getpostman.com/view/12390654/TzRXA6cF"> Documentación de la IPA surrenders by degrees</a>
                    <br> | Revisa la Interfaz Gráfica de Usuario de la IPA en: <a href="/cargonare1/"> Interfaz Gráfica de Usuario</a>
                </li>
                <br>
                <li><b>Fuente de datos: "Performances By Degrees US"</b>:<br>
                    <a href="/dansesben/">Interfaz Gráfica de Usuario</a><br>
                    <a href="https://documenter.getpostman.com/view/15037183/TzRLmWbS">Documentación IPA V1</a><br>
                    <a href="https://sos2021-09.herokuapp.com/api/v1/performances-by-degrees-us/">IPA V1</a><br>
                    <a href="https://documenter.getpostman.com/view/15037183/TzJsexSB">Documentación IPA V2</a><br>
                    <a href="https://sos2021-09.herokuapp.com/api/v2/performances-by-degrees-us/">IPA V2</a><br>
                    (desarrollada por <a href="https://github.com/Wocanilo">Daniel Sesé Benjumea</a>)
                </li>
            </ul>
        </li>
    </ul>
</Container>