const express = require("express");
var request = require('request');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Automatically parses the requests body into a JSON
app.use(express.static('public')); // Exposes the folder public in the webapp

// RUTAS APIS L07 *****

// Dani
// Add the routes especified in the dansesben.js file
const dansesbenRoutes = require("./dansesben/dansesben");
app.use('/api/v1/performances-by-degrees-us', dansesbenRoutes);
const dansesbenRoutesV2 = require("./dansesben/dansesbenV2");
app.use('/api/v2/performances-by-degrees-us', dansesbenRoutesV2);

// Proxy Dansesben
const ADZUNE_SECRET = process.env.ADZUNE_SECRET || "";
app.use("/dansesben/getDataAdzuna", function(req, res) {
    var url = "https://api.adzuna.com/v1/api/jobs/gb/history?app_id=8e1b82c9&app_key=" + ADZUNE_SECRET + "&location0=UK&location1=London&category=it-jobs&content-type=application/json&months=24";
    req.pipe(request(url)).pipe(res);
});
//Proxy dansesben (SOS)
var dansesbenAllowList = {"education-expenditures": "https://education-expenditures.herokuapp.com/api/v1",
"mh-stats": "https://sos2021-23.herokuapp.com/api/v1/mh-stats"};
app.use("/dansesben/proxyRequest/:api", function(req, res) {
    let apiName = req.params.api;

    if(apiName in dansesbenAllowList){
        let url = dansesbenAllowList[apiName] + req.url;

        req.pipe(request(url)).pipe(res);
    }else{
        res.sendStatus(400);
    }
});



// Fran
const franferbla1Routers = require("./fraferbla1/fraferbla1V2");
app.use('/api/v2/cut-off-marks-by-degrees-us', franferbla1Routers);

// Adri
const budgetsbycentersus = require("./budgetsAPI/budgets-by-centers-usV2");
//app.use('/api/v1/budgets-by-centers-us', budgetsbycentersus);
app.use('/api/v2/budgets-by-centers-us', budgetsbycentersus);

// Integración.
const budgetsbycentersusInt = require("./budgetsAPI/budgets-by-centers-usINT");
app.use('/api/integration/budgets-by-centers-us', budgetsbycentersusInt);

// Proxy budgetsAPI (SOS)
var budgetsAPIAllowList = {"anxiety_stats": "http://sos2021-11.herokuapp.com/api/integration/anxiety_stats",
"children-out-school": "http://sos2021-children-out-school.herokuapp.com/api/v2/children-out-school",
"international-tourisms": "https://sos2021-03.herokuapp.com/api/integration/international-tourisms"};
app.use("/budgetsAPI/proxyRequest/:api", function(req, res) {
    let NameApi = req.params.api;

    if(NameApi in budgetsAPIAllowList){
        let url = budgetsAPIAllowList[NameApi] + req.url;

        console.log(budgetsAPIAllowList[NameApi]);
        console.log(req.url);
        console.log(url);
        req.pipe(request(url)).pipe(res);
    }else{
        res.sendStatus(400);
    }
});

// Proxy fraferbla1 (SOS)
var fraferbla1APIAllowList = {"covid-india": "https://sos2021-08.herokuapp.com/api/v1/statewisetestingdetails"};
app.use("/fraferbla1/proxyRequest/:api", function(req, res) {
    let NameApi = req.params.api;

    if(NameApi in fraferbla1APIAllowList){
        let url = fraferbla1APIAllowList[NameApi] + req.url;

        console.log(fraferbla1APIAllowList[NameApi]);
        console.log(req.url);
        console.log(url);
        req.pipe(request(url)).pipe(res);
    }else{
        res.sendStatus(400);
    }
});

// Proxy budgetsAPI (External 1)
const RAPIDAPI_KEY = "56de8eae19msh70481bc7978a4d2p10d7e8jsn652e16ab7753";
app.use("/budgetsAPI/proxyRequestExt/google-searchs-us", function(req, res) {
    var url = "https://google-search3.p.rapidapi.com/api/v1/search/q=university+of+seville&num=100?rapidapi-key=" + RAPIDAPI_KEY;
    req.pipe(request(url)).pipe(res);
});

// Proxy budgetsAPI (External 2)
app.use("/budgetsAPI/proxyRequestExt2/love-calculator/:sname/:fname", function(req, res) {
    var sname = req.params.sname;
    var fname = req.params.fname;
    var url2 = "https://love-calculator.p.rapidapi.com/getPercentage?rapidapi-key=" 
        + RAPIDAPI_KEY + "&sname="+sname+"&fname=" + fname;

    console.log(req.url);
    console.log("url" + url2);
    req.pipe(request(url2)).pipe(res);
});



// Carlos
const cargonare1R = require("./cargonare1/cargonare1V2");
//app.use('/api/v1/surrenders-by-degrees-us', cargonare1R);
app.use('/api/v2/surrenders-by-degrees-us', cargonare1R);

// ***** RUTAS APIS L07


// HTMLS DINÁMICOS, gets y posts L06 *****
// Dani
app.get('/info/performances-by-degrees-us', (req, res) => {
    res.send('<html><h3>performances-by-degrees-us</h3>Estudia el rendimiento de los alumnos comparando los créditos matriculados frente a los completados segun año y centro.<p></p><table class="table table-bordered table-hover table-condensed"> <thead><tr><th title="Field #1">field-of-knowledge</th> <th title="Field #2">year</th> <th title="Field #3">performance-percents</th> <th title="Field #4">credits-passed</th> <th title="Field #5">credits-enrolled</th> <th title="Field #6">center</th> </tr></thead> <tbody><tr> <td>History</td> <td align="right">2018</td> <td>83,44%</td> <td>2006</td> <td>2404</td> <td>FHISTRY</td> </tr> <tr> <td>Computer-Science</td> <td align="right">2018</td> <td>87,10%</td> <td>1870</td> <td>2147</td> <td>ETSII</td> </tr> <tr> <td>Graography</td> <td align="right">2018</td> <td>88,24%</td> <td>2010</td> <td>2278</td> <td>FHISTRY</td> </tr> <tr> <td>Art</td> <td align="right">2018</td> <td>77,69%</td> <td>390</td> <td>502</td> <td>FBBAA</td> </tr> <tr> <td>Nursering</td> <td align="right">2018</td> <td>87,93%</td> <td>1551</td> <td>1764</td> <td>FEFP</td> </tr> <tr> <td>Phychology</td> <td align="right">2018</td> <td>83,21%</td> <td>2567,5</td> <td>3085,5</td> <td>FPSYCHOLOGY</td> </tr> <tr> <td>Engineering</td> <td align="right">2018</td> <td>77,45%</td> <td>1882</td> <td>2430</td> <td>EPS</td> </tr> <tr> <td>Maths</td> <td align="right">2018</td> <td>109,70%</td> <td>1188</td> <td>1083</td> <td>FMATHS</td> </tr> <tr> <td>Medicine</td> <td align="right">2018</td> <td>74,45%</td> <td>1850</td> <td>2485</td> <td>FMEDICINE</td> </tr> </tbody></table></html>');
});

// Adri
app.get('/info/budgets-by-centers-us', (req, res) => {
    res.send("<html><body><h3>budgets-by-centers-us</h3> Estudia el presupuesto asignado a cada centro por parte de la US <br></br> <table> <tr><td><b>center &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>year &nbsp&nbsp</b></td> <td><b>fixed-fees &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-etc &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-proffesors &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>total &nbsp&nbsp&nbsp&nbsp</b></td></tr>    <tr><td>ETSII</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>93.753,44</td> <td>143.474,00</td></tr>    <tr><td>ETSIA</td> <td>2018</td> <td>11.003,22</td> <td>30.500,00</td> <td>80.46,90</td> <td>120.500,20</td></tr>    <tr><td>FCOM</td> <td>2018</td> <td>11.003,22</td> <td>93.753,44</td> <td>50.700,59</td> <td>180.600,20</td></tr>    <tr><td>ETSI</td> <td>2018</td> <td>11.003,22</td> <td>70.600,45</td> <td>38.717,17</td> <td>143.474,00</td></tr>    <tr><td>FEFP</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>40.090,00</td> <td>143.474,00</td></tr>    <tr><td>FPSYCHOLOGY</td> <td>2018</td> <td>11.003,22</td> <td>80.46,90</td> <td>60.800,43</td> <td>173.474,00</td></tr>    <tr><td>EPS</td> <td>2018</td> <td>11.003,22</td> <td>50.700,59</td> <td>63.435,01</td> <td>112.401,00</td></tr>    <tr><td>FBBAA</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>30.500,00</td> <td>90.474,00</td></tr>    <tr><td>FMEDICINE</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>70.600,45</td> <td>113.474,00</td></tr> </table></body></html>");
});

// Fran
app.get('/info/cut-off-marks-by-degrees-us', (req, res) => {
    res.send("<html><body><h3>cut-off-marks-by-degrees-us</h3> Estudia las notas de acceso según año por grados <br></br> <table> <tr><td><b>center &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>year &nbsp&nbsp</b></td> <td><b>fixed-fees &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-etc &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-proffesors &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>total &nbsp&nbsp&nbsp&nbsp</b></td></tr>    <tr><td>ETSII</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>93.753,44</td> <td>143.474,00</td></tr>    <tr><td>ETSIA</td> <td>2018</td> <td>11.003,22</td> <td>30.500,00</td> <td>80.46,90</td> <td>120.500,20</td></tr>    <tr><td>FCOM</td> <td>2018</td> <td>11.003,22</td> <td>93.753,44</td> <td>50.700,59</td> <td>180.600,20</td></tr>    <tr><td>ETSI</td> <td>2018</td> <td>11.003,22</td> <td>70.600,45</td> <td>38.717,17</td> <td>143.474,00</td></tr>    <tr><td>FEFP</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>40.090,00</td> <td>143.474,00</td></tr>    <tr><td>FPSYCHOLOGY</td> <td>2018</td> <td>11.003,22</td> <td>80.46,90</td> <td>60.800,43</td> <td>173.474,00</td></tr>    <tr><td>EPS</td> <td>2018</td> <td>11.003,22</td> <td>50.700,59</td> <td>63.435,01</td> <td>112.401,00</td></tr>    <tr><td>FBBAA</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>30.500,00</td> <td>90.474,00</td></tr>    <tr><td>FMEDICINE</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>70.600,45</td> <td>113.474,00</td></tr> </table></body></html>");
});

// Carlos
app.get('/info/surrenders-by-degrees-us', (req, res) => {
    res.send("<html><body><h3>surrenders-by-degrees-us</h3> Estudia las tasas de abandono por grado y por año <br></br> <table> <tr><td><b>center &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>year &nbsp&nbsp</b></td> <td><b>fixed-fees &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-etc &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>amounts-by-number-of-proffesors &nbsp&nbsp&nbsp&nbsp</b></td> <td><b>total &nbsp&nbsp&nbsp&nbsp</b></td></tr>    <tr><td>ETSII</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>93.753,44</td> <td>143.474,00</td></tr>    <tr><td>ETSIA</td> <td>2018</td> <td>11.003,22</td> <td>30.500,00</td> <td>80.46,90</td> <td>120.500,20</td></tr>    <tr><td>FCOM</td> <td>2018</td> <td>11.003,22</td> <td>93.753,44</td> <td>50.700,59</td> <td>180.600,20</td></tr>    <tr><td>ETSI</td> <td>2018</td> <td>11.003,22</td> <td>70.600,45</td> <td>38.717,17</td> <td>143.474,00</td></tr>    <tr><td>FEFP</td> <td>2018</td> <td>11.003,22</td> <td>38.717,17</td> <td>40.090,00</td> <td>143.474,00</td></tr>    <tr><td>FPSYCHOLOGY</td> <td>2018</td> <td>11.003,22</td> <td>80.46,90</td> <td>60.800,43</td> <td>173.474,00</td></tr>    <tr><td>EPS</td> <td>2018</td> <td>11.003,22</td> <td>50.700,59</td> <td>63.435,01</td> <td>112.401,00</td></tr>    <tr><td>FBBAA</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>30.500,00</td> <td>90.474,00</td></tr>    <tr><td>FMEDICINE</td> <td>2018</td> <td>11.003,22</td> <td>40.090,00</td> <td>70.600,45</td> <td>113.474,00</td></tr> </table></body></html>");
});

// ***** HTMLS DINÁMICOS L06

var server = app.listen(PORT, () =>{
    console.log(`Listening at http://127.0.0.1:${PORT}`);
});

module.exports = server;