//const { name } = require("ejs");//whats name doing, do i need this?
const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');//use instead of cookie-parser or both?
const cookies = require("cookie-parser");
const app = express(); //create server
const PORT = 8080; //default port 8080

const findUserByEmail = (users, email) => {
  const user = Object.values(users).find((user) => user.email === email);
  if (!user) return null;
  return user;
};
const checkPassword = (users, email, password) => {
  const user = Object.values(users).find((user) => user.email === email);
  if (!user) return false;
  return user.password === password;
};

//returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id, database) => {
  let urls = {};
  for (let keys in database) {
    if (database[keys].userID === id) {
      urls[keys] = {longURL: database[keys].longURL};
    }
  }
  return urls;
};

app.set("view engine", "ejs"); //set view engine
app.use(morgan("dev"));
app.use(cookies());//add sessions?

//track which URLs belong to particular users, we'll need to associate each new URL with the user that created it.
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
};

//will create a 6 char id for short url
const generateRandomString = () => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyz";
  const charsLength = characters.length;
  let output = "";
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * charsLength));
  }
  return output;
};

//global object used to store and access the users in the app
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "123",
  },
};

//the body-parser library converts the request body from a buffer into readable string
app.use(express.urlencoded({ extended: true }));

//add routes
app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  const userID = req.cookies && req.cookies.user_id;
  console.log(userID);
  urlDatabase[id] = {longURL: req.body.longURL, userID: userID};
  const templateVars = { user: users[userID]};
  if (!userID) {
    templateVars.errMessage = "Must be logged in";//is working?
    return res.render("urlsLogin", templateVars);
  }
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[id],
  };
  if (!longURL) {
    templateVars.errMessage = "404 URL not found"; //is working?
    return res.render("urlsLogin", templateVars);
  }
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.cookies && req.cookies.user_id;
  console.log(req.cookies);
  const templateVars = {
    urls: urlDatabase,
    user: users[userID],
    errMessage: ""
  };
  if (!userID) {
    templateVars.errMessage = "Please Login";
  }
  res.render("urlsIndex", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = {
    user: users[userID],
    errMessage: "",
  };
  if (!userID) {
    templateVars.errMessage = "Login to create new URL";//is working?
  }
  if (userID) {
    res.render("urlsNew", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    return res.send("You are not logged in");
  }
  
  const urlObj = urlDatabase[req.params.id];
  if (!req.params.id) {
    return res.send("Must provide more information");
  }

  if (urlObj.userID !== userID) {
    return res.send("Permission denied");
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlObj.longURL,
    user: users[userID],
  };
  res.render("urlsShow", templateVars);
});

//login page
app.get("/login", (req, res) => {
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = {
    user: users[userID] || null,
  };
  if (userID) {
    return res.redirect("/urls");
  }
  res.render("urlsLogin", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = {longURL: req.body.longURL, UserID: urlDatabase[req.params.id].UserID};
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    return res.send("You are not logged in");
  }
  
  const urlObj = urlDatabase[req.params.id];
  if (!req.params.id) {
    return res.send("Must provide more information");
  }
  
  if (urlObj.userID !== userID) {
    return res.send("Permission denied");
  }
  
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//login cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(users, email);
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = { user: users[userID] };
  //email and password don't match 403
  if (!email || !password) {
    templateVars.errMessage = "Email and password are required";
    res.status(403).render("urlsLogin", templateVars);
  }
  //email cannot be found 403
  if (!user) {
    templateVars.errMessage = "Email cannot be found";
    res.status(403).render("urlsLogin", templateVars);
  }
  //user found and compare password
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
    //if (checkPassword(users, email, password)) {
      res.cookie('user_id', user.id);
      res.redirect("urls");
    }
    res.cookie("user_id", user.id);
    templateVars.errMessage = "Incorrect password";
    res.status(403).render("urlsLogin", templateVars);
  } else {
    res.sendStatus((res.statusCode = 400));
  }
});

//clear cookie and return to main page
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  return res.redirect("/login");
});

//register
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  const userID = req.cookies && req.cookies.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  res.render("registerShow", templateVars);
});

//creates new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  
  //check for empty inputs
  if (typeof email !== "string" || email.length === 0)
    res.sendStatus((res.statusCode = 400));
  if (typeof password !== "string" || password.length === 0)
    res.sendStatus((res.statusCode = 400));
  
  //check if user exists already (by email address)
  const user = findUserByEmail(users, email);
  if (user) res.sendStatus((res.statusCode = 400));
  
  //register new user
  let id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(hashedPassword);
  users[id] = {
    id,
    email: req.body.email,
    password: hashedPassword
  };
  res.cookie("user_id", id);
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});