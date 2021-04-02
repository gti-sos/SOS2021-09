import express from "express";
var router = express.Router();

interface DataRow {
    "field-of-knowledge": string,
    "year": number,
    "performance-percents": string,
    "credits-passed": number,
    "credits-enrolled": number,
    "center": string
}

var db: DataRow[] = [];

router
.get('/loadInitialData', (req, res) => {
    db = [{
        "field-of-knowledge": "History",
        "year": 2018,
        "performance-percents": "83.44%",
        "credits-passed": 2006,
        "credits-enrolled": 2404,
        "center": "FHISTRY"
    },{
        "field-of-knowledge": "Computer-Science",
        "year": 2018,
        "performance-percents": "87.10%",
        "credits-passed": 1870,
        "credits-enrolled": 2147,
        "center": "ETSII"
    }];
    res.sendStatus(201); // Created
})
.get('/stats', (req, res) => {
    res.json(db);
})
.post('/stats', (req, res) => {
    let data: (DataRow | DataRow[]) = req.body;
    
    if(Array.isArray(data)){
        data.forEach((row) =>{
            if (validDataRow(row)){
                db.push(row);
            }else{
                console.log(`Invalid data: ${JSON.stringify(row)}`)
            }
        });
    }else{
        if (validDataRow(data)){
            db.push(data);
        }else{
            console.log(`Invalid data: ${JSON.stringify(data)}`)
        }
    }

    res.sendStatus(201);
})
.get('/stats/:center/:field_of_knowledge/:year', (req, res) =>{
    let center: string = req.params.center;
    let field_of_knowledge: string = req.params.field_of_knowledge;
    let year: number = parseInt(req.params.year);

    // Get the data
    var result: DataRow[] = [];
    db.forEach((row) =>{
        if(row["center-short"] == center && row["year"] == year && row["field-of-knowledge"] == field_of_knowledge) result.push(row);
    });
    
    res.json(result);
})
.delete('/stats/:center/:field_of_knowledge/:year', (req, res) =>{
    let center: string = req.params.center;
    let field_of_knowledge: string = req.params.field_of_knowledge;
    let year: number = parseInt(req.params.year);

    // Remove the affected row
    db = db.filter((row) =>{
        return !(row["center-short"] == center && row["year"] == year && row["field-of-knowledge"] == field_of_knowledge)
    });
    
    res.sendStatus(200);
})
.put('/stats/:center/:field_of_knowledge/:year', (req, res) =>{
    let center: string = req.params.center;
    let field_of_knowledge: string = req.params.field_of_knowledge;
    let year: number = parseInt(req.params.year);

    let data: DataRow = req.body;

    if(!validDataRow(data)) {
        res.sendStatus(400); // Invalid data
        return;
    }

    // Modify the affected row
    for(let row of db){
        if (row["center-short"] == center && row["year"] == year && row["field-of-knowledge"] == field_of_knowledge){
            db[db.indexOf(row)] = req.body;
            break;
        }
    }

    res.sendStatus(200);
})
.delete('/stats', (req, res) =>{
    db = [];

    res.sendStatus(200);
})

/// Checks if and Object is a valid DataRow
function validDataRow(d: DataRow){
    if(Object.keys(d).length != 6) return false;
    if (!d["field-of-knowledge"]) return false;
    if (!d.year) return false;
    if (!d["performance-percents"]) return false;
    if (!d["credits-passed"]) return false;
    if (!d["credits-enrolled"]) return false;
    if (!d["center-short"]) return false;
    return true;
}

module.exports = router;