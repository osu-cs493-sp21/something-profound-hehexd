const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const { GridFSBucket, ObjectId } = require("mongodb");
const fs = require("fs");
const GridFSStream = require("gridfs-stream");

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

async function downloadMusic(id){
    return new Promise(async (resolve, reject) => {
        const db = getDbReference();
        const gfs = GridFSStream(db, require("mongodb"));
        const bucket = new GridFSBucket(db, {
            bucketName: "music"
        });
        const results = await bucket
            .find({ _id: new ObjectId(id) })
            .toArray();
        const info = results[0];

        const readstream = gfs.createReadStream({
            //filename: info.metadata.filename,
            _id: new ObjectId(id)
        });
        readstream.on('error', function (err) {
            console.log('An error occurred!', err);
            reject(err);
        });

        readstream.pipe(readstream);
        resolve({
            name: info.metadata.name,
            caption: info.metadata.caption,
            username: info.metadata.username,
            contentType: info.metadata.contentType
        });
    });
}
exports.downloadMusic = downloadMusic;