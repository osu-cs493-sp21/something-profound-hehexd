const jwt = require('jsonwebtoken');

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
        req.username = payload.suib;
        next();
    }
    catch (err) {
        res.status(401).send({
            error: "Invalid authentication token"
        });
    }
}
exports.requireAuthentication = requireAuthentication;

