const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
	name: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /[A-Za-z]+/,
		trim: true
	},
	password: {
        type: String, 
        minlength: 1,
        required: true
    },
    email: {
        type: String,
        required: true,
        minlength: 3
    },
    following: {
        type: [String],
        default: []
    },
    followers: {
        type: [String],
        default: []
    },
    liked: {
        type: [String],
        default: []
    },
    accountType: {
        type: String,
        default: "Artist"
    },
    reviewed: {
        type: [String],
        default: []
    },
    notifications: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model("User", userSchema);
