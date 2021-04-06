import express from "express";
var router = express.Router();

var dbCorte = [];

var datosGuardados = [
    {
        "degree": "History",
        "year": 2017,
        "cut-off-mark": 6.5,
        "selectivity-presented-seville": 8669,
        "price-admision": 757,
        "faculty": "FHISTRY"
    },
    {
        "degree": "History",
        "year": 2018,
        "cut-off-mark": 6.6,
        "selectivity-presented-seville": 10517,
        "price-admision": 757,
        "faculty": "FHISTRY"
    },
    {
        "degree": "Computer-Science",
        "year": 2017,
        "cut-off-mark": 8,
        "selectivity-presented-seville": 8669,
        "price-admision": 757,
        "faculty": "ETSII"
    },
    {
        "degree": "Computer-Science",
        "year": 2018,
        "cut-off-mark": 7,
        "selectivity-presented-seville": 10517,
        "price-admision": 757,
        "faculty": "ETSII"
    },
    {
        "degree": "Geography",
        "year": 2017,
        "cut-off-mark": 5,
        "selectivity-presented-seville": 8669,
        "price-admision": 757,
        "faculty": "FHISTRY"
    }
];


//5.2: Hacer loadInitialData que cree dos o más recursos (Crea 5)
router.get("/loadInitialData", (req,res) =>{
    dbCorte = datosGuardados;
    console.log(`Datos anadidos: <${JSON.stringify(dbCorte,null,2)}>`);
    res.sendStatus(200);
});

//6.1: devuelve una lista de recursos GET

router.get("/",(req,res)=>{
	if (dbCorte.length != 0){
		console.log(`Solicitados datos de notas de corte`);
		return res.send(JSON.stringify(dbCorte,null,2));
	} else {
		console.log("Datos no encontrados");
		return res.sendStatus(404);
	}
	return res.send.sendStatus(200);

});

//6.2: Crea un nuevo recurso POST
router.post('/',(req,res)=>{

	var nuevoObjeto = req.body;
	console.log(`Elemento creado: <${JSON.stringify(nuevoObjeto,null,2)}>`);
	dbCorte.push(nuevoObjeto);
	res.sendStatus(201);

});

//6.3: Hacemos un GET a un recurso específico
router.get("/:degree/:year",(req,res)=>{
	var degree = req.params.degree;
	var year = parseInt(req.params.year);

	console.log(`GET info by degree: <${degree}> and year: <${year}>`);
	for (var v of dbCorte){
		if(v.degree === degree && v.year === year) {
			return res.status(200).send(JSON.stringify(v,null,2));
		}
	}
	return res.sendStatus(404);
});

//6.4: Eliminar un recurso json DELETE
router.delete("/:degree/:year", (req,res)=>{
	var data_deleted = req.params;
	for (var i = 0; i <  dbCorte.length; i++){
		if(dbCorte[i].country === data_deleted.country && dbCorte[i].year === parseInt(data_deleted.year)){
			dbCorte.splice(i,1);
			console.log(`Se ha eliminado el recurso <${data_deleted.degree}> <${data_deleted.year}>`);
			return res.sendStatus(200);
		}
	}
	return res.sendStatus(404);
});

//6.5 Metemos un nuevo elemento PUT
router.put("/:degree/:year", function(req,res){
	for(var i in dbCorte){
		if(dbCorte[i].degree == String(req.params.degree) && dbCorte[i].year == String(req.params.year)){
			var datoNuevo = req.body;
			dbCorte[i] = datoNuevo;
			break;
		}
	}
	dbCorte = dbCorte.map(i => JSON.stringify(i));
	dbCorte = new Set(dbCorte);
	dbCorte = [...dbCorte]
	dbCorte = dbCorte.map(i => JSON.parse(i))
	res.status(200).send("Se ha modificado correctamente");
});

//6.6 Hacemos POST a un recurso
router.post("/:degree/:year", (req,res) =>{
	console.log("This method isnt allowed");
	return res.sendStatus(405);
});

//6.7 Hacemos PUT a lista de recursos
router.put("/", (req,res) =>{
	console.log("This method isnt allowed");
	return res.sendStatus(405);
});

//6.8 DELETE: borra todo los recursos
router.delete("/", (req,res)=>{
	dbCorte.length = 0 ;
	console.log('Resources have been deleted');
	return res.sendStatus(200);
});


/*//GET GENERAL
router.get(BASE_API_PATH+"", (req,res)=>{
    res.send(JSON.stringify(dbcorte,null,2));
});

router.post(BASE_API_PATH+"", (req,res)=>{
    var newCorte = req.body;
    console.log(`new contact to be added: <${JSON.stringify(newCorte,null,2)}>`);

    dbCorte.push(newCorte);
    res.sendStatus(201);
});
*/

module.exports = router;