const mongoose = require('mongoose');

// The User schema defines the structure of user documents in MongoDB.
// We enforce data integrity directly at the schema level.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Normalize emails to lowercase so "User@Test.com" and "user@test.com" match
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    isVerified: {
      type: Boolean,
      default: false, // Users start unverified until they click the email link
    },
    verificationToken: {
      type: String,
      default: null, // Holds a random crypto token while awaiting verification
    },
  },
  {
    // Automatically creates and manages createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
