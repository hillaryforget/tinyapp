const express = require("express");
const helpers = require("./helpers");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const app = express(); //create server
const PORT = 8080; //default port 8080

app.set("view engine", "ejs"); //set view engine
app.use(morgan("dev"));

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

//global object used to store and access the users in the app
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("123", 10),
  },
};

//the body-parser library converts the request body from a buffer into readable string
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["secret keys"],
    //cookie options
    maxAge: 24 * 60 * 60 * 1000, //24 hours
  })
);

//add routes
app.post("/urls", (req, res) => {
  let id = helpers.generateRandomString();
  urlDatabase[id] = req.body.longURL;
  const userID = req.session && req.session.user_id;
  urlDatabase[id] = { longURL: req.body.longURL, userID: userID };
  if (!userID) {
    res.status(401).send("Must be logged in");
  }
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const u = urlDatabase[id];
  const longURL = u ? u.longURL : null;
  if (!longURL) {
    res.status(400).send("Invalid ID");
  }
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  const userID = req.session && req.session.user_id;
  if (!userID) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userID = req.session && req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: users[userID],
    errMessage: "",
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
  const userID = req.session && req.session.user_id;
  const templateVars = {
    user: users[userID],
    errMessage: "",
  };
  if (!userID) {
    templateVars.errMessage = "Login to create new URL";
    res.redirect("/login");
  }
  if (userID) {
    res.render("urlsNew", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
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
  const userID = req.session && req.session.user_id;
  const templateVars = {
    user: users[userID] || null,
  };
  if (userID) {
    return res.redirect("/urls");
  }
  res.render("urlsLogin", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session && req.session.user_id;
  if (!userID) {
    res.status(401).send("You must be logged in");
  }
  const id = req.params.id;
  const longURL = req.body.longURL;
  const url = urlDatabase[id];
  if (url.userID !== userID) res.status(401).send("You are not authorized to update this item");
  urlDatabase[req.params.id] = {
    ...url,
    longURL
  };
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.send("You are not logged in");
  }

  const urlObj = urlDatabase[req.params.id];
  if (!req.params.id) {
    return res.send("Url ID is a required field");
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
  const user = helpers.findUserByEmail(email, users);
  const userID = req.session.user_id;
  const templateVars = { user: users[userID] };

  //email and password don't match 403
  if (!email || !password) {
    templateVars.errMessage = "Email and password are required";
    res.status(403).render("urlsLogin", templateVars);
    return;
  }
  //email cannot be found 403
  if (!user) {
    templateVars.errMessage = "Email cannot be found";
    res.status(403).render("urlsLogin", templateVars);
    return;
  }
  //user found and compare password
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session["user_id"] = user.id;
      res.redirect("urls");
    }
    templateVars.errMessage = "Incorrect password";
    res.status(403).render("urlsLogin", templateVars);
  } else {
    res.sendStatus((res.statusCode = 400));
    return;
  }
});

//clear cookie and return to main page
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/login");
});

//register
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  const userID = req.session && req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  res.render("registerShow", templateVars);
});

//creates new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  //check for empty inputs
  if (typeof email !== "string" || email.length === 0) {
    res.status(400).send("Must provide email");
    return;
  }
  if (typeof password !== "string" || password.length === 0) {
    res.status(400).send("Must provide password");
    return;
  }
  //check if user exists already (by email address)
  const user = helpers.findUserByEmail(users, email);
  if (user) {
    res.status(400).send("User already exists");
  }
  //register new user
  let id = helpers.generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(hashedPassword);
  users[id] = {
    id,
    email,
    password: hashedPassword,
  };
  req.session["user_id"] = id;
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
