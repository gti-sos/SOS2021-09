var express = require("express");
var router = express.Router();

//Sacamos el paquete nedb, el paquete de la base de datos
var Datastore=require("nedb");

var db_ab=new Datastore({filename: './surrendersdb'});
    db_ab.loadDatabase(function (err) { //La llamada de vuelta, que es opcional
        //Ahora los comandos serán ejecutados
    });

var db_abandono = [];

var d_g = [
    {
        "degree": "History",
        "year": 2018,
        "surrender_counts": 193,
        "new_students": 533,
        "surrender_percent":36.21,
        "center": "FHISTRY"
    },
    {
        "degree": "Computer_Science",
        "year": 2018,
        "surrender_counts": 47,
        "new_students": 237,
        "surrender_percent":19.83,
        "center": "ETSII"
    },
    {
        "degree": "Greography",
        "year": 2018,
        "surrender_counts": 5,
        "new_students": 63,
        "surrender_percent":7.94,
        "center": "FHISTRY"
    },
    {
        "degree": "Art",
        "year": 2018,
        "surrender_counts": 68,
        "new_students": 531,
        "surrender_percent":12.81,
        "center": "FBBAA"
    },
    {
        "degree": "Nursering",
        "year": 2018,
        "surrender_counts": 24,
        "new_students": 134,
        "surrender_percent":17.91,
        "center": "FEFP"
    }
];

//5.2: loadInitialData
router.get("/loadInitialData", (req,res) =>{
    db_ab.insert(d_g);
    console.log(`Datos anadidos: <${JSON.stringify(d_g,null,2)}>`);
    res.sendStatus(201); //Created
});


//6.1: Get->Devuelve una lista de recursos

/*router.get("/",(req,res)=>{
		console.log(`Queremos solicitar datos de los abandonos`);
		return res.send(JSON.stringify(db_abandono,null,2));
});*/

router.get("/surrenders",(req,res)=>{

	var selectedSurrenders = [];
	
	db_ab.find({},(err, surrendersFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET" + err);
			res.sendStatus(500); // INTERNAL ERROR. F06.6
		} else {

			// Check if we want to search an specific budget or if we want all of them.
			// In case of no filtering has been declared, all budgets will be sended. SEARCHS
			if(Object.keys(req.query).length == 0) {
				selectedSurrenders = surrendersFound;

				// PAGINATION F06.3
			} else if(req.query.limit != undefined || req.query.offset != undefined) {
				selectedSurrenders = paginationMaker(req, surrendersFound);
			}
			  else {
				selectedSurrenders = filterOfRequest(req, surrendersFound);
			}

			// Get off the id.
			selectedSurrenders.forEach((t)=>{
				delete t._id;
			});

			if(selectedSurrenders.includes("ERROR")) {
				res.sendStatus(400); // BAD REQUEST, the values of limit and offset are wrong. F06.6
			} else if(selectedSurrenders.length == 0) {
				console.error('No surrender has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			}
			else {
				// RETURNS AN ARRAY F06.11
				console.log(`Es array?: <${Array.isArray(selectedSurrenders)}>`);
				res.status(200).send(JSON.stringify(selectedSurrenders,null,2)); //OK F06.6
			}
		}
	});
});

// Search method F06.2
function filterOfRequest(req, surrenders) {
	var res = [];

	for(var surrender of surrenders) {
	var check = true;

	// We mus check for each budget wich field is selected to comparate, if selected,
	// the metod will check if the value of the budget on that field matches with the value on query.
	if(req.query.degree != undefined) {
		if(surrender.degree != req.query.degree)  {
			check = false;
		}
	}
	if(req.query.year != undefined) {
		if(surrender.year != req.query.year)  {
			check = false;
		}
	}
	if(req.query.surrender_counts != undefined) {
		if(surrender.surrender_counts != req.query.surrender_counts)  {
			check = false;
		}
	}
	if(req.query.new_students != undefined) {
		if(surrender.new_students != req.query.new_students)  {
			check = false;
		}
	}
	if(req.query.surrender_percent != undefined) {
		if(surrender.surrender_percent != req.query.surrender_percent)  {
			check = false;
		}
	}
	if(req.query.center != undefined) {
		if(surrender.center != req.query.center)  {
			check = false;
		}
	}

	if(check) {
		res.push(surrender);
	}
	
	}
	return res;

    /*
        "degree": "History",
        "year": 2018,
        "surrender_counts": 193,
        "new_students": 533,
        "surrender_percent":36.21,
        "center": "FHISTRY"
    */
}

// Pagination method F06.3
function paginationMaker(req, surrenders) {
	var res = [];
	const offset = req.query.offset;
	const limit = req.query.limit;

	if(limit < 1 || offset < 0 || offset > surrenders.length) {
		console.error(`Error in pagination, you have exceded limits`);
		res.push("ERROR");
		return res;	
	}
	const startIndex = offset;
	const endIndex = startIndex + limit;

	res = surrenders.slice(startIndex, endIndex);
	return res;
}

// POST TO RESOURCES LIST F04.1
router.post("/surrenders", function(req,res){
	var newSurrender = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(newSurrender)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Element (surrender) to be inserted: <${JSON.stringify(newSurrender,null,2)}>`);

		db_ab.find({center: newSurrender.center},(err, surrendersFound)=> {
			if(err) {
				console.error("ERROR accesing to the DB in POST" + err);
				res.sendStatus(500); // INTERNAL ERROR F06.6
			} else {

				if (surrendersFound.length == 0) {
					console.log("New budget (this budget) can be inserted to the DB... inserting"
					+ JSON.stringify(surrendersFound,null,2));
					db_ab.insert(newSurrender);
					console.log("New budget (this budget) inserted");
					res.sendStatus(201); // CREATED F06.6
				} else {
					console.log("The budget already exists in the DB... Check conflicts");
					res.sendStatus(409); // CONFLICT F06.6
				}
			}
		});
	}
});

// GET TO A RESOURCE F04.3
router.get("/surrenders/:degree/:year", function(req,res){
	var Rdegree = req.params.degree;
	var Ryear = parseInt(req.params.year);

	console.log(`Searching for the budget with center <${Rdegree}> and year <${Ryear}>`);

	// With both of the identificators F06.10
	db_ab.find({$and: [{degree: Rdegree}, {year: Ryear}]},{},(err, surrendersFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(surrendersFound.length == 0) {
				console.error('Any data has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				// Get off the id.
				surrendersFound.forEach((t)=>{
					delete t._id;
				});
				// RETURNS AN OBJECT, IN THIS CASE, THE ONLY OBJECT ON THE ARRAY F06.11
				console.log(`Found the budget with center <${Rdegree}> and year <${Ryear}> type: <${typeof surrendersFound[0]}>`);
				res.status(200).send(JSON.stringify(surrendersFound[0],null,2)); //OK F06.6 
			}
		}
	});
});

// DELETE TO A RESOURCE F04.4
router.delete("/surrenders/:degree/:year", (req,res)=>{
	var Ddegree = req.params.degree;
	var Dyear = parseInt(req.params.year);

	console.log(`Deleting the budget with center <${Ddegree}> and year <${Dyear}>...`);

	// With both of the identificators F06.10
	db_ab.remove({$and: [{degree: Ddegree}, {year: Dyear}]},(err, numSurrendersRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numSurrendersRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`The budget with center <${Ddegree}> and year <${Dyear}> has been deleted`)
				res.sendStatus(200); // OK F06.6
			}
		}
	});

});

// PUT TO A RESOURCE F04.5
router.put("/surrenders/:degree/:year", function(req,res){

	var Udegree = req.params.degree;
	var Uyear = parseInt(req.params.year);
	var updatedSurrender = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(updatedSurrender)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Deleting the budget with center <${Udegree}> and year <${Uyear}>...`);

		// With both of the identificators F06.10
         /*
        "degree": "History",
        "year": 2018,
        "surrender_counts": 193,
        "new_students": 533,
        "surrender_percent":36.21,
        "center": "FHISTRY"
    */
		db_ab.update({$and: [{degree: Udegree}, {year: Uyear}]},{
			degree: updatedSurrender.degree,
			year: updatedSurrender.year,
			surrender_counts: updatedSurrender.surrender_counts,
			new_students: updatedSurrender.new_students,
			surrender_percent: updatedSurrender.surrender_percent,
			center: updatedSurrender.center },(err, numSurrendersUpdated)=>{
			

				if(err) {
					console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
					res.sendStatus(500); // INTERNAL ERROR F06.6
				} else {
		
					if(numSurrendersUpdated == 0) {
						console.error('Any data has been updated');
						res.sendStatus(404); // NOT FOUND F06.6
					} else {
						console.log(`The budget with center <${Udegree}> and year <${Uyear}> has been updated`)
						res.sendStatus(200); // OK F06.6
					}
				}
		});
	}
});


// POST TO A RESOURCE F04.6 SHOULD RETURN AN ERROR.
router.post("/surrenders/:degree/:year", function(req,res){
	console.log("ERROR, it´s not allowed to make a post to a resource");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// PUT TO THE RESOURCES LIST F04.7 SHOULD RETURN AN ERROR.
router.put("/surrenders", function(req,res){
	console.log("ERROR, it´s not allowed to make a put to the resource list");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// DELETE TO A RESOURCE F04.8
router.delete("/surrenders", (req,res)=>{

	console.log(`Deleting all the budgets...`);

	db_ab.remove({},{multi: true},(err, numSurrendersRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numSurrendersRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`All the budgets has been deleted, a total of <${numSurrendersRemoved}>`)
				res.sendStatus(200); // OK F06.6
			}
		}
	});
});

// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
// HOPED. F06.12
function isValidData(obj){
    if(!Array.isArray(obj)) return validDataEntry(obj);

    for(let element in obj){
        if(!validDataEntry(obj[element])) return false;
    }

    return true;
}

function validDataEntry(obj){
    if(Object.keys(obj).length !== 6) return false;
    if (!obj["degree"]) return false;
	if (!obj.degree) return false;
	if (!obj["year"]) return false;
    if (!obj.year) return false;
	if (!obj["surrender_counts"]) return false;
    if (!obj.surrender_counts) return false;
	if (!obj["new_students"]) return false;
    if (!obj.new_students) return false;
    if (!obj["surrender_percent"]) return false;
	if (!obj.surrender_percent) return false;
    if (!obj["center"]) return false;
	if (!obj.center) return false;
    return true;

     /*
        "degree": "History",
        "year": 2018,
        "surrender_counts": 193,
        "new_students": 533,
        "surrender_percent":36.21,
        "center": "FHISTRY"
    */
}
module.exports = router;