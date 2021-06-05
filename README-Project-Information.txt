=========================
Something Profound Hehexd
=========================
Authors:
	Aedan Mills
	Brandon Lam
	Dana Pearson
	Jacob Cheney
======================================================================================================================================================================
General Information
======================================================================================================================================================================
Something Profound Hehexd is currently a prototype API using REST techniques to allow for users to upload their works for others to see.
People who visit the site will be able to search for quotes, poetry and music. However, the accessibility of the website is rate limited behind
registering an account and logging in. Any users can upload, modify or delete their own posts, but for the sake of the children, administrators may also
opt to remove, modify, or delete any content that is not deemed family friendly.
======================================================================================================================================================================

======================================================================================================================================================================
Technical Information
======================================================================================================================================================================
On a more technical standpoint, the API uses HTTP methods and the express framework in Node.js with MongoDB for storing data.
JWTs are used with 18 hour valid tokens that allow them to perform API requests to the collections (with the exclusion of other users) that the prototype provides.
Currently the 4 collections available are: users, poems, quotes, music. Unique features offered to users is that they are allowed to post, modify and delete content
from the website so long as they are the owners. Users with the administrator tag are allowed to modify and delete other users' content.
Users also have the ability to modify their own information such as their passwords and their usernames (Maybe?) and administrators may also delete users.
Users are required to register with their emails, usernames and passwords. Emails used for registration are unique and cannot be changed.
Additionally, users may modify their usernames, but usernames are also unique. The user is allowed to change their password, profile bio, and other
fun information.
Users can perform GET requests on their own information but are not allowed to see private information of other users. For example: emails and passwords.
However, bios of other users can be viewed.

GridFS is used to store audio files. They are large and with a MongoDB implementation of the database we can store the information inside of two collections:
audio.chunks and audio.files, where chunks will store the bytes of the audio and files will store the metadata of the audio. Currently the site will only accept .wav
and .mp3 audio.

The API uses pagination and HATEOAS as deemed necessary, which primarily refers to GET requests.

Potential work to be done includes using elasticsearch to search for poems and quotes, and potential implementation that allows for
.wav files to be converted to .mp3 using the node-lame package.
======================================================================================================================================================================