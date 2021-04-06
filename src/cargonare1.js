var express=require("express");
var router = express.Router();

var db_abandono = [];

var d_g = [
    {
        "center": "History",
        "year": 2018,
        "surrender-counts": 193,
        "new-students": 533,
        "surrender-percents":36.21,
        "center": "FHISTRY"
    },
    {
        "center": "Computer-Science",
        "year": 2018,
        "surrender-counts": 47,
        "new-students": 237,
        "surrender-percents":19.83,
        "center": "ETSII"
    },
    {
        "center": "Greography",
        "year": 2018,
        "surrender-counts": 5,
        "new-students": 63,
        "surrender-percents":7.94,
        "center": "FHISTRY"
    },
    {
        "center": "Art",
        "year": 2018,
        "surrender-counts": 68,
        "new-students": 531,
        "surrender-percents":12.81,
        "center": "FBBAA"
    },
    {
        "center": "Nursering",
        "year": 2018,
        "surrender-counts": 24,
        "new-students": 134,
        "surrender-percents":17.91,
        "center": "FEFP"
    }
];

//5.2: loadInitialData
router.get("/loadInitialData", (req,res) =>{
    db_abandono = d_g;
    console.log(`Datos anadidos: <${JSON.stringify(db_abandono,null,2)}>`);
    res.sendStatus(200);
});


//6.1: Get->Devuelve una lista de recursos

router.get("/",(req,res)=>{
	if (db_abandono.length != 0){
		console.log(`Queremos solicitar datos de los abandonos`);
		return res.send(JSON.stringify(db_abandono,null,2));
	} else {
		console.log("Not found");
		return res.sendStatus(404);
	}
	return res.send.sendStatus(200);

});


//6.2: Creamos un POST
router.post('/',(req,res)=>{
	var nO = req.body;
	console.log(`Elemento creado: <${JSON.stringify(nO,null,2)}>`);
	db_abandono.push(nO);
	res.sendStatus(201);

});


//6.3: Hacemos un GET para encontrar un recurso específico
router.get("/:center/:year",(req,res)=>{
	var center = req.params.center;
	var year = parseInt(req.params.year);

	console.log(`GET info by center: <${center}> and year: <${year}>`);
	for (var v of db_abandono){
		if(v.center === center && v.year === year) {
			return res.status(200).json(stat);
		}
	}
	return res.sendStatus(404);
});

//6.4: Eliminar con DELETE
router.delete("/:center/:year", (req,res)=>{
	var datos_borrados = req.params;
	for (var i = 0; i <  db_abandono.length; i++){
		if(db_abandono[i].country === datos_borrados.country && db_abandono[i].year === parseInt(datos_borrados.year)){
			db_abandono.splice(i,1);
			console.log(`Se ha eliminado <${datos_borrados.center}> <${datos_borrados.year}>`);
			return res.sendStatus(200);
		}
	}
	return res.sendStatus(404);
});

//6.5 Metemos un nuevo elemento con PUT
router.put("/:center/:year", function(req,res){
	for(var i in db_abandono){
		if(db_abandono[i].center == String(req.params.center) && db_abandono[i].year == String(req.params.year)){
			var datoNuevo = req.body;
			db_abandono[i] = datoNuevo;
			break;
		}
	}
	db_abandono = db_abandono.map(i => JSON.stringify(i));
	db_abandono = new Set(db_abandono);
	db_abandono = [...db_abandono]
	db_abandono = db_abandono.map(i => JSON.parse(i))
	res.status(200).send("Se ha modificado correctamente");
});

//6.6 Hacemos POST a un recurso
router.post("/:center/:year", (req,res) =>{
	console.log("Este método no está permitido");
	return res.sendStatus(405);
});

//6.7 Hacemos PUT a lista de recursos
router.put("/", (req,res) =>{
	console.log("Este método no está permitido");
	return res.sendStatus(405);
});

//6.8 DELETE: borra todo los recursos
router.delete("/", (req,res)=>{
	db_abandono=[];
	console.log('Los recursos han sido borrados');
	return res.sendStatus(200);
});

/*//GET GENERAL
router.get(BASE_API_PATH+"", (req,res)=>{
    res.send(JSON.stringify(db_abandono,null,2));
});
router.post(BASE_API_PATH+"", (req,res)=>{
    var newCorte = req.body;
    console.log(`new contact to be added: <${JSON.stringify(db_abandono,null,2)}>`);
    db_abandono.push(newCorte);
    res.sendStatus(201);
});
*/
module.exports = router;