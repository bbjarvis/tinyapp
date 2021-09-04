// loading express, renaming tha "app", naming port
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

//  tell the Express app to use EJS as it's templateing engine
app.set("view engine", "ejs");
//  body-parser library to convert request body from buffer to string
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
const { compile } = require('ejs');
app.use(cookieParser());

//  object urlDatabase for the initial URLs
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", username: "Brett"},
  "9sm5xK": {longURL: "http://www.google.com", username: "Noah"}
};
//  basic homepage to check that things are working correctly
app.get("/", (req, res) => {
  res.send("Hello!");
});

//  page to show JSON string of entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//  hello page with html code, "World" is bold
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//  urls main page showing urlDatabase contents
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase    
  };

  res.render("urls_index", templateVars);
});

//  login button on header
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("urls");
})

//  logout button on header
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

//  registration page
app.get("/registration", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase    
  };

  res.render("urls_registration", templateVars);
});

app.post("urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
  const redirect = urlDatabase[req.params.shortURL];
  res.redirect(redirect.longURL);
})

//  handle longURL edits without changing the shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: newLongURL };
  res.redirect(`/urls`)
})

//  define route to handle POST request, create new shot-longURL key-value in urlDatabase
app.post("/urls", (req,res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body.longURL};
  res.redirect(`/urls/${shortURL}`)
});

//  GET route to render urls_new.ejs template to present form to user
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  }
  res.render("urls_new", templateVars);
});


//  POST route to remove a URL resource if 'delete' button is pushed
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})

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
    username: req.cookies["username"],
    urls: urlDatabase,
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
    randoString += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return randoString;
}
