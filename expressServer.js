const { name } = require("ejs");
const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
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

app.set("view engine", "ejs"); //set view engine
app.use(morgan("dev"));
app.use(cookies());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//the body-parser library converts the request body from a buffer into readable string
app.use(express.urlencoded({ extended: true }));

//add routes
app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = { user: users[userID]};
  if (!userID) {
    templateVars.errMessage = "Must be logged in";
    return res.render("urlsLogin", templateVars);
  }
  res.redirect(`/urls`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
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
  };
  res.render("urlsIndex", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = { user: users[userID] };
  res.render("urlsNew", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
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
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  return res.redirect("/urls");
});

//login cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(users, email);
  const userID = req.cookies && req.cookies.user_id;
  const templateVars = { user: users[userID] };
  console.log(users);
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
    if (checkPassword(users, email, password)) {
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
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie("user_id", id);
  console.log(users);
  res.redirect(`/urls`);
});