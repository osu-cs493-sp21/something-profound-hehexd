const router = require('express').Router();
const fs = require('fs');

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');

module.exports = router;

const {
    getUserByUsername,
} = require('../models/user');

const {
    MusicSchema,
    uploadMusic,
} = require("../models/musicModel");

const fileTypes = {
    "audio/mpeg": "mp3"
};

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
})