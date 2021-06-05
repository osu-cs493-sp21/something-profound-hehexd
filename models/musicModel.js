const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');

//create the schema that we will use for validating the POST request for music.
const MusicSchema = { //users will log in with their username which is unique
    name: { required: true }, //names do have to be unique
    caption: { required: false }, //caption is not required, but can be modified at any time
}
exports.MusicSchema = MusicSchema;

async function uploadMusic(req){
    console.log("found:", req);
    throw "LMAO";
}
exports.uploadMusic = uploadMusic;