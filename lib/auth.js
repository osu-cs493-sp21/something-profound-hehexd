const jwt = require('jsonwebtoken'); //using jwt to authenticate users. Authentication token evaluates against their username in the database

const secretKey = "YouWereMyBrotherBananakin";


//Simple function to generate an authentication token using json web tokens.
function generateAuthToken(username) {
    const payload = { sub: username };
    //Force the user to log in every 24 hours. Not too inconveniencing
    //Further implementation ideas would be to:
        //invalidate the token if the user logs out or if they change their password
        //Maybe extend the token validation by 4 hours for every time they return to the website and use the token, instead expiring in 6 hours
    return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}

exports.generateAuthToken = generateAuthToken;

/*
requireAuthentication is a simple and standard *authenticatiion function called by much of the API *used in this program. 
It will check the *authentication header and use the payload from the *javascript web token to verify against the *username entered from the req.body
via the HTTP *request. If it cannot match the payload to the *username after using the JWT verify() method, then *it will send back a 401 status to the user
*/
function requireAuthentication(req, res, next) {
    console.log(" -- Verifying authentication"); //debug line, comment out
    const authHeader = req.get('Authorization') || ''; //get the authorization if possible
    const authHeaderParts = authHeader.split(' '); //split token into signature, head and body
    console.log(" -- Authentication Header Parts: ", authHeaderParts); //debug line
    //conditional operation. In this case, if authHeaderParts[0] == bearer, then set authHeaderPats[1]. Else null.
    //condition ? value if true : value if false
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey);
        req.username = payload.sub;
        next();
    }
    catch (err) {
        res.status(401).send({
            error: "Invalid authentication token"
        });
    }
}
exports.requireAuthentication = requireAuthentication;

/*
Exact same as the requireAuthentication method *(see above),
the only difference is that if the *verify() method provided by JWT does not evaluate *to true then instead of
catching and returning 401 *to the user, the program will allow the user to *continue. This is specifically applied to the POST *to users endpoint,
where only administrators are *allowed to create an administrator. Otherwise, the *program should let guests continue to create new *users as expected.
*/
function optionalAuthentication(req, res, next) {
    console.log(" -- verifying authentication");
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    console.log(" -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey);
        req.username = payload.sub;
        next();
    }
    catch (err) {
        console.log("User is not logged in. Cannot create an admin for sure");
        next();
    }
}

exports.optionalAuthentication = optionalAuthentication;