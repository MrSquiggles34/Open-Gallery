const express = require('express');
const session = require('express-session');
let app = express();

const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const Art = require("./ArtModel");
const User = require("./UserModel");

// View Engine
app.set("view engine", "pug"); 
app.set("views", "public/views");

// Express middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
	secret: 'some secret here',
	cookie: {maxAge:6000000},  //the cookie will expire in 100 minutes
	resave: true,
	saveUninitialized: true
})); 

app.get('/', sendIndex);
app.get('/login', sendLogin);
app.post("/login", login);     
app.get('/register', sendRegister);
app.post('/register', register);
app.post('/logout', logout);
app.get('/browse', loadArts, sendArts);
app.get('/art/:artID', authenticate, sendArt);
app.get('/profile', authenticate, loadLikedPosts, loadCommentedPosts, loadFollowing,sendProfile);
app.get('/browse/search', authenticate, parseArtQuery, loadSearchArts, sendArtSearch);
app.post('/compose', authenticate, postArt);
app.put('/like/:artID', authenticate, likePost);
app.put('/comment/:artID', authenticate, commentPost);
app.get('/artists/:artistID', authenticate, sendArtistProfile);
app.put('/switch', authenticate, switchProfile);
app.put('/artists/:artistID/follow', authenticate, followArtist);

// -----------------Define routes
async function authenticate(req, res, next){
	// Redirect to login if not logged in
	if (!req.session.loggedin) {
		res.redirect('/login'); 
		return;
	}
	next();
}

function sendIndex(req, res, next) {
	res.render("index");
}

function sendLogin(req, res, next) {
	res.render("login");
}

function sendRegister(req, res, next){
    res.render("register");
}

function sendArts(req, res, next) {
	console.log("Send Art");
	res.status(200).render("browse", { arts: res.results });
}

async function loadArts(req, res, next){
	const artsResults = await mongoose.connection.db.collection("arts").find({}).toArray();

	res.results = artsResults;
	console.log("artsResults" + artsResults)
	next();
}

async function login(req, res, next) {
	if (req.session.loggedin) {
		res.status(200).send("Already logged in.");
		return;
	}

	let email = req.body.email;
	let password = req.body.password;

	console.log("Logging in with credentials:");
	console.log("Username: " + req.body.email);
	console.log("Password: " + req.body.password);

	try {
        // Find the user in the database
        const user = await mongoose.connection.db.collection("users").findOne({ email });

        if (!user) {
            res.status(401).send("Unauthorized"); 
            return;
        }

        // Check if the password is correct
        if (user.password === password) {
            req.session.loggedin = true;
            req.session.email = user.email; 
			req.session.name = user.name;
			console.log(req.session.name);
            res.redirect("/browse");
        } else {
            res.status(401).send("Not authorized. Invalid password.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

async function register(req, res, next) {
    const { userName, email, password, passwordConfirm } = req.body;

    // Check if passwords match
    if (password !== passwordConfirm) {
        res.status(400).send('Passwords do not match');
        return;
    }

	console.log("reacher here");
    try {
        // Check if the email is already registered
        const existingUser = await mongoose.connection.db.collection("users").findOne({ email });
		console.log("reached hore");
		console.log(existingUser);
        if (existingUser) {
            res.status(400).send('Email is already registered');
            return;
        }

        // Create a new user
        const newUser = new User({
            name: userName,
            email,
            password 
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function postArt(req, res, next){
	const { title, year, category, medium, poster, description} = req.body;

    try {
        // Find the user in the database based on the stored email
        const user = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
		console.log(user.name);
		try {
			// Check if the email is already registered
			const existingUser = await mongoose.connection.db.collection("arts").findOne({ title });
			console.log(existingUser);
			if (existingUser) {
				res.status(400).send('Sorry, Title already taken!');
				return;
			}
	
			// Create a new art
			const newArt = new Art({
				Title: title,
				Artist: req.session.name,
				Year: year,
				Category: category,
				Medium: medium,
				Description: description,
				Poster: poster
			});
	
			// Save the user to the database
			await newArt.save();
	
			res.status(201).redirect('/profile');
		} catch (error) {
			console.error(error);
			res.status(500).send('Internal Server Error');
		}

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
	}
}

async function logout(req, res, next) {
	// End the session
	if (req.session.loggedin) {
		req.session.loggedin = false;
		req.session.email = undefined;
		res.status(201).redirect("login");
	} else {
		res.status(201).redirect("login.");
	}
}

async function sendArt(req, res, next) {
	let likeStatus = "";
	console.log("Send Art");
	let query = { "_id": new ObjectId(req.params.artID) }
	console.log("id query" + req.params.artID);

	const result = await mongoose.connection.db.collection("arts").findOne(query);
	const artist = result.Artist;
	const artistID = await mongoose.connection.db.collection("users").findOne({ name: artist });

	const artist1 = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
	const resultIdString = result._id.toString();

	if (artist1 && artist1.liked && artist1.liked.includes(resultIdString)) {
		likeStatus = "UnLike";
		console.log(`${resultIdString} is in the liked array of ${req.session.email}`);
	} else {
		likeStatus = "Like";
		console.log(`${resultIdString} is not in the liked array of ${req.session.email}`);
	}

	if (!result) {
		res.status(404).send("Unknown ID");
		return;
	} else {
		res.status(200).render("art", { result, artistID, likeStatus: likeStatus });
		return;
	}
}

// CHnage profile per account
async function loadLikedPosts(req, res, next) {
    const user = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    res.locals.user = user;

    try {
        // Check if the liked array exists in the user object and onvert to ObjectId array
        if (user.liked && Array.isArray(user.liked)) {
            const likedIds = user.liked.map(id => new ObjectId(id));

            // Retrieve all items with IDs in likedIds
            const likedPosts = await mongoose.connection.db.collection("arts")
                .find({ _id: { $in: likedIds } })
                .toArray();

            res.locals.likedPosts = likedPosts;
            console.log(likedPosts);
        } else {
            console.log("Liked array does not exist or is not an array");
            res.locals.likedPosts = [];
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
        return;
    }

    next();
}

async function loadCommentedPosts(req, res, next) {

	const user = res.locals.user;

    try {
		if (user.commented && user.commented.length > 0) {
            const commentedIds = user.commented.map(id => new ObjectId(id));

            const commentedPosts = await mongoose.connection.db.collection("arts")
                .find({ _id: { $in: commentedIds } })
                .toArray();

            res.locals.commentedPosts = commentedPosts;
            console.log(commentedPosts);
        } else {
            console.log("User has no commented posts.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
        return;
    }

    next();
}

async function loadFollowing(req, res, next){
	const user = res.locals.user;

    try {
		if (user.following && user.following.length > 0) {
            // Convert user.commented array to ObjectId array
            const followingIds = user.following.map(id => new ObjectId(id));

            // Retrieve all items with IDs in likedIds
            const followingPosts = await mongoose.connection.db.collection("users")
                .find({ _id: { $in: followingIds } })
                .toArray();

            res.locals.followingPosts = followingPosts;
            console.log(followingPosts);
        } else {
            console.log("You are not following anyone.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
        return;
    }

	next();
}

async function sendProfile(req, res, next) {
	const user = res.locals.user;
	const liked = res.locals.likedPosts;
	const commented = res.locals.commentedPosts;
	const following = res.locals.followingPosts;
    try {
        // Find the user in the database based on the stored email
        
		console.log(user.accountType);
		console.log(liked + "hee hee");

		const artsResults = await mongoose.connection.db.collection("arts").find({Artist: user.name}).toArray();
		res.results = artsResults;

		// Get artID of liked posts

		if(user.accountType === "Artist"){
			res.status(200).render("profile", { arts: res.results, username: user.name, accountType: user.accountType, liked: liked, commented: commented, following: following });
				} else {
			res.status(200).render("profilePatron", { arts: res.results, username: user.name, accountType: user.accountType, liked: liked, commented: commented });
		}
        // Pass the user information to the rendering context
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

async function parseArtQuery(req, res, next){
	console.log("Parse Query");
	console.log(req.query);

	let matches = [];
	if (req.query) {
		const keys = Object.keys(req.query);
		const firstKey = keys[0];
		// Construct a regex pattern for case-insensitive matching
        const regexPattern = ".*" + firstKey + ".*";
		// Use regex to match Artist, Medium, or Category fields
        matches.push({
            $or: [
                { Artist: { $regex: regexPattern, $options: "i" } },
                { Medium: { $regex: regexPattern, $options: "i" } },
                { Category: { $regex: regexPattern, $options: "i" } }
            ]
        });
    }
	// Combine regex matches using $and operator
    let queryDoc = { $and: matches };
    console.log(queryDoc);
	// Attach the constructed query document to the request object
    req.queryDoc = queryDoc;
    next();
}

async function loadSearchArts(req, res, next) {
	console.log("loadArt Search");
	let query = req.queryDoc;
	console.log("Query" + JSON.stringify(req.queryDoc));
	const artResults = await mongoose.connection.db.collection("arts").find(query).toArray();

	//const num = await cardsCollection.countDocuments(query);
	res.results = artResults;
	console.log("ArtResults" + artResults)
	next();
}

async function sendArtSearch(req, res, next) {
	console.log("Send Art List");
	res.status(200).render("browselist", { artList: res.results });
}

async function likePost(req, res, next) {
    console.log("Like Post");
    const query = { "_id": new ObjectId(req.params.artID) };
	const userLikedArt = await mongoose.connection.db.collection("users").findOne({ email: req.session.email, liked: req.params.artID });
	console.log(req.params.artID);
	if (userLikedArt) {
		// The art is liked by the user
		console.log("removing like");
		try {
			const result = await mongoose.connection.db.collection("arts").findOne(query);

	
			if (!result) {
				res.status(404).send("Unknown ID");
				return;
			} else {
				await mongoose.connection.db.collection("users").updateOne(
					{ email: req.session.email },
					{ $pull: { liked: req.params.artID.toString() } }
				);

				// Update the Likes value using $inc operator
				await mongoose.connection.db.collection("arts").updateOne(query, { $inc: { Likes: -1 } });
				res.status(200).send("like removed");
			}
		} catch (error) {
			console.error(error);
			res.status(500).send("Internal Server Error");
		}
	} else {
		console.log("adding like");
		try {
			const result = await mongoose.connection.db.collection("arts").findOne(query);
	
			if (!result) {
				res.status(404).send("Unknown ID");
				return;
			} else {
				await mongoose.connection.db.collection("users").updateOne(
					{ email: req.session.email },
					{ $push: { liked: req.params.artID } }
				);

				// Update the Likes value using $inc operator
				await mongoose.connection.db.collection("arts").updateOne(query, { $inc: { Likes: 1 } });
				res.status(200).send("like added");
			}
		} catch (error) {
			console.error(error);
			res.status(500).send("Internal Server Error");
		}
	}
}

async function commentPost(req, res, next) {
    console.log('comment Post');
	const query = { "_id": new ObjectId(req.params.artID) };
	const result = await mongoose.connection.db.collection("arts").findOne(query);
    const userCommentedArt = await mongoose.connection.db.collection("users").findOne({ email: req.session.email, commented: req.params.artID });
    if (userCommentedArt) {
        // The art is already commented by the user
        console.log("You already commented");
        res.status(200).json({ message: "You already commented" });
    } else {
        try {
			console.log(req.body);
            const { commentContent } = req.body;
            const result = await mongoose.connection.db.collection("arts").findOne(query);
			const result2 = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
            if (!result || result.Artist === result2.name) {
                res.status(404).json({ error: "Unknown ID or you own this art"});
                return;
            } else {
                await mongoose.connection.db.collection("users").updateOne(
                    { email: req.session.email },
                    { $push: { commented: req.params.artID } }
                );
                // Update the Likes value using $inc operator
                await mongoose.connection.db.collection("arts").updateOne(query, { $push: { Comments: req.session.name + " says: " + commentContent } });

                // Send JSON response with the new comment
                res.status(200).json({ comment: req.session.name + " says: " + commentContent });
                return;
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

async function switchProfile(req, res, next) {
    console.log("Switch profile type");
    try {
		const user = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });

        if (!user) {
            res.status(404).send("User not found");
            return;
        }
		
        // Switch between "Artist" and "Patron"
        const newAccountType = user.accountType === 'Artist' ? 'Patron' : 'Artist';

        // Update the user's accountType
        await mongoose.connection.db.collection("users").updateOne(
            { email: req.session.email },
            { $set: { accountType: newAccountType } }
        );
		console.log(newAccountType);
		res.status(200).redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

async function sendArtistProfile(req, res, next) {
	const query = { "_id": new ObjectId(req.params.artistID) };
    try {
		let followStatus = "";
        const artist = await mongoose.connection.db.collection("users").findOne(query);
		if (!artist) {
            res.status(404).send("Artist not found");
            return;
        }

		const artist1 = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
		const artsResults = await mongoose.connection.db.collection("arts").find({ Artist: artist.name }).toArray();

		const artistIdString = artist._id.toString();

		if (artist1 && artist1.following && artist1.following.some(id => id.toString() === artistIdString)) {
			followStatus = "Unfollow";
			console.log(`${artistIdString} is in the following array of ${req.session.email}`);
		} else {
			followStatus = "Follow";
			console.log(`${artistIdString} is not in the following array of ${req.session.email}`);
		}

		res.results = artsResults;

		if(artist.name != req.session.name){
			res.status(200).render("artistprofile", { artist: artist, arts: res.results, followStatus: followStatus});
		} else {
			res.status(200).redirect("/profile")
		}
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

async function followArtist(req, res, next) {
    try {
        // Check if the user is logged in
        if (!req.session.loggedin) {
            res.status(401).send("Unauthorized. Please log in.");
            return;
        }

        // Find the user in the database based on the stored email
        const user = await mongoose.connection.db.collection("users").findOne({ email: req.session.email });
        
        // Check if the user exists
        if (!user) {
            res.status(404).send("User not found");
            return;
        }

        // Find the artist in the database based on the provided artistID
        const artist = await mongoose.connection.db.collection("users").findOne({ _id: new ObjectId(req.params.artistID) });

        // Check if the artist exists
        if (!artist) {
            res.status(404).send("Artist not found");
            return;
        }

        // Check if the user is trying to follow themselves
        if (user._id.equals(artist._id)) {
            res.status(400).send("Cannot follow yourself");
            return;
        }

        // Check if the user is already following the artist
        if (user.following.map(id => id.toString()).includes(artist._id.toString())) {
			console.log("removing");
            // Remove the artist's ID from the user's following array
            await mongoose.connection.db.collection("users").updateOne(
                { email: req.session.email },
                { $pull: { following: artist._id } }
            );

            // Remove the user's ID from the artist's followers array
            await mongoose.connection.db.collection("users").updateOne(
                { _id: artist._id },
                { $pull: { followers: user._id } }
            );

            res.status(200).send("Successfully unfollowed the artist");
        } else {
            // Add the artist's ID to the user's following array
            await mongoose.connection.db.collection("users").updateOne(
                { email: req.session.email },
                { $addToSet: { following: artist._id } }
            );

            // Add the user's ID to the artist's followers array
            await mongoose.connection.db.collection("users").updateOne(
                { _id: artist._id },
                { $addToSet: { followers: user._id } }
            );
            res.status(200).send("Successfully followed the artist");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

mongoose.connect('mongodb://127.0.0.1/OG');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
	app.listen(3000);
	console.log("Server listening on port 3000");
});