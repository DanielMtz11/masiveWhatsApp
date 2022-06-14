let fs = require('fs');
let path = require('path');
let Flows = require('../models/flows');

module.exports.checkFlowsFiles = async () => {
    let flows = await Flows.list('');

    for (let flow of flows) {
        let id = flow.id;
        let folderPath = path.join(__dirname, '../public/files/' + id);
        let detail = {};
        try { detail = JSON.parse(flow.detail) } catch(err) {}

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    }
}

module.exports.deleteFlowFiles = (flowID) => {
    let folderPath = path.join(__dirname, '../public/files/' + flowID);
    if (fs.existsSync(folderPath)) {
        let files = fs.readdirSync(folderPath);
        for (const file of files) {
            console.log(file + ': File Deleted Successfully.');
            fs.unlinkSync(path.join(folderPath, file));
        }
        fs.rmdirSync(folderPath);
    }
}

module.exports.getFolderPath = (flowID) => path.join(__dirname, '../public/files/' + flowID);

module.exports.verifyDuplicated = (flowID, fileName) => {
    let filePath = path.join(module.exports.getFolderPath(flowID), fileName);
    return fs.existsSync(filePath);
}

module.exports.uploadFile = (flowID, file) => {
    let filePath = path.join(module.exports.getFolderPath(flowID), file.name);
    if (module.exports.verifyDuplicated(flowID, file.name)) return;

    return file.mv(filePath);
}