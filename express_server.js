// loading express, renaming tha "app", naming port
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

//  tell the Express app to use EJS as it's templateing engine
app.set("view engine", "ejs");
//  body-parser library to convert request body from buffer to string
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const { compile } = require('ejs');

//  bcryct to hash passwords
const bcrypt = require('bcrypt');

//  cookie sessions require
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//  require helper functions:
const getUserByEmail = require('./helpers');


//  object urlDatabase for the initial URLs
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "b3xVn3": {longURL: "http://www.ashl.com", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

//  basic homepage to check that things are working correctly
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//  page to show JSON string of entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//  hello page with html code, "World" is bold
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//  registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: null,
    urls: urlDatabase
  };

  res.render("urls_registration", templateVars);
});

//  endpoint that handles the registration form data
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Something went wrong,Email or Password cannot be blank (CODE 400, BAD REQUEST)');
  }
  if (checkRegistry(req.body)) {
    return res.status(400).send('Something went wrong, email already exists (CODE 400, BAD REQUEST)');
  }
  
  const randoID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[randoID] = {
    id: randoID,
    email: email,
    password: hashedPassword,
  };
  req.session.user_id = randoID;
  res.redirect("/urls");
});

//  login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: req.session["userID"],
  };
  res.render("urls_login", templateVars);
});

//  login button on header
app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(403).send('Email or Password cannot be blank (CODE 403, FORBIDDEN)');
  }
  if (!checkRegistry(req.body)) {
    return res.status(403).send('User does not exist (CODE 403, BAD FORBIDDEN)');
  }
  if (!bcrypt.compareSync(req.body.password, users[getUserByEmail(req.body.email, users)].password)) {
    return res.status(403).send('Incorrect Password (CODE 403, BAD FORBIDDEN)');
  }
  
  const randoID = getUserByEmail(req.body.email, users);

  req.session.user_id = randoID;
  res.redirect("/urls");
});

//  urls main page showing urlDatabase contents
app.get("/urls", (req, res) => {
  //  check current user, define currentDatabase so only current user urls show
  const currentDatabase = (urlsForUser(req.session["user_id"]));
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: currentDatabase
  };
  res.render("urls_index", templateVars);
});

//  logout button on header
app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/urls");
});

app.post("urls", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
  const redirect = urlDatabase[req.params.shortURL];
  res.redirect(redirect.longURL);
});

//  handle longURL edits without changing the shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  urlDatabase[shortURL] = { longURL: newLongURL, userID: req.session["user_id"]};
  res.redirect(`/urls`);
});

//  define route to handle POST request, create new shot-longURL key-value in urlDatabase
app.post("/urls", (req,res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

//  GET route to render urls_new.ejs template to present form to user
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
    urls: urlDatabase,
  };
  res.render("urls_new", templateVars);
});

//  POST route to remove a URL resource if 'delete' button is pushed
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//  redirect to longURL when clicking on shortURL link
app.get("/u/:shortURL", (req, res) => {
  const entry = urlDatabase[req.params.shortURL];
  res.redirect(entry.longURL);
});

//  GET route to render shortURL and it's corresponding longURL from urlDatabase
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session["user_id"]],
    urls: urlDatabase,
  };
  if (!req.session.user_id) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }

  res.render("urls_show", templateVars);
});

//  message to display in terminal to show that app is on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//  generate random string of 6 alphanumeric characters
function generateRandomString() {
  let randoString = '';
  const alphabet = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  for (let i = 0; i < 6; i++) {
    randoString += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return randoString;
}

//  check if the user already exists in registry; input is email, output is true or false
const checkRegistry = (body) => {
  for (const user in users) {
    if (users[user].email === body.email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  const currentDatabase = {};
  for (const urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      currentDatabase[urls] = {'longURL': urlDatabase[urls].longURL, 'userID': urlDatabase[urls].userID};
    }
  }
  return currentDatabase;
};