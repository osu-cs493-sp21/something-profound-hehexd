
const { ObjectId } = require('mongodb');
const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');



const PoemSchema = {

    author: { required : true},
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

async function getPoemCount(){

    const db = getDbReference();

    const collection = db.collection('poems');

    var count = collection.countDocuments();

    return count;

}

async function getPoemPage(page){

    const db = getDbReference();

    const collection = db.collection('poems');

    const count = await getPoemCount();
    
    //Figure out how many poems we need to get

    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    //Get all the poems and limit them by the pagination math
    results = await collection.find({}).skip(offset).limit(pageSize).toArray()

    //console.log(results)

    return results

}

exports.getPoemPage = getPoemPage;

async function getPoemById(id){

    const db = getDbReference();

    const collection = db.collection('poems');

    results = await collection.find({_id: new ObjectId(id)}).toArray();

    //console.log(results[0])

    return results[0]

}

exports.getPoemById = getPoemById;

async function getPoemByCategory(category){

    const db = getDbReference();

    const collection = db.collection('poems');

    results = await collection.find({category: category}).toArray()

    //console.log(results[0])
    
    return results
}

exports.getPoemByCategory = getPoemByCategory;

async function updatePoemById(id, poem){

    const db = getDbReference();

    const collection = db.collection('poems');

    updatedPoem = {$set: extractValidFields(poem , PoemSchema)}

    //Check if the passed poem and the new poem have the same _id, if not then don't allow it to go through

    var query = {_id: new ObjectId(id)}

    //Get the current database
    poemInDatabase = getPoemById(id);

    //Check to make sure the id's match, don't allow otherwise
    if(updatedPoem._id === poemInDatabase._id){

        results = await collection.updateOne(query, updatedPoem, {upsert: true})

        return results[0]
    } else {


        return False
    }

}

exports.updatePoemById = updatePoemById;

async function deletePoemById(id){

    const db = getDbReference();

    const collection = db.collection('poems');

    var query = {_id: new ObjectId(id)}

    results = await collection.remove(query)

    return results[0]

}

exports.deletePoemById = deletePoemById;

