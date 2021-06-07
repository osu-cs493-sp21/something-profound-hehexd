const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const { ObjectId } = require("mongodb");
//const fs = require("fs");

//for the schema that the quotes follow
const quotesSchema = {
	author: {required: true},
	username: {required: true},
	quote: {required: true},
	date: {required: false}, 
	category: {required: false}
}
exports.quotesSchema = quotesSchema;

async function insertQuote(quoteInfo){
	//quoteInfo is a collection of the req.body object from the POST/quotes
	//console.log("STuff: ", quoteInfo);

	quoteInfo = extractValidFields(quoteInfo, quotesSchema); //gets the necessary fields that match in the schema

	//console.log("STuff: ", quoteInfo);
	const db = getDbReference();
	const collection = db.collection('quotes'); //using the quotes collection in mongodb

	const result = await collection.insertOne(quoteInfo); //insertOne for adding a single item
	//console.log("Added Quote: ", result);
	return result.insertedId
}
exports.insertQuote = insertQuote;

async function getQuoteById(id){
	const db = getDbReference();
	const collection = db.collection('quotes'); //get into our quotes collection
	const results = await collection.find({_id: new ObjectId(id)}).toArray(); //find all with the provided attribute
	//console.log("results: ", results);
	//console.log("col: ", collection);
	if(results){ //if we found the necessary quote
		return results[0];
	}
}
exports.getQuoteById = getQuoteById;

async function updateQuoteById(id, user, content){ //updates a quote with the provided id that was created by user
	const db = getDbReference();
	const collection = db.collection('quotes');
	const results = await collection.find({ _id: new ObjectId(id) }).toArray(); //make sure its finding on the new ObjectId, or else its looking for a string and not an object

	if(results){
		await collection.updateOne( //update only the quote specified
			{ "_id": new ObjectId(id) }, //looks for the quote with valid id
			{ 
				$set: { //sets its new values
					"author": content.author,
					"username": user, //user is preserved
					"quote": content.quote,
					"date": content.date,
					"category": content.category
				}
			});
		//console.log("CONTENT: ", content.author);
		//const stuff = await collection.find({ _id: new ObjectId(id) }).toArray();
		//console.log("   -: ", stuff);
		//console.log("   -: ", results);
		return results[0];
	} else{
		return null;
	}
}
exports.updateQuoteById = updateQuoteById;

async function deleteQuoteById(id){
	const db = getDbReference();
	const collection = db.collection('quotes');
	const result = await collection.deleteOne({ _id: new ObjectId(id) }); //deletes one quote with the provided id
	console.log("Deleted the quote.", result.deletedCount);
	return result.deletedCount;
}
exports.deleteQuoteById = deleteQuoteById;

async function getQuotesPage(page) { //adapted from the asignment 4 repo
	//console.log("page");
  const db = getDbReference();
  const collection = db.collection('quotes');
  const count = await collection.countDocuments(); //number on the page

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  //adapted from the previous assignments with pagination
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    quotes: results, //puts number of quotes upto pageSize on the page
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  };
}
exports.getQuotesPage = getQuotesPage;