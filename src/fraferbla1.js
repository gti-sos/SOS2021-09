const { response } = require("express");
var express = require("express");
var router = express.Router();
var Datastore = requires("nedb");
var db = new Datastore();

var dbCorte = [];

var datosGuardados = [
    {
        "degree": "History",
        "year": 2017,
        "cut_off_mark": 6.5,
        "selectivity_presented_seville": 8669,
        "price_admision": 757,
        "faculty": "FHISTRY"
    },
    {
        "degree": "History",
        "year": 2018,
        "cut_off_mark": 6.6,
        "selectivit_presented_seville": 10517,
        "price_admision": 757,
        "faculty": "FHISTRY"
    },
    {
        "degree": "Computer-Science",
        "year": 2017,
        "cut_off_mark": 8,
        "selectivity_presented_seville": 8669,
        "price_admision": 757,
        "faculty": "ETSII"
    },
    {
        "degree": "Computer-Science",
        "year": 2018,
        "cut_off_mark": 7,
        "selectivity_presented_seville": 10517,
        "price_admision": 757,
        "faculty": "ETSII"
    },
    {
        "degree": "Geography",
        "year": 2017,
        "cut_off_mark": 5,
        "selectivity_presented_seville": 8669,
        "price_admision": 757,
        "faculty": "FHISTRY"
    }
];


//5.2: Hacer loadInitialData que cree dos o más recursos (Crea 5)
router.get("/loadInitialData", (req,res) =>{
	db.remove({},{multi:true},function(err,numRemoved){});
    db.insert(datosGuardados);
    res.sendStatus(200);
	console.log("Initial data loaded:"+JSON.stringify(datosGuardados,null,2));
});

//6.1: devuelve una lista de recursos GET

router.get("/",(req,res)=>{
	
	var query = req.query;
	var offset = query.offset;
	var limit = query.limit;
	delete query.offset;
	delete query.limit;

	if(query.hasOwnProperty("year")){
		query.year = parseInt(query.year);
	}
	if(query.hasOwnProperty("cut_off_mark")){
		query.cut_off_mark = parseInt(query.cut_off_mark);
	}
	if(query.hasOwnProperty("selectivity-presented-seville")){
		query.selectivity_presented_seville = parseInt(query.selectivity_presented_seville);
	}
	if(query.hasOwnProperty("price-admision")){
		query.price_admision = parseInt(query.price_admision);
	}

	db.find(query).skip(offset).limit(limit).exec((err, cutsDB) => {
		if(err){
			console.error("ERROR accesing DB in GET");
			res.sendStatus(500);
		}
		else{
			if(cutsDB.length == 0){
				console.error("No data found");
				res.sendStatus(404);
			}
			else{
				var dataSend = cutsDB.map((c)=>{
					return {degree : c.degree, year : c.year, cut_off_mark : c.cut-off-mark, selectivity_presented_seville : c.selectivity_presented_seville, price_admision : c.price_admision, faculty : c.faculty};
				})
				if(dataSend.length==1){
					var objectSend = dataSend[0];
					res.send(JSON.stringify(objectSend, null, 2));
					console.log("Data sent:"+JSON.stringify(objectSend, null, 2));
				}else{
					res.send(JSON.stringify(dataToSend, null, 2));
					console.log("Data sent:"+JSON.stringify(dataSend, null, 2));
				}
				
			 }
		}
	});

});

//6.2: Crea un nuevo recurso POST
router.post('/',(req,res)=>{

	var nuevoObjeto = req.body;
	var degree = req.body.degree;
	var year = parseInt(req.body.year);
	
	db.find({"degree":degree, "year":year}).exec((err,data)=>{

		if(err){

			console.error("ERROR GET");
			res.sendStatus(500);
		}else{
			if(data.length == 0){

				if(!nuevoObjeto.degree
				|| !nuevoObjeto.year
				|| !nuevoObjeto['cut_off_mark']
				|| !nuevoObjeto['selectivity_presented_seville']
				|| !nuevoObjeto['price_admision']
				|| !nuevoObjeto['faculty']
				|| Object.keys(nuevoObjeto).length != 5){
					console.log("Data isnt correct");
					return res.sendStatus(400);
				}else{
			
					console.log("Data input"+JSON.stringify(nuevoObjeto, null, 2));
					db.insert(nuevoObjeto);
					res.sendStatus(201);
				}
			}else{

				res.sendStatus(409);
				console.log("Data already exist");
			}
		}
	});

});

//6.3: Hacemos un GET a un recurso específico
router.get("/:degree/:year",(req,res)=>{
	var reqDegree = req.params.degree;
	var reqYear = parseInt(req.params.year);

	db.find({degree: reqDegree, year: reqYear}, {_id: 0}, function(err, data){
		if(err) {
			console.error("ERROR in GET");
			res.sendStatus(500);
		} else {
			if(datos.length == 0){
				console.error("Data NOT found");
				res.sendStatus(404);
			}else{
				var dataSend = datos[0];
				console.log(`GET to <${reqDegree}>, <${reqYear}>`);
				res.status(200).send(JSON.stringify(dataSend. null, 2));
			}
		}

	});
});

//6.4: Eliminar un recurso json DELETE
router.delete("/:degree/:year", (req,res)=>{
	
	console.log("DELETE /:degree/:year");
	var reqDegree = req.params.degree;
	var reqYear = parseInt(req.params.year);

	db.remove({degree:reqDegree,year:reqYear},{multi:true}, (err, out) => {

		if(out == 1){

			console.log("DATA DELETED");
			res.sendStatus(200);
		}else{

			console.log("DATA NOT FOUND");
			res.sendStatus(404);
		}
	});
});

//6.5 Metemos un nuevo elemento PUT
router.put("/:degree/:year", (req,res) => {
	
	var reqDegree = req.params.degree;
	var reqYear = parseInt(req.params.year);
	var body = req.body;

	db.find({"degree":reqDegree, "year":reqYear}, (err, data) => {

		if(data.length == 0){

			res.sendStatus(404, "DATA NOT FOUND");
			console.log("Data not found");
		}else if(!body.reqDegree || !body.reqYear || !body["cut_off_mark"] || !body["selectivity_presented_seville"] || !body["price_admision"] || !body["faculty"] || Object.keys(body).length != 5){

			console.log("Invalid format");
			res.sendStatus(400, "FORMAT ISNT VALID");
		}else{

			db.update({"degree":reqDegree,"year":reqYear}, {$set:body});
			res.sendStatus(200);
			console.log("Data is updated");
		}
	});
});

//6.6 Hacemos POST a un recurso
router.post("/:degree/:year", (req,res) =>{
	console.log("This method isnt allowed");
	return res.sendStatus(405);
});

//6.7 Hacemos PUT a lista de recursos
// POST a country/year error
router.post("/:degree", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/degree");
	res.status(405).send("NOT ALLOWED");
})
router.post("/:year", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/year");
	res.status(405).send("NOT ALLOWED");
})
router.post("/:cut_off_mark", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/cut_off_mark");
	res.status(405).send("NOT ALLOWED");
})
router.post("/:selectivity_presented_seville", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/selectivity_presented_seville");
	res.status(405).send("NOT ALLOWED");
})
router.post("/:price_admision", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/price_admision");
	res.status(405).send("NOT ALLOWED");
})
router.post("/:faculty", (req,res)=>{

	console.log("NEW POST ...../cut-off-marks-by-degrees-us/faculty");
	res.status(405).send("NOT ALLOWED");
});

router.post("/", (req,res)=>{

	console.log("NEW PUT /cut-off-marks-by-degrees-us");
	res.status(405).send("NOT ALLOWED");
})


//6.8 DELETE: borra todo los recursos
router.delete("/", (req,res)=>{
	
	db.remove({}, {multi:true}, function (err, num) {

		if(err){

			console.error("Error deleting DB");
			res.sendStatus(500);
		}else{

			if(num == 0){

				console.error("Error page not found");
				res.sendStatus(404);
			}else{

				res.sendStatus(200);
			}
		}
	});
});

//6.9 GET a un recurso en concreto ERROR
router.get("/:data",(req,res)=>{

	console.error("BAD REQUEST");
	res.sendStatus(400).send("Fields entered are incorrect");
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