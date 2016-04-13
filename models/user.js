/**
 * Created by Mike on 4/12/2016.
 */
// Load required packages
var mongoose = require('mongoose');

// Define our schema
var UserSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, index: {unique: true}, required: true},
    pendingTasks: [String],
    dateCreated: { type: Date, default: Date.now }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
