const router = require('express').Router();
const fs = require('fs');

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');
const { rateLimit } = require('../lib/redis');

module.exports = router;

const {
    getUserByUsername,
} = require('../models/user');

const {
    MusicSchema,
    uploadMusic,
    downloadMusic,
    fileTypes
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
            await downloadMusic(req.params.id);
            res.status(200).send();
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