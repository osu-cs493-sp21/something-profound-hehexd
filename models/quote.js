const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
//const { GridFSBucket } = require("mongodb");
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
	console.log("STuff: ", quoteInfo);
	quoteInfo = extractValidFields(quoteInfo, quotesSchema);
	console.log("STuff: ", quoteInfo);
	const db = getDbReference();
	const collection = db.collection('quotes');
	const result = await collection.insertOne(quoteInfo);
	//console.log("Added Quote: ", result);
	return result.insertedId
}
exports.insertQuote = insertQuote;