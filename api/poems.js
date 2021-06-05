const router = require('express').Router();
const fs = require('fs');

const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');


module.exports = router;


const {

    PoemSchema,
    insertNewPoem,

} =  require('../models/poem');

router.post('/', requireAuthentication, async(req, res, next) => {

    console.log("TROLLED")

    if(validateAgainstSchema(req.body, PoemSchema)){

        console.log("hehe yup")
        try{

            const id = await insertNewPoem(req.body);
            res.status(201).send({

                _id: id
            });

        }catch(error){


            console.error(" -- Error", err);

            res.status(500).send({

                error: "Error inserting new Poem. TRY AGAIN  LATER."

            });

        }

    } else {

        res.status(401).send({

            error: "Body is invalid"
        });
    }

});

