const express = require("express");
const router = express.Router();

const Datastore = require('nedb')
const db = new Datastore();

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
                let documents = [{
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
                },
                {
                    "field-of-knowledge": "Computer-Science",
                    "year": 2019,
                    "performance-percents": "80.01%",
                    "credits-passed": 1270,
                    "credits-enrolled": 2547,
                    "center": "ETSII"
                },
                {
                    "field-of-knowledge": "Computer-Science",
                    "year": 2020,
                    "performance-percents": "75.10%",
                    "credits-passed": 970,
                    "credits-enrolled": 2547,
                    "center": "ETSII"
                },
                {
                    "field-of-knowledge": "Computer-Science",
                    "year": 2021,
                    "performance-percents": "83.10%",
                    "credits-passed": 1970,
                    "credits-enrolled": 2347,
                    "center": "ETSII"
                },
                {
                    "field-of-knowledge": "Computer-Science",
                    "year": 2017,
                    "performance-percents": "90.10%",
                    "credits-passed": 4231,
                    "credits-enrolled": 5123,
                    "center": "ETSII"
                }];

                for(let doc in documents){
                    db.count(documents[doc], function (err, count) {
                        if(count === 0) {
                            db.insert(documents[doc], function (err, newDoc) {
                                if(err){
                                    console.error(err);
                                    res.sendStatus(500);
                                }
                            });
                        }
                    });
                }
                res.sendStatus(201);
            }
    });
})
.post('/', (req, res) => {
    let data = req.body;

    if(Array.isArray(req.body)) {
        res.sendStatus(400);
        return;
    }

    if (!isValidData(data)) res.sendStatus(400);
    else{
        db.count(data, function (err, count) {
            if(count === 0) {
                db.insert(data, function (err, newDoc) {
                    if(err){
                        console.error(err);
                        res.sendStatus(500);
                    }else{
                        res.sendStatus(201);
                    }
                });
            }else{
                res.sendStatus(409);
            }
        });
    }
})
.get('/', (req, res) => {
    let offset_param = parseInt(req.query.offset);
    let limit_param = parseInt(req.query.limit);

    let offset = isNaN(offset_param) ? 0 : offset_param;
    let limit = isNaN(limit_param) ? 0 : limit_param;

    db.find(documentFromParams(req.query), {_id: 0}).skip(offset).limit(limit).exec(function (err, docs) {
        if(err){
            console.error(err);
            res.sendStatus(500);
        }
        else res.json(docs);
    });
})
.put('/:center/:year/:field_of_knowledge', (req, res) =>{
    if(Array.isArray(req.body)) {
        res.sendStatus(400);
        return;
    }

    let document = {"center": req.params.center, "year": parseInt(req.params.year),
    "field-of-knowledge": req.params["field_of_knowledge"]};
    let new_document = documentFromParams(req.body);

    if(isValidData(new_document)){
        db.findOne(document, function (err, doc) {
            if(err){
                console.error(err);
                res.sendStatus(500);
            }else{
                if(doc === null) res.sendStatus(404);
                else
                    db.update({_id: doc["_id"]}, new_document, {}, function (err, _) {
                        if(err){
                            console.error(err);
                            res.sendStatus(500);
                        }
                        else res.sendStatus(200);
                    });
            }
        });
    }
    else{
        res.sendStatus(400);
    }
})
.delete('/:center/:year/:field_of_knowledge', (req, res) =>{
    let document = {"center": req.params.center, "year": parseInt(req.params.year),
                       "field-of-knowledge": req.params["field_of_knowledge"]};

    db.count(document, function (err, count) {
        if(count === 0) {
            res.sendStatus(404);
        }else{
            db.remove(document, function (err, numRemoved) {
                if(err){
                    console.error(err);
                    res.sendStatus(500);
                }else res.send(numRemoved.toString());
            });
        }
    });
})
.post('/:center/:year/:field_of_knowledge', (req, res) =>{
    res.sendStatus(405);
})
.put('/', (req, res) =>{
    res.sendStatus(405);
})
.delete("/", (req, res) => {
     db.remove({}, {multi: true}, function (err, numRemoved) {
        if(err){
            console.error(err);
            res.sendStatus(500);
            }else
                res.sendStatus(200);
            });
})
.get('/:center/:year/:field_of_knowledge', (req, res) =>{
    db.find(documentFromParams(req.params), {_id: 0}).exec(function (err, docs) {
        if(err){
            console.error(err);
            res.sendStatus(500);
        }
        else {
            if(docs.length === 0) res.sendStatus(404);
            else res.json(docs[0]);
        }
    });
})

/*
    Utils for the API
 */

function documentFromParams(params){
    let document = {};

    if("field-of-knowledge" in params) document["field-of-knowledge"] = params["field-of-knowledge"];
    if("field_of_knowledge" in params) document["field-of-knowledge"] = params["field_of_knowledge"];
    if("year" in params) document["year"] = parseInt(params["year"]);
    if("performance-percents" in params) document["performance-percents"] = params["performance-percents"];
    if("credits-passed" in params) document["credits-passed"] = parseInt(params["credits-passed"]);
    if("credits-enrolled" in params) document["credits-enrolled"] = parseInt(params["credits-enrolled"]);
    if("center" in params) document["center"] = params["center"];
    if("_id" in params) document["_id"] = params["_id"];

    return document;
}

function isValidData(d){
    if(!Array.isArray(d)) return validDataRow(d);

    for(let element in d){
        if(!validDataRow(d[element])) return false;
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
    if (!d["center"]) return false;
    return true;
}

module.exports = router;