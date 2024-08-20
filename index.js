// Load environment variables from .env file
require('dotenv').config();

// Secret key for JWT token generation
const secretKey = process.env.SECRET_KEY;

// Import required packages
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken'); // Add JWT package for token generation
var cookieParser = require('cookie-parser'); // Add cookie-parser package to handle cookies

const app = express();

// Parse JSON bodies
app.use(bodyParser.json());

// Serve static files from public folder
app.use(express.static('public'));

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/Database', { useNewUrlParser: true, useUnifiedTopology: true });

// Get a reference to the database connection
var db = mongoose.connection;

// Handle database connection errors
db.on('error', () => console.log("Error in Connecting to Database"));

// Handle successful database connection
db.once('open', () => console.log("Connected to Database"));

// Middleware to hash password
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};

// Generate JWT token
const generateToken = (user) => {
  const token = jwt.sign(
    { userId: user._id, email: user.email, tokenVersion: user.tokenVersion }, // Include tokenVersion in token
    secretKey,
    { expiresIn: '1h' } // Token expires in 1 hour
  );
  return token;
};

// Handle sign up request
app.post("/sign_up", async (req, res) => {
  var name = req.body.name;
  var age = req.body.age;
  var email = req.body.email;
  var phone = req.body.phoneno;
  var gender = req.body.gender;
  var password = req.body.password;

  try {
    // Hash the password
    var hashedPassword = await hashPassword(password);

    var data = {
      "name": name,
      "age": age,
      "email": email,
      "phone": phone,
      "gender": gender,
      "password": hashedPassword,
      "tokenVersion": 0 // Initialize tokenVersion
    };

    // Insert user data into database
    db.collection('users').insertOne(data, (err, collection) => {
      if (err) {
        throw err;
      }
      console.log("Record Inserted Successfully");

      // Generate JWT token
      const user = collection.ops[0];
      const token = generateToken(user);

      // Set HTTPOnly cookie
      res.cookie('jwt', token, {
        httpOnly: true, // Prevent JavaScript access to cookie
        secure: true, // Only transmit cookie over HTTPS
        sameSite: 'strict' // Prevent cross-site requests from accessing cookie
      });

      // Send JWT token in response body (optional)
      res.json({ token: token });

      res.redirect('signup_success.html');
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error registering user' });
  }
});

// Handle login request
app.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  try {
    // Find user by email
    var user = await db.collection('users').findOne({ email: email });

    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }

    // Compare the password with the hashed password
    var isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTPOnly cookie
    res.cookie('jwt', token, {
      httpOnly: true, // Prevent JavaScript access to cookie
      secure: true, // Only transmit cookie over HTTPS
      sameSite: 'strict' // Prevent cross-site requests from accessing cookie
    });

    // Send JWT token in response body (optional)
    res.json({ token: token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error logging in user' });
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.jwt; // Get the token from cookies

  if (!token) {
    return res.status(401).send({ message: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await db.collection('users').findOne({ _id: mongoose.Types.ObjectId(decoded.userId) });

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).send({ message: 'Token is no longer valid' });
    }

    req.user = decoded; // Attach user information to the request
    next(); // Move to the next middleware or route handler
  } catch (err) {
    res.status(400).send({ message: 'Invalid Token' });
  }
};

// Protected route example
app.get("/dashboard", authenticateToken, (req, res) => {
  res.send(`Welcome to the dashboard, ${req.user.email}!`);
});

// Handle logout request
app.post("/logout", (req, res) => {
  res.clearCookie('jwt'); // Clear the JWT cookie
  res.send({ message: 'Logged out successfully' });
});

// Handle logout from all devices
app.post("/logout_all", async (req, res) => {
  try {
    await db.collection('users').updateOne(
      { _id: mongoose.Types.ObjectId(req.user.userId) },
      { $inc: { tokenVersion: 1 } } // Increment tokenVersion to invalidate all tokens
    );
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.send({ message: 'Logged out from all devices successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Error logging out from all devices' });
  }
});

// Handle root route
app.get("/", (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": "*"
  });
  res.sendFile(__dirname + '/index.html');
});

// Route to get JWT token from cookies
app.get("/get_cookie", (req, res) => {
  // Access the cookie
  const token = req.cookies.jwt; // Retrieve the JWT cookie
  if (token) {
    res.send(`JWT Token: ${token}`);
  } else {
    res.send('No JWT token found in cookies.');
  }
});

// Start server
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
