const { name } = require('ejs');
const express = require('express');
const morgan = require("morgan");
const cookies = require('cookie-parser');
const app = express();//create server
const PORT = 8080;//default port 8080

app.set('view engine', 'ejs');//set view engine
app.use(morgan('dev'));
app.use(cookies());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'

};

//will create a 6 char id for short url
const generateRandomString = () => {
  const characters = '1234567890abcdefghijklmnopqrstuvwxyz';
  const charsLength = characters.length;
  let output = '';
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * charsLength));
  }
  return output;
};

app.use(express.urlencoded({ extended: true }));//the body-parser library converts the request body from a buffer into readable string

//add routes
app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render('urlsIndex', templateVars);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render('urlsNew', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render('urlsShow', templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  return res.redirect('/urls');
});

//cookie
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
});

//clear cookie and return to main page
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  return res.redirect('/urls');
});

//register
app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render('registerShow', templateVars);
});


