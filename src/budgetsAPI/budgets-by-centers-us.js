// Requiere el paquete express
var express = require("express");

// Requiere el paquete nedb, que es el paquete de la base de datos.
var Datastore = require("nedb");

// Inicializamos la base de datos. PERSISTANCE F06.4
var dbBudgetsByCenters = new Datastore({ filename: './budgetsAPI/budgetsDB' });
	dbBudgetsByCenters.loadDatabase(function (err) {    // Callback is optional
  	// Now commands will be executed
});
// Iniciamos el routeador de la app.
var router = express.Router();

// Array de datos Inicales.
var initialData = [{
    "center": "ETSII",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 38717.17,
    "amounts_by_number_of_proffessors": 93753.44,
    "total": 143474.00
},{
    "center": "ETSIA",
    "year": 2018,
    "fixed_fees": 11003.22,
    "amounts_by_number_of_etc": 30500.00,
    "amounts_by_number_of_proffessors": 80460.90,
    "total": 120500.20

},{
	"center": "FCOM",
	"year": 2018,
	"fixed_fees": 11003.22,
	"amounts_by_number_of_etc": 93753.44,
	"amounts_by_number_of_proffessors": 50700.59,
	"total": 180600.20
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

// SEARCHS F06.2
// Return a specific budget or all budgets as the query deteminates.
router.get("/budgets",(req,res)=>{

	var selectedBudgets = [];
	
	dbBudgetsByCenters.find({},(err, budgetsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in GET" + err);
			res.sendStatus(500); // INTERNAL ERROR.
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
				res.sendStatus(400); // BAD REQUEST
			} else if(selectedBudgets.length == 0) {
				console.error('Any budget has been found');
				res.sendStatus(404); // NOT FOUND
			}
			else {
				res.send(JSON.stringify(selectedBudgets,null,2)); //OK
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

router.post("/budgets", function(req,res){
	var newBudget = req.body;

	console.log(`Element (budget) to be inserted: <${JSON.stringify(newBudget,null,2)}>`);

	dbBudgetsByCenters.find({center: newBudget.center},(err, budgetsFound)=> {
		if(err) {
			console.error("ERROR accesing to the DB in POST" + err);
			res.sendStatus(500);
		} else {

			if (budgetsFound.length == 0) {
				console.log("New budget (this budget) can be inserted to the DB... inserting"
				+ JSON.stringify(budgetsFound,null,2));
				dbBudgetsByCenters.insert(newBudget);
				res.sendStatus(201);
			} else {
				console.log("The budget already exists in the DB... Check conflicts");
				res.sendStatus(409); // CONFLICT
			}
		}
	});
});
module.exports = router;