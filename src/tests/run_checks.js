const newman = require('newman'); // require newman in your project
const app = require('../index');
const fs = require('fs');

fs.stat('dansesben.db', function(err, stat) {
    if(err == null) {
        fs.copyFileSync("dansesben.db", "dansesben.db.bak");
    }
});

newman.run({
    collection: require('./SOS2021-09-performances-by-degrees-us.postman_collection'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('Collection run complete!');
    // Close server
    app.close();
    // Restore db
    fs.stat('dansesben.db.bak', function(err, stat) {
        if(err == null) {
            fs.copyFileSync("dansesben.db.bak", "dansesben.db");
            fs.rmSync("dansesben.db.bak");
        }
    });
});

//SOS2021-09-budgets-by-centers-us.postman_collection.json
fs.stat('budgetsbycentersus.db', function(err, stat) {
    if(err == null) {
        fs.copyFileSync("budgetsbycentersus.db", "budgetsbycentersus.db.bak");
    }
});

newman.run({
    collection: require('./SOS2021-09-budgets-by-centers-us.postman_collection'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('Collection run complete!');
    // Close server
    app.close();
    // Restore db
    fs.stat('budgetsbycentersus.db', function(err, stat) {
        if(err == null) {
            fs.copyFileSync("budgetsbycentersus.db", "budgetsbycentersus.db");
            fs.rmSync("budgetsbycentersus.db");
        }
    });
});

fs.stat('cargonare1.db', function(err, stat) {
    if(err == null) {
        fs.copyFileSync("cargonare1.db", "cargonare1.db.bak");
    }
});

newman.run({
    collection: require('./SOS2021-09-surrenders-by-degrees-us.postman_collection'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('Collection run complete!');
    // Close server
    app.close();
    // Restore db
    fs.stat('cargonare1.db.bak', function(err, stat) {
        if(err == null) {
            fs.copyFileSync("cargonare1.db.bak", "cargonare1.db");
            fs.rmSync("cargonare1.db.bak");
        }
    });
});

fs.stat('cuts.db', function(err, stat) {
    if(err == null) {
        fs.copyFileSync("cuts.db", "cuts.db.bak");
    }
});

newman.run({
    collection: require('./SOS2021-09-surrenders-by-degrees-us.postman_collection'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('Collection run complete!');
    // Close server
    app.close();
    // Restore db
    fs.stat('cuts.db.bak', function(err, stat) {
        if(err == null) {
            fs.copyFileSync("cuts.db.bak", "cuts.db");
            fs.rmSync("cuts.db.bak");
        } 
    });
});