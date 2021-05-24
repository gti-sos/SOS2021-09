// Requiere el paquete express
var express = require("express");

// Requiere el paquete nedb, que es el paquete de la base de datos.
var Datastore = require("nedb");

// Inicializamos la base de datos. PERSISTANCE F06.4
var dbBudgetsByCenters = new Datastore({ filename: 'dbs/budgetsDB' });
	dbBudgetsByCenters.loadDatabase(function (err) {    // Callback is optional
  	// Now commands will be executed
});
// Iniciamos el routeador de la app.
var router = express.Router();

// Array de datos Inicales.
var initialData = [{
    "center": "ETSII",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 26318.20,
    "amounts_by_number_of_proffessors": 85737.33,
    "total": 122305.00
},{
    "center": "ETSII",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 30640.58,
    "amounts_by_number_of_proffessors": 87790.93,
    "total": 129435.00
},{
    "center": "ETSII",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 32066.49,
    "amounts_by_number_of_proffessors": 91509.11,
    "total": 134579.00
},{
    "center": "ETSII",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 33975.07,
    "amounts_by_number_of_proffessors": 90094.48,
    "total": 135073.00
},{
    "center": "ETSIA",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 7817.85,
    "amounts_by_number_of_proffessors": 40422.76,
    "total": 58490.00

},{
    "center": "ETSIA",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 10122.80,
    "amounts_by_number_of_proffessors": 41789.01,
    "total": 62915.00

},{
    "center": "ETSIA",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 11593.15,
    "amounts_by_number_of_proffessors": 40517.39,
    "total": 63114.00

},{
    "center": "ETSIA",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 13359.66,
    "amounts_by_number_of_proffessors": 390034.16,
    "total": 63397.00

},{
	"center": "FCOM",
	"year": 2014,
	"fixed_fees": 10249.62,
	"amounts_by_number_of_etc": 49216.96,
	"amounts_by_number_of_proffessors": 48223.76,
	"total": 107690.00
},{
	"center": "FCOM",
	"year": 2015,
	"fixed_fees": 11003.22,
	"amounts_by_number_of_etc": 51061.14,
	"amounts_by_number_of_proffessors": 50917.39,
	"total": 112982.00
},{
	"center": "FCOM",
	"year": 2016,
	"fixed_fees": 11003.22,
	"amounts_by_number_of_etc": 42535.96,
	"amounts_by_number_of_proffessors": 49146.96,
	"total": 102686.00
},{
	"center": "FCOM",
	"year": 2018,
	"fixed_fees": 11003.22,
	"amounts_by_number_of_etc": 42723.99,
	"amounts_by_number_of_proffessors": 46603.89,
	"total": 100331.00
},{
    "center": "EPS",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 24126.24,
    "amounts_by_number_of_proffessors": 61539.94,
    "total": 95916.94

},{
    "center": "EPS",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 31396.73,
    "amounts_by_number_of_proffessors": 64841.61,
    "total": 107242.00

},{
    "center": "EPS",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 37027.55,
    "amounts_by_number_of_proffessors": 66374.07,
    "total": 114405.00

},{
    "center": "EPS",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 37406.42,
    "amounts_by_number_of_proffessors": 64872.47,
    "total": 113282.00

},{
    "center": "FHITST",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 35687.77,
    "amounts_by_number_of_proffessors": 72756.75,
    "total": 118694.20

},{
    "center": "FHITST",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 35444.51,
    "amounts_by_number_of_proffessors": 74442.99,
    "total": 120891.00

},{
    "center": "FHITST",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 36629.44,
    "amounts_by_number_of_proffessors": 76764.03,
    "total": 124397.00

},{
    "center": "FHITST",
    "year": 2018,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 39031.12,
    "amounts_by_number_of_proffessors": 78835.82,
    "total": 128870.00

},{
    "center": "FBBAA",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 21152.05,
    "amounts_by_number_of_proffessors": 42563.28,
    "total": 73965.00

},{
    "center": "FBBAA",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 19383.25,
    "amounts_by_number_of_proffessors": 47037.11,
    "total": 77424.00

},{
    "center": "FBBAA",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 15715.24,
    "amounts_by_number_of_proffessors": 43243.84,
    "total": 69692.00

},{
    "center": "FBBAA",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 16042.68,
    "amounts_by_number_of_proffessors": 41415.29,
    "total": 68461.00

},{
    "center": "ETSI",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 74504.96,
    "amounts_by_number_of_proffessors": 159822.86,
    "total": 244577.00

},{
    "center": "ETSI",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 78516.79,
    "amounts_by_number_of_proffessors": 163264.32,
    "total": 252784.00

},{
    "center": "ETSI",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 75367.11,
    "amounts_by_number_of_proffessors": 164442.13,
    "total": 250812.00

},{
    "center": "ETSI",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 80493.85,
    "amounts_by_number_of_proffessors": 168229.31,
    "total": 259726.00

},{
    "center": "FMAT",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 8404.26,
    "amounts_by_number_of_proffessors": 36360.64,
    "total": 55015.00

},{
    "center": "FMAT",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 9835.56,
    "amounts_by_number_of_proffessors": 37881.08,
    "total": 58720.00

},{
    "center": "FMAT",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 10882.33,
    "amounts_by_number_of_proffessors": 38039.76,
    "total": 59925.00

},{
    "center": "FMAT",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 12187.79,
    "amounts_by_number_of_proffessors": 38674.96,
    "total": 61866.00

},{
    "center": "FFIS",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 7239.52,
    "amounts_by_number_of_proffessors": 40206.58,
    "total": 57706.00

},{
    "center": "FFIS",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 8157.45,
    "amounts_by_number_of_proffessors": 40216.20,
    "total": 59377.00

},{
    "center": "FFIS",
    "year": 2016,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 9216.80,
    "amounts_by_number_of_proffessors": 41368.70,
    "total": 61589.00

},{
    "center": "FFIS",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 12362.97,
    "amounts_by_number_of_proffessors": 43602.41,
    "total": 66969.00

},{
    "center": "FBIO",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 25087.20,
    "amounts_by_number_of_proffessors": 70420.95,
    "total": 105758.00

},{
    "center": "FBIO",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23185.56,
    "amounts_by_number_of_proffessors": 69046.06,
    "total": 103235.20

},{
    "center": "FBIO",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 24481.13,
    "amounts_by_number_of_proffessors": 67257.81,
    "total": 102742.00

},{
    "center": "FBIO",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 21744.66,
    "amounts_by_number_of_proffessors": 72718.87,
    "total": 105467.00

},{
    "center": "FFARM",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 29843.28,
    "amounts_by_number_of_proffessors": 76898.13,
    "total": 116991.00

},{
    "center": "FFARM",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 33529.93,
    "amounts_by_number_of_proffessors": 77355.41,
    "total": 121888.00

},{
    "center": "FFARM",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 36657.55,
    "amounts_by_number_of_proffessors": 79791.02,
    "total": 127452.00

},{
    "center": "FFARM",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 36462.03,
    "amounts_by_number_of_proffessors": 82352.97,
    "total": 129818.00

},{
    "center": "FDERECHO",
    "year": 2014,
    "fixed_fees": 10249.62,
    "amounts_by_number_of_etc": 62675.04,
    "amounts_by_number_of_proffessors": 79505.24,
    "total": 152430.00

},{
    "center": "FDERECHO",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 67329.96,
    "amounts_by_number_of_proffessors": 85046.65,
    "total": 163380.00

},{
    "center": "FDERECHO",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 72583.76,
    "amounts_by_number_of_proffessors": 86454.77,
    "total": 170042.00

},{
    "center": "FDERECHO",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 71163.37,
    "amounts_by_number_of_proffessors": 85961.99,
    "total": 168129.00

},{
    "center": "ETSIE",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 25717.01,
    "amounts_by_number_of_proffessors": 54665.24,
    "total": 90632.00

},{
    "center": "ETSIE",
    "year": 2015,
    "fixed_fees": 11003.24,
    "amounts_by_number_of_etc": 22581.13,
    "amounts_by_number_of_proffessors": 56516.50,
    "total": 90101.00

},{
    "center": "ETSIE",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 17351.35,
    "amounts_by_number_of_proffessors": 55331.33,
    "total": 83686.00

},{
    "center": "ETSIE",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 12289.06,
    "amounts_by_number_of_proffessors": 50088.55,
    "total": 73381.00

}];

// Index page.
router.get("/", (req,res) =>{
    res.send('<html><body><h1> Hi!</h1> <br> <h3> This is the API home page: "Budgets by Centers US". Please, load <a href="http://sos2021-09.herokuapp.com">the initial data</a> to display the information.</h3></body><html>');
    res.sendStatus(200); // OK
});

// Charge the initial data.
router.get("/loadInitialData", (req,res) =>{
	dbBudgetsByCenters.insert(initialData);
    console.log(`Data added: <${JSON.stringify(initialData,null,2)}>`);
    res.sendStatus(201); // CREATED
});

////////////////////// MAIN CODE ////////////////////////////

// SEARCHS F06.2 | RETURNS A LIST WITH ALL RESOURCES F04.1
// Return a specific budget or all budgets as the query deteminates.
router.get("/budgets",(req,res)=>{

	var selectedBudgets = [];
	
	dbBudgetsByCenters.find({},(err, budgetsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET" + err);
			res.sendStatus(500); // INTERNAL ERROR. F06.6
		} else {

			// Check if we want to search an specific budget or if we want all of them.
			// In case of no filtering has been declared, all budgets will be sended. SEARCHS
			if(Object.keys(req.query).length == 0) {
				selectedBudgets = budgetsFound;

				// PAGINATION F06.3
			} else if(req.query.limit != undefined || req.query.offset != undefined) {
				selectedBudgets = paginationMaker(req, budgetsFound);
			}
			  else {
				selectedBudgets = filterOfRequest(req, budgetsFound);
			}

			// Get off the id.
			selectedBudgets.forEach((t)=>{
				delete t._id;
			});

			if(selectedBudgets.includes("ERROR")) {
				res.sendStatus(400); // BAD REQUEST, the values of limit and offset are wrong. F06.6
			} else if(selectedBudgets.length == 0) {
				console.error('Any budget has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			}
			else {
				// RETURNS AN ARRAY F06.11
				console.log(`Es array?: <${Array.isArray(selectedBudgets)}>`);
				res.status(200).send(JSON.stringify(selectedBudgets,null,2)); //OK F06.6
			}
		}
	});
});

// Search method F06.2
function filterOfRequest(req, budgets) {
	var res = [];

	for(var budget of budgets) {
	var check = true;

	// We mus check for each budget wich field is selected to comparate, if selected,
	// the metod will check if the value of the budget on that field matches with the value on query.
	if(req.query.center != undefined) {
		if(budget.center != req.query.center)  {
			check = false;
		}
	}
	if(req.query.year != undefined) {
		if(budget.year != req.query.year)  {
			check = false;
		}
	}
	if(req.query.fixed_fees != undefined) {
		if(budget.fixed_fees != req.query.fixed_fees)  {
			check = false;
		}
	}
	if(req.query.amounts_by_number_of_etc != undefined) {
		if(budget.amounts_by_number_of_etc != req.query.amounts_by_number_of_etc)  {
			check = false;
		}
	}
	if(req.query.amounts_by_number_of_proffessors != undefined) {
		if(budget.amounts_by_number_of_proffessors != req.query.amounts_by_number_of_proffessors)  {
			check = false;
		}
	}
	if(req.query.total != undefined) {
		if(budget.total != req.query.total)  {
			check = false;
		}
	}

	if(check) {
		res.push(budget);
	}
	
	}
	return res;
}

// Pagination method F06.3
function paginationMaker(req, budgets) {
	var res = [];
	const offset = req.query.offset;
	const limit = req.query.limit;

	if(limit < 1 || offset < 0 || offset > budgets.length) {
		console.error(`Error in pagination, you have exceded limits`);
		res.push("ERROR");
		return res;	
	}
	const startIndex = offset;
	const endIndex = startIndex + limit;

	res = budgets.slice(startIndex, endIndex);
	return res;
}

// POST TO RESOURCES LIST F04.1
router.post("/budgets", function(req,res){
	var newBudget = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(newBudget)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Element (budget) to be inserted: <${JSON.stringify(newBudget,null,2)}>`);

		dbBudgetsByCenters.find({center: newBudget.center},(err, budgetsFound)=> {
			if(err) {
				console.error("ERROR accesing to the DB in POST" + err);
				res.sendStatus(500); // INTERNAL ERROR F06.6
			} else {

				if (budgetsFound.length == 0) {
					console.log("New budget (this budget) can be inserted to the DB... inserting"
					+ JSON.stringify(budgetsFound,null,2));
					dbBudgetsByCenters.insert(newBudget);
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
router.get("/budgets/:center/:year", function(req,res){
	var Rcenter = req.params.center;
	var Ryear = parseInt(req.params.year);

	console.log(`Searching for the budget with center <${Rcenter}> and year <${Ryear}>`);

	// With both of the identificators F06.10
	dbBudgetsByCenters.find({$and: [{center: Rcenter}, {year: Ryear}]},{},(err, budgetsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(budgetsFound.length == 0) {
				console.error('Any data has been found');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				// Get off the id.
				budgetsFound.forEach((t)=>{
					delete t._id;
				});
				// RETURNS AN OBJECT, IN THIS CASE, THE ONLY OBJECT ON THE ARRAY F06.11
				console.log(`Found the budget with center <${Rcenter}> and year <${Ryear}> type: <${typeof budgetsFound[0]}>`);
				res.status(200).send(JSON.stringify(budgetsFound[0],null,2)); //OK F06.6 
			}
		}
	});
});

// DELETE TO A RESOURCE F04.4
router.delete("/budgets/:center/:year", (req,res)=>{
	var Dcenter = req.params.center;
	var Dyear = parseInt(req.params.year);

	console.log(`Deleting the budget with center <${Dcenter}> and year <${Dyear}>...`);

	// With both of the identificators F06.10
	dbBudgetsByCenters.remove({$and: [{center: Dcenter}, {year: Dyear}]},(err, numBudgetsRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numBudgetsRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`The budget with center <${Dcenter}> and year <${Dyear}> has been deleted`)
				res.sendStatus(200); // OK F06.6
			}
		}
	});

});

// PUT TO A RESOURCE F04.5
router.put("/budgets/:center/:year", function(req,res){

	var Ucenter = req.params.center;
	var Uyear = parseInt(req.params.year);
	var updatedBudget = req.body;

	// WE SHOULD RETURN A 400 CODE WHEN WE DONT RECEIVE A JSON DATA WITH THE EXACTLY DATA STRUCTURE
	// HOPED. F06.12
	if(!isValidData(updatedBudget)) {
		console.error("ERROR incorrect structure of entry data in POST");
		res.sendStatus(400); // BAD REQUEST F06.6
	} else {
		console.log(`Deleting the budget with center <${Ucenter}> and year <${Uyear}>...`);

		// With both of the identificators F06.10
		dbBudgetsByCenters.update({$and: [{center: Ucenter}, {year: Uyear}]},{
			center: updatedBudget.center,
			year: updatedBudget.year,
			fixed_fees: updatedBudget.fixed_fees,
			amounts_by_number_of_etc: updatedBudget.amounts_by_number_of_etc,
			amounts_by_number_of_proffessors: updatedBudget.amounts_by_number_of_proffessors,
			total: updatedBudget.total },(err, numBudgetsUpdated)=>{
			

				if(err) {
					console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
					res.sendStatus(500); // INTERNAL ERROR F06.6
				} else {
		
					if(numBudgetsUpdated == 0) {
						console.error('Any data has been updated');
						res.sendStatus(404); // NOT FOUND F06.6
					} else {
						console.log(`The budget with center <${Ucenter}> and year <${Uyear}> has been updated`)
						res.sendStatus(200); // OK F06.6
					}
				}
		});
	}
});

// POST TO A RESOURCE F04.6 SHOULD RETURN AN ERROR.
router.post("/budgets/:center/:year", function(req,res){
	console.log("ERROR, it´s not allowed to make a post to a resource");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// PUT TO THE RESOURCES LIST F04.7 SHOULD RETURN AN ERROR.
router.put("/budgets", function(req,res){
	console.log("ERROR, it´s not allowed to make a put to the resource list");
	res.sendStatus(405); // NOT ALLOWED F06.6
});

// DELETE TO A RESOURCE F04.8
router.delete("/budgets", (req,res)=>{

	console.log(`Deleting all the budgets...`);

	dbBudgetsByCenters.remove({},{multi: true},(err, numBudgetsRemoved)=>{
		if(err) {
			console.error("ERROR accesing to the DB in DELETE TO A RESOURCE" + err);
			res.sendStatus(500); // INTERNAL ERROR F06.6
		} else {

			if(numBudgetsRemoved == 0) {
				console.error('Any data has been deleted');
				res.sendStatus(404); // NOT FOUND F06.6
			} else {
				console.log(`All the budgets has been deleted, a total of <${numBudgetsRemoved}>`)
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
    if (!obj["center"]) return false;
    if (!obj.year) return false;
    if (!obj["fixed_fees"]) return false;
    if (!obj["amounts_by_number_of_etc"]) return false;
    if (!obj["amounts_by_number_of_proffessors"]) return false;
    if (!obj["total"]) return false;
    return true;
}

module.exports = router;

/*
,{
    "center": "FFILO",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 30500.00,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 120500.20

},{
    "center": "FFILO",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 30500.00,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 120500.20

},{
    "center": "FFILO",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 30500.00,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 120500.20

},{
    "center": "FFILO",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 30500.00,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 120500.20

},{
    "center": "FMEDICINA",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 143474.00

},{
    "center": "FMEDICINA",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 143474.00

},{
    "center": "FMEDICINA",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 143474.00

},{
    "center": "FMEDICINA",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 50700.59,
    "total": 143474.00

},{
    "center": "FENFERM",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FENFERM",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FENFERM",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FENFERM",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FODONT",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 120500.20

},{
    "center": "FODONT",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 120500.20

},{
    "center": "FODONT",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 120500.20

},{
    "center": "FODONT",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 120500.20

},{
    "center": "FTURISMO",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 143474.00

},{
    "center": "FTURISMO",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 143474.00

},{
    "center": "FTURISMO",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 143474.00

},{
    "center": "FTURISMO",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 143474.00

},{
    "center": "FPSICO",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 120500.20

},{
    "center": "FPSICO",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 120500.20

},{
    "center": "FPSICO",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 120500.20

},{
    "center": "FPSICO",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 93753.44,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 120500.20

},{
    "center": "FEMPR",
    "year": 2014,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FEMPR",
    "year": 2015,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FEMPR",
    "year": 2016,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

},{
    "center": "FEMPR",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 23534.00,
    "amounts_by_number_of_proffessors": 46456.90,
    "total": 180600.20

}
*/