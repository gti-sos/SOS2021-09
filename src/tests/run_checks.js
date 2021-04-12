const newman = require('newman'); // require newman in your project
const app = require('../index');

newman.run({
    collection: require('./SOS2021-09-performances-by-degrees-us.postman_collection'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('Collection run complete!');
    // Close server
    app.close();
});