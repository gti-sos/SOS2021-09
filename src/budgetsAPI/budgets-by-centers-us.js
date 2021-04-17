
// Requiere La app express
var express = require("express");

// Instanciamos el invocador
var router = express.Router();

//  
var dbBudgetsByCenters = [];

// Array de datos Inicales.
var initialData = [{
    "center": "ETSII",
    "year": 2018,
    "fixed-fees": 11003.22,
    "amounts-by-number-of-etc": 38717.17,
    "amounts-by-number-of-proffesors": 93753.44,
    "total": 143474.00
},{
    "center": "ETSIA",
    "year": 2018,
    "fixed-fees": 11003.22,
    "amounts-by-number-of-etc": 30500.00,
    "amounts-by-number-of-proffesors": 80460.90,
    "total": 120500.20

},{
        "center": "FCOM",
        "year": 2018,
        "fixed-fees": 11003.22,
        "amounts-by-number-of-etc": 93753.44,
        "amounts-by-number-of-proffesors": 50700.59,
        "total": 180600.20
}];

// Página de inicio.
router.get("/", (req,res) =>{
    //app.use(express.static('./indexBudgetsAPI.html'));
    res.sendStatus(200);
});

//5.2: Hacer loadInitialData que cree dos o más recursos (Crea 3)
router.get("/loadInitialData", (req,res) =>{
    dbBudgetsByCenters = initialData;
    console.log(`Datos anadidos: <${JSON.stringify(dbBudgetsByCenters,null,2)}>`);
    res.sendStatus(201);
});

//6.1: Devuelve una lista de recursos, usando GET
router.get("/budgets",(req,res)=>{
	if (dbBudgetsByCenters.length != 0){
		console.log(`Requested budgets by centers data`);
		return res.send(JSON.stringify(dbBudgetsByCenters,null,2));
	} else {
		console.log("Data not found (budgets)");
		return res.sendStatus(404);
	}
	return res.send.sendStatus(200);

});

//6.2: Crea un nuevo recurso, usando POST
router.post('/budgets',(req,res)=>{

	var newObject = req.body;
	console.log(`Element (budget) created: <${JSON.stringify(newObject,null,2)}>`);
	dbBudgetsByCenters.push(newObject);
	res.sendStatus(201);

});


//6.3: Hacemos un GET a un recurso específico, para obtener un presupuesto
router.get("/budgets/:center/:year",(req,res)=>{
    var center = req.params.center;
	var year = parseInt(req.params.year);

	console.log(`Budget by center: <${center}> and year: <${year}>`);
	for (var v of dbBudgetsByCenters){
		if(v.year === year && v.center === center) {
			return res.status(200).send(JSON.stringify(v,null,2));
		}
	}
    console.log("The budget for that center and that year was not found");
	return res.sendStatus(404);
});

//6.4: Eliminar un recurso, presupuesto de ese año y centro, DELETE
router.delete("/budgets/:center/:year", (req,res)=>{
	var data_deleted = req.params;
	for (var i = 0; i <  dbBudgetsByCenters.length; i++){
		if(dbBudgetsByCenters[i].center === data_deleted.center && dbBudgetsByCenters[i].year === parseInt(data_deleted.year)){
                dbBudgetsByCenters.splice(i,1);
			console.log(`The budget for this center: <${data_deleted.center}> and this year: <${data_deleted.year}> has been erased`);
			return res.sendStatus(200);
		}
	}
    console.log("The budget for that center and that year was not found");
	return res.sendStatus(404);
});

//6.5 Actualizamos un elemento, un presupuesto, con PUT
router.put("/budgets/:center/:year", function(req,res){
	for(var i in dbBudgetsByCenters){
		if(dbBudgetsByCenters[i].center == String(req.params.center) && dbCorte[i].year == Number(req.params.year)){
			var newData = req.body;
			dbBudgetsByCenters[i] = newData;
			break;
		}
	}
	dbBudgetsByCenters = dbBudgetsByCenters.map(i => JSON.stringify(i));
	dbBudgetsByCenters = new Set(dbBudgetsByCenters);
	dbBudgetsByCenters = [...dbBudgetsByCenters]
	dbBudgetsByCenters = dbBudgetsByCenters.map(i => JSON.parse(i))
	res.status(200).send("The budget has been updated correctly");
});

//6.6 Hacemos POST a un recurso
router.post("/budgets/:center/:year", (req,res) =>{
	console.log("ERROR, this method isn´t allowed");
	return res.sendStatus(405);
});

//6.7 Hacemos PUT a lista de recursos
router.put("/budgets", (req,res) =>{
	console.log("ERROR, this method isn´t allowed");
	return res.sendStatus(405);
});

//6.8 DELETE: borra todo los recursos
router.delete("/budgets", (req,res)=>{
	dbCorte.length = 0 ;
	console.log('All budgets have been deleted');
	return res.sendStatus(200);
});

module.exports = router;