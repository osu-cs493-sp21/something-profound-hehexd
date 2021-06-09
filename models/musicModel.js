const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const { GridFSBucket, ObjectId } = require("mongodb");
const fs = require("fs");

//create the schema that we will use for validating the POST request for music.
const MusicSchema = { //users will log in with their username which is unique
    name: { required: true }, //names do have to be unique
    caption: { required: false }, //caption is not required, but can be modified at any time
}
exports.MusicSchema = MusicSchema;

const fileTypes = {
    "audio/mpeg": "mp3"
};
exports.fileTypes = fileTypes;

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
        const bucket = new GridFSBucket(db, {
            bucketName: "music"
        });
        const results = await bucket
            .find({ _id: new ObjectId(id) })
            .toArray();
        const info = results[0];
        if (info){
            console.log(info._id == id, info._id, id, typeof(info._id), typeof(id));
            const path = `./data/${info.metadata.name}.${fileTypes[info.metadata.contentType]}`;
            resolve({
                pipe: bucket.openDownloadStream(info._id).pipe(fs.createWriteStream(path)),
                contentType: info.metadata.contentType,
                path: path,
            });
        }
        else{
            resolve(false);
        }
    });
}
exports.downloadMusic = downloadMusic;

async function validateSongById(id) {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: "music" });
    const results = await bucket.find({ _id: new ObjectId(id) }).count();
    if (results > 0) {
        return true;
    }
    else {
        return false;
    }
}

exports.validateSongById = validateSongById;

async function updateMusic(id, req, isAdmin){
    // note that this can only update metadata, like name and caption
    return new Promise(async (resolve, reject) => {
        const body = req.body;
        const db = getDbReference();
        const collection = db.collection("music.files");
        collection.findOne({_id: new ObjectId(id)}, async (err, result) => {
            if (err){
                console.log(err);
                reject(err);
            }
            else{
                if (isAdmin || result.metadata.username == req.username){
                    const getInfo = extractValidFields(body, MusicSchema);
                    const metadata = result.metadata;
                    metadata.name = getInfo.name;
                    metadata.caption = getInfo.caption;
                    const results = await collection.updateOne({ _id: new ObjectId(id) }, {$set: {metadata: metadata}}, { upsert: true });
                    resolve(!!results);
                }
                else{
                    resolve(false);
                }
            }
        });
    });
}
exports.updateMusic = updateMusic;

async function deleteMusic(id, req, isAdmin){
    return new Promise(async (resolve, reject) => {
        const body = req.body;
        const db = getDbReference();
        const bucket = new GridFSBucket(db, { bucketName: "music" });
        const collection = db.collection("music.files");
        collection.findOne({_id: new ObjectId(id)}, (err, result) => {
            if (err){
                console.log("YU:", err);
                reject(err);
            }
            else{
                if (isAdmin || result.metadata.username == req.username){
                    bucket.delete(new ObjectId(id), (err, done) => {
                        if (err){
                            console.log(err);
                            reject(err);
                        }
                        else{
                            resolve(true);
                        }
                    });
                }
                else{
                    resolve(false);
                }
            }
        });
    });
}
exports.deleteMusic = deleteMusic;