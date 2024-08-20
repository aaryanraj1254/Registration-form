<script>
Step 1: Generate JWT Token

I added a new function called generateToken that takes a user object as an argument. This function uses the jsonwebtoken package to generate a JWT token that contains the user's ID and email. The token is signed with a secret key (secretKey) and has an expiration time of 1 hour.

Step 2: Store JWT Token in HTTPOnly Cookie

After generating the JWT token, I stored it in an HTTPOnly cookie using the res.cookie method. This sets a cookie called jwt with the generated token as its value. The httpOnly flag is set to true to prevent JavaScript access to the cookie, and the secure flag is set to true to ensure the cookie is only transmitted over HTTPS.



By storing the JWT token in an HTTPOnly cookie, we can securely authenticate users on subsequent requests. Here's how it works:

When a user signs up, we generate a JWT token and store it in an HTTPOnly cookie.
On subsequent requests, the browser sends the cookie back to the server.


The server can verify the token by checking its signature and expiration time. If it's valid, we can authenticate the user and grant access to protected resources.


This approach provides a secure way to authenticate users without storing sensitive information on the client-side.



Route Definition:

app.get("/get_cookie", (req, res) => { ... });
This line sets up a route handler for GET requests to the /get_cookie path. When someone accesses this path, the function inside will run.
Accessing Cookies:

const token = req.cookies.jwt;
req.cookies is an object provided by the cookie-parser middleware. It contains all cookies sent by the client in the request.
req.cookies.jwt retrieves the value of the cookie named jwt. In this case, jwt is expected to be the name of a cookie that holds a JWT token.
Checking the Token:

if (token) { ... }
This checks if the jwt cookie exists. If it does, token will hold its value. If not, token will be undefined.
Sending Response:

res.send(JWT Token: ${token});
If the jwt cookie is found, this line sends a response to the client showing the value of the JWT token.
res.send('No JWT token found in cookies.');
If the jwt cookie is not found, this line sends a response indicating that no JWT token was found.
Summary
Purpose: This route is for checking if a JWT cookie named jwt exists in the request and displaying its value or indicating that it's not present.
How It Works: It uses the cookie-parser middleware to read cookies from the request, checks for the specific cookie (jwt), and then responds with its value or a message saying it's not found.
This setup is useful for debugging or verifying that cookies are being sent and read correctly in your application.




//autorization and authentication
Sign Up/Login: User submits details; password is hashed. If valid, a JWT token is created and sent back as a cookie.

JWT Token: Stored in the user's browser, it acts as proof of login.

Protected Routes: Middleware checks the JWT token. If valid, access is granted; otherwise, access is denied.

Log Out: The JWT cookie is cleared, ending the session.

In essence, JWT is used to confirm identity (authentication) and control access (authorization) to secure parts of the app.



When a user logs out, the logout route clears the JWT cookie from their browser using res.clearCookie('jwt'). This removes the token that was keeping the user logged in, effectively ending their session. Without this cookie, the user can no longer access protected areas of the app until they log in again.


//sign out from devices
Increment Token Version: {$inc: { tokenVersion: 1 }} increases the tokenVersion by 1 in the database. This change makes all existing tokens invalid.

Clear Cookie: res.clearCookie('jwt') removes the JWT cookie from the user's current device.

Response: Sends a message confirming that the user has been logged out from all devices.

Summary:
Purpose: Sign out from all devices.
Method: Increment tokenVersion to invalidate all old tokens.
Clear Cookie: Remove the JWT cookie from the current session.
This approach ensures that once the tokenVersion is updated, all existing tokens become invalid, effectively logging the user out from all devices.



