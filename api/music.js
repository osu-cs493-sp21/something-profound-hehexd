const router = require('express').Router();

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { optionalAuthentication } = require('../lib/auth');

module.exports = router;

const {
    getUserByUsername,
} = require('../models/user');

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

router.post("/", optionalAuthentication, upload.single("music"), async (req, res, next) => {
    try {
        const getInfo = await getUserByUsername(req.username);
        if (req.username && getInfo){
            res.status(200).send();
        }
        else{
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