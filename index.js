const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public')); // Exposes the folder public in the webapp

app.get('/cool', (req, res) => {
    res.send(cool());
});


app.listen(port, () =>{
    console.log(`Listening at http://127.0.0.1:${port}`);
});

