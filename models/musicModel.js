const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const { GridFSBucket } = require("mongodb");
const fs = require("fs");

//create the schema that we will use for validating the POST request for music.
const MusicSchema = { //users will log in with their username which is unique
    name: { required: true }, //names do have to be unique
    caption: { required: false }, //caption is not required, but can be modified at any time
}
exports.MusicSchema = MusicSchema;

async function uploadMusic(req, username){
    //by this point the user has been validated already
    return new Promise((resolve, reject) => {
        const db = getDbReference();
        const bucket = new GridFSBucket(db, {
            bucketName: "music"
        });
        const infoToSave = extractValidFields(req.body, MusicSchema);
        infoToSave.filename = req.file.filename;
        infoToSave.contentType = req.file.mimetype;
        infoToSave.username = username;
        infoToSave.path = req.file.path;
        console.log("Saving MP3:", infoToSave);

        const uploadStream = bucket.openUploadStream(infoToSave.filename, {
            metadata: infoToSave
        });
        fs.createReadStream(infoToSave.path).pipe(uploadStream)
        .on("error", (err) => {
            reject(err);
        })
        .on("finish", (result) => {
            resolve(result._id);
        });
    });
}
exports.uploadMusic = uploadMusic;