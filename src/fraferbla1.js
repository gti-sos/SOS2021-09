
var express = require("express");
var router = express.Router();
var Datastore = require("nedb");

var dbcuts = new Datastore({ filename: './cutsDB'});

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
        "selectivity_presented_seville": 10517,
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
	dbcuts.insert(datosGuardados);
	console.log(`Data added: <${JSON.stringify(datosGuardados,null,2)}>`);
	res.sendStatus(201);
});

// SEARCHS F06.2 | RETURNS A LIST WITH ALL RESOURCES F04.1
// Return a specific budget or all budgets as the query deteminates.
router.get("/cuts",(req,res)=>{

	var selectedCuts = [];
	
	dbcuts.find({},(err, cutsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET" + err);
			res.sendStatus(500); // INTERNAL ERROR. F06.6
		} else {

			// Check if we want to search an specific budget or if we want all of them.
			// In case of no filtering has been declared, all budgets will be sended. SEARCHS
			if(Object.keys(req.query).length == 0) {
				selectedCuts = cutsFound;

				// PAGINATION F06.3
			} else if(req.query.limit != undefined || req.query.offset != undefined) {
				selectedCuts = paginationMaker(req, selectedCuts);
			}
			  else {
				selectedCuts = filterOfRequest(req, selectedCuts);
			}

			// Get off the id.
			selectedCuts.forEach((t)=>{
				delete t._id;
			});

			if(selectedCuts.includes("ERROR")) {
				res.sendStatus(400); // BAD REQUEST, the values of limit and offset are wrong. F06.6
			} else if(selectedCuts.length == 0) {
				console.error('No cut has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			}
			else {
				// RETURNS AN ARRAY F06.11
				console.log(`Es array?: <${Array.isArray(selectedCuts)}>`);
				res.status(200).send(JSON.stringify(selectedCuts,null,2)); //OK F06.6
			}
		}
	});
});

// Search method F06.2
function filterOfRequest(req, cuts) {
	var res = [];

	for(var cut of cuts) {
	var check = true;

	// We must check for each budget wich field is selected to comparate, if selected,
	// the metod will check if the value of the budget on that field matches with the value on query.
	if(req.query.degree != undefined) {
		if(cut.degree != req.query.degree)  {
			check = false;
		}
	}
	if(req.query.year != undefined) {
		if(cut.year != req.query.year)  {
			check = false;
		}
	}
	if(req.query.cut_off_mark != undefined) {
		if(cut.cut_off_mark != req.query.cut_off_mark)  {
			check = false;
		}
	}
	if(req.query.selectivity_presented_seville != undefined) {
		if(cut.selectivity_presented_seville != req.query.selectivity_presented_seville)  {
			check = false;
		}
	}
	if(req.query.price_admision != undefined) {
		if(cut.price_admision != req.query.price_admision)  {
			check = false;
		}
	}
	if(req.query.faculty != undefined) {
		if(cut.faculty != req.query.faculty)  {
			check = false;
		}
	}

	if(check) {
		res.push(cut);
	}
	
	}
	return res;
}

// Pagination method F06.3
function paginationMaker(req, cuts) {
	var res = [];
	const offset = req.query.offset;
	const limit = req.query.limit;

	if(limit < 1 || offset < 0 || offset > cuts.length) {
		console.error(`Error in pagination, you have exceeded limits`);
		res.push("ERROR");
		return res;	
	}
	const startIndex = offset;
	const endIndex = startIndex + limit;

	res = cuts.slice(startIndex, endIndex);
	return res;
}

// POST TO RESOURCES LIST F04.1
router.post("/cuts", function(req,res){
	var newCut = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(newCut)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Element (cut) to be inserted: <${JSON.stringify(newCut,null,2)}>`);

		dbcuts.find({degree: newCut.degree},(err, cutsFound)=> {
			if(err) {
				console.error("ERROR accesing to the DB in POST" + err);
				res.sendStatus(500); // INTERNAL ERROR F06.6
			} else {

				if (cutsFound.length == 0) {
					console.log("New cut (this cut) can be inserted to the DB... inserting"
					+ JSON.stringify(cutsFound,null,2));
					dbcuts.insert(newCut);
					console.log("New cut (this cut) inserted");
					res.sendStatus(201); // CREATED F06.6
				} else {
					console.log("The cut already exists in the DB... Check conflicts");
					res.sendStatus(409); // CONFLICT F06.6
				}
			}
		});
	}
});

// GET TO A RESOURCE F04.3
router.get("/cuts/:degree/:year", function(req,res){
	var Rdegree = req.params.degree;
	var Ryear = parseInt(req.params.year);

	console.log(`Searching for the cut with degree <${Rdegree}> and year <${Ryear}>`);

	// With both of the identificators F06.10
	dbcuts.find({$and: [{degree: Rdegree}, {year: Ryear}]},{},(err, cutsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(cutsFound.length == 0) {
				console.error('Any data has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				// Get off the id.
				cutsFound.forEach((t)=>{
					delete t._id;
				});
				// RETURNS AN OBJECT, IN THIS CASE, THE ONLY OBJECT ON THE ARRAY F06.11
				console.log(`Found the cut with degree <${Rdegree}> and year <${Ryear}> type: <${typeof cutsFound[0]}>`);
				res.status(200).send(JSON.stringify(cutsFound[0],null,2)); //OK F06.6 
			}
		}
	});
});

// DELETE TO A RESOURCE F04.4
router.delete("/cuts/:degree/:year", (req,res)=>{
	var Ddegree = req.params.degree;
	var Dyear = parseInt(req.params.year);

	console.log(`Deleting the cut with degree <${Ddegree}> and year <${Dyear}>...`);

	// With both of the identificators F06.10
	dbcuts.remove({$and: [{degree: Ddegree}, {year: Dyear}]},(err, numCutsRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numCutsRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`The cut with degree <${Ddegree}> and year <${Dyear}> has been deleted`)
				res.sendStatus(200); // OK F06.6
			}
		}
	});

});

// PUT TO A RESOURCE F04.5
router.put("/cuts/:degree/:year", function(req,res){

	var Udegree = req.params.degree;
	var Uyear = parseInt(req.params.year);
	var updatedCut = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(updatedCut)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Deleting the cut with degree <${Udegree}> and year <${Uyear}>...`);

		// With both of the identificators F06.10
		dbcuts.update({$and: [{degree: Udegree}, {year: Uyear}]},{
			degree: updatedCut.degree,
			year: updatedCut.year,
			cut_off_mark: updatedCut.cut_off_mark,
			selectivity_presented_seville: updatedCut.selectivity_presented_seville,
			price_admision: updatedCut.price_admision,
			faculty: updatedCut.faculty },(err, numCutsUpdated)=>{
			

				if(err) {
					console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
					res.sendStatus(500); // INTERNAL ERROR F06.6
				} else {
		
					if(numCutsUpdated == 0) {
						console.error('No data has been updated');
						res.sendStatus(404); // NOT FOUND F06.6
					} else {
						console.log(`The cut with degree <${Udegree}> and year <${Uyear}> has been updated`)
						res.sendStatus(200); // OK F06.6
					}
				}
		});
	}
});

// POST TO A RESOURCE F04.6 SHOULD RETURN AN ERROR.
router.post("/cuts/:degree/:year", function(req,res){
	console.log("ERROR, it´s not allowed to make a post to a resource");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// PUT TO THE RESOURCES LIST F04.7 SHOULD RETURN AN ERROR.
router.put("/cuts", function(req,res){
	console.log("ERROR, it´s not allowed to make a put to the resource list");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// DELETE TO A RESOURCE F04.8
router.delete("/cuts", (req,res)=>{

	console.log(`Deleting all cuts...`);

	dbcuts.remove({},{multi: true},(err, numCutsRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numCutsRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`All cutve has been deleted, a total of <${numCutsRemoved}>`)
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
    if (!obj.year) return false;
    if (!obj["cut_off_mark"]) return false;
    if (!obj.selectivity_presented_seville) return false;
    if (!obj.price_admision) return false;
    if (!obj["faculty"]) return false;
    return true;
}

module.exports = router;