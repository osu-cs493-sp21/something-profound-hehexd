const router = require('express').Router();
const fs = require('fs');

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');
const { rateLimit } = require('../lib/redis');
const { getDbReference } = require('../lib/mongo');
const { GridFSBucket, ObjectId } = require("mongodb");

module.exports = router;

const {
    getUserByUsername,
    getAdminStatus
} = require('../models/user');

const {
    MusicSchema,
    uploadMusic,
    downloadMusic,
    fileTypes,
    validateSongById,
    updateMusic,
    deleteMusic
} = require("../models/musicModel");
router.use(rateLimit);

const crypto = require('crypto');
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      console.log("MIMETYPE", file.mimetype);
      const extension = fileTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!fileTypes[file.mimetype]);
  }
});

//Allows the user to upload their music, requires a .mp3 file, song author, caption optional.
router.post("/", requireAuthentication, upload.single("music"), async (req, res, next) => {
    try {
        const getInfo = await getUserByUsername(req.username);
        if (req.username && getInfo && validateAgainstSchema(req.body, MusicSchema)) {
            const id = await uploadMusic(req, req.username);
            await fs.unlink(req.file.path, (err) => {
                if (err) {
                    throw err;
                }
            });
            res.status(200).send({
                id: id,
            });
        }
        else {
            res.status(404).send({
                error: "User not found"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(404).send({
            error: "Invalid authorization"
        });
    }
});

router.get("/download/:id", async (req, res, next) => {
    if (req.params.id){
        try {
            const found = await downloadMusic(req.params.id);
            if (found){
                res.status(200).send(found);
            }
            else{
                res.status(404).send({
                    error: "Song not found"
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).send({
                error: "Server error"
            });
        }
    }
    else{
        res.status(404).send({
            error: "Song not found"
        });
    }
});


//method to stream music directly from the db using nodejs streams
router.get("/stream/:id", async (req, res, next) => {
    if (req.params.id) {
        try {
            const id = await validateSongById(req.params.id);
            if (id) {
                res.set('content-type', 'audio/mp3'); //conte type
                res.set('accept-ranges', 'bytes'); //accept ranges lets the server support partial requests. This will allow the browser to try to resume an interrupt on the download stream rather than start it over
                const db = getDbReference();
                //the data event is built in, and is emitted whenever the stream is giving ownership of a chunk of data to the consumer.
                //essentially reading chunks of data from our gridfs db to postman which is calling the api endpoint
                const bucket = new GridFSBucket(db, { bucketName: "music" }); //open the GridFS music bucket
                //to allow for streaming, we will use NodeJS read streams (an abstraction from a source, in this case, the GridFS bucket, from which data is consumed)
                var song = new ObjectId(req.params.id); //we verified the song id exists, convert the req.params.id to a valid mongo object id
                const downloadStream = bucket.openDownloadStream(song); //use the openDownloadStream() function with gridfs to download the song.
                downloadStream.on('data', (chunk) => { //the download stream releases data by the chunks from the music bucket.
                    res.write(chunk);
                });
                downloadStream.on('error', () => { //if there was an error in the download stream
                    res.status(404).send({
                        error: "Could not stream song"
                    });
                });
                downloadStream.on('end', () => { //when the entire body has been received, call res.end(). Data must be completely consumed before the end event can trigger.
                    res.end();
                });
            }
            else {
                res.status(404).send({
                    error: "Song does not exist in database"
                });
            }

        }
        catch (err) {
            res.status(500).send({
                error: "Error retrieving song from the database"
            });
        }
    }
    else {
        res.status(400).send({
            error: "Invalid song ID"
        });
    }
});

router.put("/update/:id", requireAuthentication, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (id){
            console.log('sending:', req.body);
            const isAdmin = getAdminStatus(req.username);
            const done = await updateMusic(id, req, isAdmin);
            if (done){
                res.status(200).send({
                    id: id
                });
            }
            else{
                res.status(404).send({
                    error: "Song ID not found"
                });
            }
        }
        else{
            res.status(400).send({
                error: "Invalid song ID"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: "Error updating song"
        });
    }
});

router.delete("/delete/:id", requireAuthentication, async (req, res) => {
    try {
        const id = req.params.id;
        if (id){
            const isAdmin = getAdminStatus(req.username);
            const done = await deleteMusic(id, req, isAdmin);
            if (done){
                res.status(200).send();
            }
            else{
                res.status(404).send({
                    error: "Song ID not found"
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(404).send({
            error: "Song ID not found"
        });
    }
});