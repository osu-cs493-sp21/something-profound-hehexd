const router = require('express').Router();
module.exports = router;

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');
const { rateLimit } = require('../lib/redis');
const { quotesSchema, insertQuote, getQuoteById, updateQuoteById, deleteQuoteById, getQuotesPage } = require('../models/quote');

const {
    getUserByUsername,
} = require('../models/user');

router.use(rateLimit);

router.post('/', requireAuthentication, async (req, res, next) => {
	console.log("Got into Post for quotes endpoint");
	try{
		//const getUser = await getUserByUsername(req.username); 
		if (req.username == req.body.username) {
			if (req.body.username && req.body.author && req.body.quote) { //make sure all necessary elements of a quote are there
				const id = await insertQuote(req.body); //gets the insertedId of the quote
				console.log("ID: ", id);
				if (id) { //make sure the new id exists
					console.log("Quote Created with ID: ", id);
					res.status(201).send({ //success, so send the id of the quote
						_id: id
					});
				} else { //else is a failure to insert
					res.status(400).send({
						error: "failed to insert and create the quote"
					});
				}
			} else { //must provide at least the 3 necessary attributes
				res.status(400).send({
					error: "Please provide username, author, and the quote."
				});
			}
		}
		else {
			res.status(400).send({
				error: "You cannot post under another name"
			});
        }
	} catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Invalid Authentication"});
	}
})


router.get('/', async (req, res, next) => { //get list of all quotes
	try{
		const quotesPage = await getQuotesPage(parseInt(req.query.page) || 1);  //either query on the desired page or page 1 if not provided
		quotesPage.links = {}; //creates a links field
		console.log("quotes page: ", quotesPage);
		if(quotesPage.page < quotesPage.totalPages){ //as long as there are more available pages, provide links for them
			 quotesPage.links.nextPage = `/quotes?page=${quotesPage.page + 1}`;
			 quotesPage.links.lastPage = `/quotes?page=${quotesPage.totalPages}`;
		}
		if (quotesPage.page > 1) { //if we are not on the first page, provide links for the previous and page 1
			quotesPage.links.prevPage = `/quotes?page=${quotesPage.page - 1}`;
			quotesPage.links.firstPage = '/quotes?page=1';
		}
		res.status(200).send(quotesPage);
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not access Quotes List."});
	}
})


router.get('/:quoteid', async (req, res, next) => {
	//what is the condition of the get? are we getting all quotes of a single person or just one quote
	try{
		const found_quote = await getQuoteById(req.params.quoteid); //find the quote with provided quoteid
		if(found_quote){ //if the quote exists, then it was found
			console.log("Quote Found: ", found_quote);
			res.status(200).send({ found_quote }); //send the found quote 
		} else{ //otherwise the username has not posted any quotes
			console.log("No quote found with id provided.");
			res.status(404).send({ 
				error: "A quote was not found."
			});
		}
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not access the desired quote."});
	}
})



router.put('/:quoteid', requireAuthentication, async (req, res, next) => {
	//updateQuoteById says it changes the quote object, but then it does not actually update for when i do a get on the updated quote
	try{
		if(validateAgainstSchema(req.body, quotesSchema)){ //make sure the user provides the necessary elements of a quote
			if(req.body.username === req.username && req.body.author && req.body.quote){ //cannot change the username in this endpoint
				console.log("user: ", req.username);
				const updated_quote = await updateQuoteById(req.params.quoteid, req.username, req.body); //updates the quote, but not the username field
				if(updated_quote){ //if the quote has been successfully updated
					res.status(200).send({
						message: "Successfully updated the Quote Post."
					});
				}
			} else{
				res.status(400).send({
					error: "Cannot update your username within this endpoint, but you can update the post"
				});
			}
		} else{
			res.status(400).send({
				error: "Please provide at least these fields: author, username, and quote."
			});
		}
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not successfully modify the quote."});
	}
})


router.delete('/:username/:quoteid', requireAuthentication, async (req, res, next) => {
	
	try{
		if(req.username === req.params.username){ //if the username matches the JWT, then we can delete
			const result = await deleteQuoteById(req.params.quoteid); //deletes the quote with _id = quoteid
			if(result > 0){
				res.status(204).send();
			} else{
				next();
			}
		}
	}catch(err){
		console.log("Error: ", err);
		res.status(404).send({error: "Could not successfully delete the quote."});
	}
})


router.use('*', (err, req, res, next) => {
    console.error(err);
    res.status(500).send({
        error: "An error occurred. Try again later."
    });
})
