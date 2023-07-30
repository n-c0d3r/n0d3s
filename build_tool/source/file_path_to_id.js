
const path = require("path");



function file_path_to_id(file_path){

    return path.normalize(file_path).replaceAll(':', '_').replaceAll('/', '_').replaceAll('\\', '_');
}



module.exports = file_path_to_id;