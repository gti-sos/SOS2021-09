const express = require("express");
const router = express.Router();

const Datastore = require('nedb')
const db = new Datastore({ filename: 'dansesben.db', autoload: true });

router
.get('/loadInitialData', (req, res) => {
    db.count({}, function (err, count) {
        if(err){
            console.error(err);
            res.sendStatus(500);
        }
        else
            if(count > 0) res.sendStatus(200);
            else{
                let insert_result = insertIntoDB([{
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
                }]);

                if (insert_result === -1) res.sendStatus(500);
                else res.sendStatus(201);
            }
    });
})
.post('/', (req, res) => {
    let data = req.body;

    if (!isValidData(data)) res.sendStatus(400);
    else
        if(insertIntoDB(data) === -1) res.sendStatus(500);
        else res.sendStatus(201);

})
.get('/', (req, res) => {
    let offset_param = parseInt(req.query.offset);
    let limit_param = parseInt(req.query.limit);

    let offset = isNaN(offset_param) ? 0 : offset_param;
    let limit = isNaN(limit_param) ? 0 : limit_param;

    db.find(documentFromParams(req.query)).skip(offset).limit(limit).exec(function (err, docs) {
        if(err){
            console.error(err);
            res.sendStatus(500);
        }
        else res.json(docs);

    });
})
.put('/', (req, res) =>{
    let document = documentFromParams(req.query);
    let old_id = req.query._id;

    if(!isValidData(document))
        db.findOne({_id: old_id}, function (err, doc) {
            if (err) {
                res.sendStatus(500);
            } else {
                if(doc == null) {
                    res.sendStatus(401);
                    return;
                }
                // Merge objects and override old
                document = {...doc, ...document};
                db.update({_id: old_id}, document, {}, function (err, _) {
                    if(err){
                        console.error(err);
                        res.sendStatus(500);
                    }
                    else res.sendStatus(200);
                });
            }
        });
    else{
        db.update({_id: old_id}, document, {}, function (err, _) {
            if(err){
                console.error(err);
                res.sendStatus(500);
            }
            else res.sendStatus(200);
        });
    }
})
.delete('/', (req, res) =>{
    let document = documentFromParams(req.query);
    let removeAll = req.query.removeAll;

    db.count(document, function (err, count) {
        if(count > 1 && removeAll != "true") {
            res.sendStatus(409);
        }else{
            db.remove(document, { multi: removeAll === "true" }, function (err, numRemoved) {
                if(err){
                    console.error(err);
                    res.sendStatus(500);
                }else res.send(numRemoved.toString());
            });
        }
    });


})
.put('/', (req, res) =>{
    res.sendStatus(405);
});

/*
    Utils for the API
 */

function insertIntoDB(data){
    db.insert(data, function (err, newDoc) {
        if(err){
            console.error(err);
            return -1;
        }

        if(Array.isArray(data)){
            let ids = [];

            for(let doc in data){
                ids.push(doc["_id"]);
            }

            return ids;
        }

        return newDoc["_id"];
    });
}

function documentFromParams(params){
    let document = {};

    if("field-of-knowledge" in params) document["field-of-knowledge"] = params["field-of-knowledge"];
    if("year" in params) document["year"] = parseInt(params["year"]);
    if("performance-percents" in params) document["performance-percents"] = parseInt(params["performance-percents"]);
    if("credits-passed" in params) document["credits-passed"] = parseInt(params["credits-passed"]);
    if("credits-enrolled" in params) document["credits-enrolled"] = params["credits-enrolled"];
    if("center" in params) document["center"] = params["center"];
    if("_id" in params) document["_id"] = params["_id"];

    return document;
}

function isValidData(d){
    if(!Array.isArray(d)) return validDataRow(d);

    for(let element in d){
        if(!validDataRow(element)) return false;
    }

    return true;
}

function validDataRow(d){
    if(Object.keys(d).length !== 6) return false;
    if (!d["field-of-knowledge"]) return false;
    if (!d.year) return false;
    if (!d["performance-percents"]) return false;
    if (!d["credits-passed"]) return false;
    if (!d["credits-enrolled"]) return false;
    if (!d["center-short"]) return false;
    return true;
}

module.exports = router;