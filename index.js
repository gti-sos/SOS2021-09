const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Exposes the folder public in the webapp

app.get('/cool', (req, res) => {
    res.send(cool());
});


app.get('/info/performances-by-degrees-us', (req, res) => {
    res.send('<html><h3>performances-by-degrees-us</h3>Estudia el rendimiento de los alumnos comparando los créditos matriculados frente a los completados segun año y centro.<p></p><table class="table table-bordered table-hover table-condensed"> <thead><tr><th title="Field #1">center</th> <th title="Field #2">year</th> <th title="Field #3">performance-percents</th> <th title="Field #4">credits-passed</th> <th title="Field #5">credits-enrolled</th> <th title="Field #6">center</th> </tr></thead> <tbody><tr> <td>History</td> <td align="right">2018</td> <td>83,44%</td> <td>2006</td> <td>2404</td> <td>FHISTRY</td> </tr> <tr> <td>Computer-Science</td> <td align="right">2018</td> <td>87,10%</td> <td>1870</td> <td>2147</td> <td>ETSII</td> </tr> <tr> <td>Graography</td> <td align="right">2018</td> <td>88,24%</td> <td>2010</td> <td>2278</td> <td>FHISTRY</td> </tr> <tr> <td>Art</td> <td align="right">2018</td> <td>77,69%</td> <td>390</td> <td>502</td> <td>FBBAA</td> </tr> <tr> <td>Nursering</td> <td align="right">2018</td> <td>87,93%</td> <td>1551</td> <td>1764</td> <td>FEFP</td> </tr> <tr> <td>Phychology</td> <td align="right">2018</td> <td>83,21%</td> <td>2567,5</td> <td>3085,5</td> <td>FPSYCHOLOGY</td> </tr> <tr> <td>Engineering</td> <td align="right">2018</td> <td>77,45%</td> <td>1882</td> <td>2430</td> <td>EPS</td> </tr> <tr> <td>Maths</td> <td align="right">2018</td> <td>109,70%</td> <td>1188</td> <td>1083</td> <td>FMATHS</td> </tr> <tr> <td>Medicine</td> <td align="right">2018</td> <td>74,45%</td> <td>1850</td> <td>2485</td> <td>FMEDICINE</td> </tr> </tbody></table></html>');
});


app.listen(PORT, () =>{
    console.log(`Listening at http://127.0.0.1:${PORT}`);
});

