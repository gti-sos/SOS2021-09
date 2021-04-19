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