const router = require('express').Router();
module.exports = router;

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');

const { quotesSchema, insertQuote } = require('../models/quote');

const {
    getUserByUsername,
} = require('../models/user');

router.post('/', requireAuthentication, async (req, res, next) => {
	console.log("Got into Post for quotes endpoint");
	try{
		//const getUser = await getUserByUsername(req.username); //for making sure 
		if(req.body.username && req.body.author && req.body.quote){
			const id = await insertQuote(req.body);
			console.log("ID: ", id);
			if(id){ //make sure the new id exists
				console.log("Quote Created with ID: ", id);
				res.status(201).send({
					_id: id
				});
			}else{
				res.status(400).send({
					error: "failed to insert and create the quote"
				});
			}
		}else{
			res.status(400).send({
					error: "Please provide username, author, and the quote."
			});
		}
	} catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Invalid Authentication"});
	}
})

/*
router.get('/', async (req, res, next) => {
	try{
		
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not access Quotes."});
	}
})

router.get('/:quoteid', async (req, res, next) => {
	try{
		
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not access the desired quote."});
	}
})

router.put('/', requireAuthentication, async (req, res, next) => {
	try{
		
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not successfully modify the quote."});
	}
})

router.delete('/', requireAuthentication, async (req, res, next) => {
	try{
		
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not successfully delete the quote."});
	}
})
*/