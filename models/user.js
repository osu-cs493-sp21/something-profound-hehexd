//This file contains the under the hood functions used in the API in users.js under the api file.

const { ObjectId } = require('mongodb');
const { extractValidFields } = require('../lib/validation'); //use extractValidFields from the validation file in lib
const { getDbReference } = require('../lib/mongo');
const bcrypt = require('bcryptjs');

//create the schema that we will use for validating the POST request to users.
const UserSchema = { //users will log in with their username which is unique
    username: { required: true },
    display_name: { required: true }, //display names do not have to be unique
    password: { required: true }, 
    admin: { required: false }, //admin should only be allowed to set to true with a valid JWT
    bio: { required: false }, //bio is not required, but can be modified at any time
}
exports.UserSchema = UserSchema;

//REQUIRES TESTING
async function insertNewUser(user) {
    const db = getDbReference();
    const collection = db.collection('users'); //use the enlightenment
    //validate that a user with this username or email address does not already exist in the database.
    const count = await collection.find({username: user.username }).count();
    console.log("Count value: ", count);
    if (count > 0) {
        console.log("Account already exists");
        return false;
    }
    else {
        const userToInsert = extractValidFields(user, UserSchema);
        console.log("Password before hashing: ", user.password);
        userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
        console.log(" -- Password after hashing: ", userToInsert);
        const result = await collection.insertOne(userToInsert); //insert the passed user into the database
        console.log(" -- Results: ", result); //console.log the results. Debugging tool. comment out in production.
        return result.insertedId; //return the id of the user inserted into the database.
        //console.log("NUmber of users that have this email: ", emails); //get count from mongodb against email
        //validate that no other users have this email. If they do have it then return 0.
    }
}
exports.insertNewUser = insertNewUser;

//Fetch a user from the users collection based on their username.
async function getUserByUsername(user) {
    const db = getDbReference();
    const collection = db.collection('users'); //search the mongo users collection for the user.
    const results = await collection.find({ username: user }).toArray();
    console.log("Get user by username found: ", results);
    if (results) {
        return results[0];
    }
    else {
        return false;
    }
}

exports.getUserByUsername = getUserByUsername;

async function validateUser(username, password) {
    console.log("Entering get user by username");
    const user = await getUserByUsername(username);
    console.log("User information: ", user);
    return user && await bcrypt.compare(password, user.password);
}
exports.validateUser = validateUser;

async function getAdminStatus(username) {
    const db = getDbReference();
    const collection = db.collection('users');
    //just use count to find where the
    const count = await collection.find({ username: username, admin: true }).count();
    if (count > 0) {
        console.log("User is an admin. Count found: ", count);
        return true;
    }
    else {
        console.log("User is not an administrator.");
        return false;
    }
}

exports.getAdminStatus = getAdminStatus;

async function getProfileByUsername(username) {
    const db = getDbReference();
    const collection = db.collection('users');
    const count = await collection.find({ username: username }).count();
    if (count > 0) {
        const projection = { _id: 0, username: 0, password: 0, admin: 0 }
        const results = await collection.find({ username: username })
            .project(projection)
            .toArray();
        return results[0];
    }
    else {
        return false;
    }
}

exports.getProfileByUsername = getProfileByUsername;