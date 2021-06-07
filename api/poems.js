const router = require('express').Router();
const fs = require('fs');

const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');


module.exports = router;


const {

    PoemSchema,
    insertNewPoem,
    getPoemPage,
    getPoemById,
    getPoemByCategory,
    updatePoemById,
    deletePoemById,

} =  require('../models/poem');

//Post a new poem
router.post('/', requireAuthentication, async(req, res, next) => {

    if(req.username == req.body.uploader){

        if(validateAgainstSchema(req.body, PoemSchema)){

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
    } else {

        res.status(404).send({error : "Invalid Authentication"})
    }

});


//Get all poems
router.get('/', async(req, res, next) => {

    try{

        var results = await getPoemPage(parseInt(req.query.page) || 1);

        res.status(200).send(results)

    }catch(error){

        res.status(500).json({

            error: "Error fetching poems, try again later."

        });

        console.log(error);

    }

});

//Get poem by id
router.get('/:id', async(req, res, next) => {

    try{

        var results =  await getPoemById(req.params.id);

        //console.log(results)

        res.status(200).send(results);

    }catch(error){

        console.error("ERROR: ", err);

        res.status(500).send({

            error: "Error fetching user, try again later"
            
        });

    }

});

//Get poem by category
router.get('/category/:category', async(req, res, next) => {

    try{

        var results =  await getPoemByCategory(req.params.category);

        res.status(200).send(results);

    }catch(error){

        console.error("ERROR: ", error);

        res.status(500).send({

            error: "Error fetching poem with given category, try again later"
            
        });
  
}

});


//Modify poem by id
router.put('/:id', requireAuthentication, async(req, res, next) => {

    if(req.username === req.body.uploader){

        try{

            var results = await updatePoemById(req.params.id, req.body)
    
            console.log(results)
            
            res.status(200).send(results);
    
    
        }catch(error){
    
            console.log(error)
    
            res.status(500).send({
    
                error: "Error updating user, try again later"
                
            });
    
        }

    } else {

        res.status(400).send({

            error: "You are not allowed to do that."

        });

    }

});

//Delete  poem by id
//Checks for admin or authentication
router.delete('/:id', requireAuthentication, async(req, res, next) => {

    try{

        var results = await deletePoemById(req.params.id)

        if(req.username === results.uploader){

            
        res.status(200).send(results);

        } else {


            res.status(404).send({

                error: "Attempting to access unauthorized resource"

            });
        }

    }catch(error){

        res.status(500).send({

            error: "Error deleting user, try again later"
            
        });

    }

});


//Get Via Elastic Search(idk how to do this)
router.get('/search/:searchToken', requireAuthentication, async(req, res, next) => {





});
