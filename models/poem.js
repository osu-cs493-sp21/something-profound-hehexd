
const { ObjectId } = require('mongodb');
const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');

const PoemSchema = {

    author: { require : true },
    uploader: {required : true},
    text: {required : true},
    category: {required : true},
    date: {required: false},

}

exports.PoemSchema = PoemSchema

async function insertNewPoem(poem) {
    const db = getDbReference();
    const collection = db.collection('poems'); //use the enlightenment

    //We don't need to care about duplicate poems
    //So we don't get a count here

    poemToInsert = extractValidFields(poem , PoemSchema);
    const result = await collection.insertOne(poemToInsert); //Insert passed poem to DB

    console.log(" -- Results: ", result); //console.log the results. Debugging tool. comment out in production.
    return result.insertedId; //return the id of the user inserted into the database.
}


exports.insertNewPoem = insertNewPoem;