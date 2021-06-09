const router = require('express').Router();
const fs = require('fs');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
const { rateLimit } = require('../lib/redis');

var m_PoemSchema = new mongoose.Schema({
    
    author: {type: String, es_indexed: true },
    uploader: {type: String, es_indexed: true},
    text: {type: String, es_indexed: true},
    category: {type: String, es_indexed: true},
    date: {type: String, es_indexed: true }
});


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
const { getAdminStatus, getUserByUsername } = require('../models/user');
const { getDbReference } = require('../lib/mongo');

router.use(rateLimit);

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
    
    
                //console.error(" -- Error", err);
    
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

    }
    catch (error) {

        res.status(500).send({

            error: "Error fetching poems, try again later."

        });
        console.log(error);

    }

});

//Get poem by id
router.get('/:id', async(req, res, next) => {

    try{

        var results =  await getPoemById(req.params.id);
        if (results) {
            //console.log(results)

            res.status(200).send(results);
        }
        else {
            res.status(404).send({
                error: "Could not find poem in the database."
            });
        }
    }
    catch (err) {

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
        if (results) {
            res.status(200).send(results);
        }
        else {
            res.status(404).send({
                error: "Nothing in this category"
            });
        }
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

            if(results){

                res.status(200).send(results);
            }

            
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
        const getUser = await getUserByUsername(req.username);
        //console.log("User is: ", getUser);
        if (req.user === getUser || getAdminStatus(req.user)) {
            const result = deletePoemById(req.params.id);
            if (result) {
                res.status(204).send();
            }
            else {
                next();
            }
        }
        else {
            res.status(404).send({
                error: "Cannot delete another user's peoms"
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error: "Error deleting poem, try again"
        });
    }

});


//Get Via Elastic Search(idk how to do this)
router.get('/search/:searchString', async(req, res, next) => {

    m_PoemSchema.plugin(mongoosastic)

    var Poem = mongoose.model('Poem', m_PoemSchema, 'poems')

    var stream = Poem.synchronize();
    
    stream.on('error', function(err){

        console.log("Error while syncing" + err)

    });


    const db = getDbReference();

    const collection = db.collection('poems');

    var types = ['poems']

    var fields = ['text', 'author', 'category']

    var filter = {}
    var sort = "_id";

    Poem.search({
        bool: {
            must: [{
              multi_match: {
                query: req.params.searchString,
                type: "phrase",
                fields: fields,
              },
            }],
            should: [{
              multi_match: {
                query: req.params.searchString,
                fields: fields,
                operator: "and",
                boost: 10,
                minimum_should_match: "100%"
              },
            }],
            filter: [{
              term: filter
            }]
           }
         }, {
           index: collection,
           type: types,
           from: null,
           size: 10,
           track_scores: false,
           sort: sort
          },
          function (err, results) {
            if (err) {
               console.log("Error in searchController: ", err);
             } else {
               res.json({result: results.hits.hits})
             }
    });
});
