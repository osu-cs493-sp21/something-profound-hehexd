const router = require('express').Router();

//const user = require('../models/user');
const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');
const { rateLimit } = require('../lib/redis');

const {
    UserSchema,
    insertNewUser,
    validateUser,
    getAdminStatus,
    getProfileByUsername,
    updateUserInformation,
    deleteUserByUsername,
    getPoemsByUsername,
    getMusicByUsername,
    getQuotesByUsername
} = require('../models/user');

module.exports = router;

router.use(rateLimit);

//CREATE A USER
router.post('/', optionalAuthentication, async (req, res, next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        try {
            if (req.body && req.body.admin == true) { //if the user has admin set to true, validate their admin status
                const isAdmin = await getAdminStatus(req.username);
                console.log("Got admin status: ", isAdmin);
                if (isAdmin) {
                    const id = await insertNewUser(req.body); //NEED TO TEST THIS FUNCT
                    console.log("Admin user created");
                    res.status(201).send({
                        _id: id
                    });
                }
                else {
                    res.status(401).send({
                        error: "Failed to create the user."
                    }); //let the user know that they failed to create a user. However, we know that it was because they were not an admin
                }
            }
            else { //user is not an admin, proceed with normal creation
                const id = await insertNewUser(req.body);
                console.log("Regular user ID: ", id);
                if (id) {
                    console.log("Regular user created.");
                    res.status(201).send({
                        _id: id
                    });
                }
                else {
                    //there's no real way to tell the user that the username was taken in a more cryptic way
                    //However, to ward off malicious guests that try to mine usernames this way, we can implement harder rate limiting on this request
                    res.status(401).send({
                        error: "Username taken!"
                    });
                }
            }
        }
        catch (err) {
            console.error(" -- Error: ", err);
            res.status(500).send({
                error: "Error inserting new user. Try again later"
            });
        }
    }
    else {
        res.status(400).send({
            error: "Requested body does not contain the valid fields required for a user. 'username' 'display_name' 'password' 'bio' (optional)"
            //hide from general users that they can create admin users. But admins should know that they can create admin users within the context of our
            //problem
        })
    }
});


//login, lets the user log in with their credentials and returns a JWT
router.post('/login', async (req, res, next) => {
    //console.log("Login endpoint called");
    //users will log in with their user name. May or may not be different from their display name. Usernames are unique but display names are not.
    if (req.body && req.body.username && req.body.password) {
        try {
            const authenticated = await validateUser(req.body.username, req.body.password);
            if (authenticated) {
                console.log("Authenticated, logging the user in");
                res.status(200).send({
                    token: generateAuthToken(req.body.username) //generate a tokenw ith the username as the payload, send to the user.
                });
            }
            else {
                // I feel that this error message is ambiguous enough that malicious users will not be able to determine whether or not credentials are good or not.
                // Display names are not unique so it would be difficult for users to tell whether they are brute forcing the username and password for an existing user or not.
                // Example: My display name could be generalkenobi and my username could be highground12
                res.status(401).send({
                    error: "Please enter valid credentials to log in."
                })
            }
        }
        catch (err) {
            console.error(" -- error: ", err);
            res.status(500).send({
                error: "Error logging in. Try again later"
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body missing fields. Requires 'username' and 'password'"
        });
    }
});

//In a front end implementation, I would hook this API endpoint up to return information on the user's profile page probably.
//This information is publicly available to all.
router.get('/:username', async (req, res, next) => {
    console.log("req params username: ", req.params.username);
    try {
        const user = await getProfileByUsername(req.params.username); //Should only return the display_name and the bio.
        if (user) {
            res.status(200).send(user); //send the bio and the display name to the user.
        }
        else {
            res.status(404).send({
                error: "This profile is not available."
            });
        }
    }
    catch (err) {
        console.error(" -- Error:", err);
        next();
    }
});

//endpoint that would be hooked to a user's settings that allows them to update all information except for their username.
//If we wanted to make it so that users could change their username, we could also do so but require that the username field in
//all other collections be updated.
router.put('/:username/settings', requireAuthentication, async (req, res, next) => {
    console.log("Request body: ", req.body);
    if (validateAgainstSchema(req.body, UserSchema)) {
        //the or statement implies that we cannot change the admin status of a user through a PUT request. Security risk.
        if (req.body.username === req.username && !req.body.admin) {
            try {
                const success = updateUserInformation(req.params.username, req.body);
                if (success) {
                    res.status(200).send({
                        message: "Updated information successfully"
                    });
                }
                else {
                    res.status(404).send({
                        error: "User does not exist"
                    });
                }
            }
            catch (err) {
                res.status(500).send({
                    error: "Server encountered an error"
                });
            }
        }
        else {
            console.log("Admins cannot change their admin status");
            res.status(400).send({ //in reality this case will 
                error: "You cannot change your registered username."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Missing fields. Must include `username` `password` `display_name` at minimum"
        })
    }
});


//get poems by username
router.get('/:username/poems', requireAuthentication, async (req, res, next) => {
    if (req.username === req.params.username || getAdminStatus(req.username)) {
        try {
            const result = await getPoemsByUsername(req.params.username);
            if (result) {
                res.status(200).send(result);
            }
            else {
                res.status(404).send({
                    error: "Could not find any of the user's uploaded poems"
                });
            }
        }
        catch (err) {
            res.status(500).send({
                error: "Error retrieving poems from the database"
            });
        }
    }
    else {
        res.status(400).send({
            err: "Credential error"
        });
    }
});

//get quotes by username
router.get('/:username/quotes', requireAuthentication, async (req, res, next) => {
    if (req.username === req.params.username || getAdminStatus(req.username)) {
        try {
            const result = await getQuotesByUsername(req.params.username);
            if (result) {
                res.status(200).send({
                    result
                });
            }
            else {
                res.status(404).send({
                    error: "Could not find any of the user's uploaded quotes" //either invalid access or no quotes exist
                });
            }
        }
        catch (err) {
            res.status(500).send({
                error: "Error retrieving quotes from the database"
            });
        }
    }
    else {
        res.status(400).send({
            err: "Credential error"
        });
    }
});
//get music by username.
router.get('/:username/music', requireAuthentication, async (req, res, next) => {
    if (req.username === req.params.username || getAdminStatus(req.username)) {
        try {
            const result = await getMusicByUsername(req.params.username);
            if (result) {
                res.status(200).send(result);
            }
            else {
                res.status(404).send({
                    error: "Could not find any of the user's uploaded songs"
                });
            }
        }
        catch (err) {
            res.status(500).send({
                error: "Error retrieving songs from the database"
            });
        }
    }
    else {
        res.status(400).send({
            err: "Credential error"
        });
    }
});

//Would implement this as a youtube-style dynamic scrolling list as if you were to check the Videos tab. The three API endpoints above this one would be some
//of the sorting categories that I would use for this overarching endpoint.
router.get('/:username/uploads', requireAuthentication, async (req, res, next) => {
    if (req.username === req.params.username || getAdminStatus(req.username)) {
        try {
            const result0 = await getMusicByUsername(req.params.username);
            const result1 = await getQuotesByUsername(req.params.username);
            const result2 = await getPoemsByUsername(req.params.username);
            if (result0 || result1 || result2) {
                res.status(200).send({
                    Songs: result0,
                    Quotes: result1,
                    Poems: result2
                })
            }
            else {
                res.status(404).send({
                    error: "Cannot find user's uploads"
                });
            }
        }
        catch (err) {
            res.status(500).send({
                error: "Error retrieving songs from the database"
            });
        }
    }
    else {
        res.status(400).send({
            err: "Credential error"
        });
    }
});
//delete user

router.delete('/:username', requireAuthentication, async (req, res, next) => {
    if (req.username === req.params.username || getAdminStatus(req.username)) {
        const result = await deleteUserByUsername(req.params.username);
        if (result) {
            res.status(204).send();
        }
        else {
            next();
        }
    }
});

router.use('*', (err, req, res, next) => {
    console.error(err);
    res.status(500).send({
        error: "An error occurred. Try again later."
    });
});




