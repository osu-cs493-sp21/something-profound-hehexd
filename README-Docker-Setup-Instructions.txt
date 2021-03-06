STEP 1: Create a network for Mongo:
====================================================================================================================================
docker network create mongo-net

STEP 2: Create a container for the mongo server and the Redis server. Note that we would NOT normally want to expose the ports, especially for redis.
====================================================================================================================================
docker run -d --name mongo-server -p 27017:27017 -v mongo-vol:/data/db -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=hunter2 --network mongo-net mongo
docker run -d --name redis-server -p 6379:6379 --network mongo-net redis 

STEP 3: Enter the following command to enter into the mongo shell with appropriate credentials
====================================================================================================================================
docker run --rm -it -v mongo-vol --network mongo-net mongo mongo --host mongo-server --username root --password hunter2 --authenticationDatabase admin


STEP 4: Switch databases into the poetry database:
====================================================================================================================================
use enlightenment;

STEP 5: Create a user with read/write privileges in the enlightenment database. Then initialize the data.
====================================================================================================================================
db.createUser({
	user: "test",
	pwd: "hunter2",
	roles: [ { role: "readWrite", db: "enlightenment" } ]
});

NOTE: SEE data/testdata.txt to initialize data, then exit mongo shell after

STEP 6: Set the environment variables in Windows
====================================================================================================================================
set MONGO_HOST=localhost
set MONGO_PORT=27017
set MONGO_USER=test
set MONGO_PASSWORD=hunter2
set MONGO_DATABASE=enlightenment
set REDIS_PORT=6379
set REDIS_HOST=localhost

STEP 6 ALTERNATIVE: Set environment variables using bash: 
====================================================================================================================================
export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_USER=test
export MONGO_PASSWORD=hunter2
export MONGO_DATABASE=enlightenment

ALTERNATIVE WITH NODEMON:
export MONGO_HOST=localhost && export MONGO_PORT=27017 && export MONGO_USER=test && export MONGO_PASSWORD=hunter2 && export MONGO_DATABASE=enlightenment && nodemon server.js

If by this point you open the docker container and see a server called mongo-server running on port 27017 you have done well.
Run the server using:
	node server.js
