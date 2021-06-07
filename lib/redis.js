const redis = require('redis'); //for using the redis client and server
const { requireAuthentication } = require('./auth');

//Two environment variables, PORT and HOST which allow us to communicate with Redis.
const redisClient = redis.createClient(
    process.env.REDIS_PORT || '6379',
    process.env.REDIS_HOST || 'localhost'
);

//this variable refers to the rate limiting window in milliseconds.
const rateLimitWindowMS = 60000; //60 seconds === 60000ms

//NOTE: SET THIS TO 5 FOR PRODUCTION. SET TO ANY OTHER VALUE FOR DEBUGGING/TESTING
const rateLimitMaxRequests = 10; //For testing purposes this would be as high as needed.


//Note that users under the same IP address will get lumped into the same token bucket. We would have to consider rate limiting cases for users that are under a VPN
//Example: Use harder forms of identification like ip address and port number.
//Redis library does not have promises built in, we can do it manually or use the redis-provided promisification.
function getUserTokenBucket(ip) {
    //promises must be passed a functio     n to execute, and the function performs the asynchronous work.
    //promise framework will call this function and provide two callbacks: resolve and reject. This is what will work async
    return new Promise((resolve, reject) => {
        redisClient.hgetall(ip, (err, tokenBucket) => { //takes in a key and a callback. In this case the key is the ip address
            if (err) {
                reject(err); //if err then reject promise
            }
            //redis stores the values at each key as strings.
            //if we are dealing with numerical values, we must parse as numerical values.
            else if (tokenBucket) { //two cases: ip address already logged or the first request by the ip address. Those get handled here and we handle tokenBucket accordingly.
                tokenBucket.tokens = parseFloat(tokenBucket.tokens);
                resolve(tokenBucket);
            }
            else { //create a new token bucket
                resolve({
                     tokens: rateLimitMaxRequests, //initially we give the use the maximum number of requests allowed.
                     last: Date.now() //timestamp of the last request will be the timestamp of the current request
                });
            }
        }); //this is our function for fetching rate limit data
    });
}

exports.getUserTokenBucket = getUserTokenBucket;

function saveUserTokenBucket(ip, tokenBucket) {
    return new Promise((resolve, reject) => {
        redisClient.hmset(ip, tokenBucket, (err, resp) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

exports.saveUserTokenBucket = saveUserTokenBucket;

//This program uses IP Address Rate Limiting
//express middleware function for rate limiting
async function rateLimit(req, res, next) {
    //console.log("rate limiting");
    try {
        const tokenBucket = await getUserTokenBucket(req.ip); //fetch the ip and await their token bucket
        const currentTimestamp = Date.now();
        const elapsedTime = currentTimestamp - tokenBucket.last; //get change in time in milliseconds. Then compute the number of tokens used.
        tokenBucket.tokens += elapsedTime * (rateLimitMaxRequests / rateLimitWindowMS); //calculate the number of tokens the user gains based on the elapsed time
        tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests); //minimum between the tokenBucket.tokens and the max number of requests, cap # of tokens at max requests
        tokenBucket.last = currentTimestamp; //update the timestamp of the last request
        //Does the user have enough tokens to pay for hte current request?
        //console.log("Tokens remaining: ", tokenBucket.tokens);
        if (tokenBucket.tokens >= 1) { //proceed
            tokenBucket.tokens -= 1; //take away one token. We also need to save this update back to redis.
            await saveUserTokenBucket(req.ip, tokenBucket);
            next();
        }
        else { //reject request
            res.status(429).send({ //429 is the standard status for rate limiting. 
                //An alternative would be to send 503 if you didn't want to give away that you were rate limiting. However some people would probably be able to figure this out.
                //Send a response header that lets the user know the maximum number of requests per given time.

                error: "Sending too many requests too frequently. Please wait a minute."
            });
        }

    }
    catch (err) { //if we can't communicate with redis, turn off our rate limiting service. Allow every request to go through.
        next(); //allow the user to proceed if they are within their rate limit.
        //Design choice but makes sense. Our only choice would be to deny every request, but if we deny every request then we know no requests succeed.
        //If we are not suffering from a DOS/DDOS attack then this design choice would be far better than the alternative. But again, weigh the risks.
    }
}

exports.rateLimit = rateLimit;