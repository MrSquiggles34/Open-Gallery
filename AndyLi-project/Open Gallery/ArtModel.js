const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let artSchema = Schema({
	Title: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50
	},
	Artist: {
		type: String,
		required: true,
	},
	Year: {
		type: String, 
		required: true,
	},
	Category: {
        type: String,
		required: true,
	},
    Medium: {
        type: String,
		required: true,
	},
    Description: {
		type: String, 
		required: false,
		minlength: 0,
		maxlength: 256
	},
    Poster: {
        type: String, 
        default: "missing image"
    },
    Likes: {
        type: Number,
        default: 0
    },
    Comments: {
        type: [String],
        default: [] 
    }
});

module.exports = mongoose.model("Arts", artSchema);