const express = require('express');//dependancy
const app = express();//create server
const PORT = 8080;//default port 8080

app.set("view engine", "ejs");//set view engine

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

//will create a 6 char id for short url
const generateRandomString = () => {
  const characters = '1234567890abcdefghijklmnopqrstuvwxyz'
  const charsLength = characters.length;
  let output = '';

app.post("/urls", (req, res) => {
  console.log(req.body); //log the POST request body to the console
  res.send("Ok"); //respond with 'Ok' (we will replace this)
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//add routes
app.use(express.urlencoded({ extended: true }));//the body-parser library will convert the request body from a Buffer into string that we can read

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urlsIndex", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  res.render("urlsNew");
});

app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render('urlsShow', templateVars);
});

//
