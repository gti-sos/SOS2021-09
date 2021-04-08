import express from "express";
var router = express.Router();

interface DataRow {
    "center": string,
    "year": number,
    "fixed-fees": number,
    "amounts-by-number-of-etc": number,
    "amounts-by-number-of-proffesors": number,
    "total": number
}

var db: DataRow[] = [];

router
.get('/loadInitialData', (req, res) => {
    db = [{
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
    }];
    res.sendStatus(201); // Código de creado
})
.get('/stats', (req, res) => {
    res.json(db);
})
.post('/stats', (req, res) => {
    let entry: (DataRow | DataRow[]) = req.body;
    
    if(Array.isArray(entry)){
        entry.forEach((row) =>{
            if (validDataRow(row)){
                db.push(row);
            }else{
                console.log(`Invalid data: ${JSON.stringify(row)}`)
            }
        });
    }else{
        if (validDataRow(entry)){
            db.push(entry);
        }else{
            console.log(`Invalid data: ${JSON.stringify(entry)}`)
        }
    }

    res.sendStatus(201);
})
.get('/stats/:center/:year/:total', (req, res) =>{
    let center: string = req.params.center;
    let year: number = parseInt(req.params.year);
    let total: number = parseInt(req.params.total);

    // Get the data from the variables and add them into the row.
    var result: DataRow[] = [];
    db.forEach((row) =>{
        if(row["center"] == center && row["year"] == year && row["total"] == total) result.push(row);
    });
    
    res.json(result);
})
.delete('/stats/:center/:year/:total', (req, res) =>{
    let center: string = req.params.center;
    let year: number = parseInt(req.params.year);
    let total: number = parseInt(req.params.total);

    // Remove the row that the user chose.
    db = db.filter((row) =>{
        return !(row["center"] == center && row["year"] == year && row["total"] == total)
    });
    
    res.sendStatus(200);
})
.put('/stats/:center/:year/:total', (req, res) =>{

    let center: string = req.params.center;
    let year: number = parseInt(req.params.year);
    let total: number = parseInt(req.params.total);

    let data: DataRow = req.body;

    // Modify the row that the user chose
    for(let row of db){
        if (row["center"] == center && row["year"] == year && row["total"] == total){
            db[db.indexOf(row)] = req.body;
            break;
        }
    }

    res.sendStatus(200);
})

// We can´t do a post to a unique object of the collection. BLUE TABLE
.post('/stats/:center/:year/:total', (req, res) =>{
    res.sendStatus(405);
})

// We can delete the collection. BLUE TABLE
.delete('/stats', (req, res) =>{
    db = [];

    res.sendStatus(200);
})

// We can´t update the entire collection. BLUE TABLE
.put('/stats', (req, res) =>{
    res.sendStatus(405);
})


/// Checks if and Object is a valid DataRow
function validDataRow(d: DataRow){
    if(Object.keys(d).length != 6) return false;
    if (!d["center"]) return false;
    if (!d.year) return false;
    if (!d["fixed-fees"]) return false;
    if (!d["amounts-by-number-of-etc"]) return false;
    if (!d["amounts-by-number-of-proffesors"]) return false;
    if (!d["total"]) return false;
    return true;
}

export default router;