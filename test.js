const Flows = require('./models/flows');


(async function() { console.log(await Flows.findById(1)); })()