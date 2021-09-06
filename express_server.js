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
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userId: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userId: "user2RandomID"}
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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
    return res.status(400).send('Something went wrong,\n invalid email or password')
  };
  if (checkRegistry(req.body)) {
    return res.status(400).send('Something went wrong,\n email already exists')
  }
  
  const randoID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  users[randoID] = {
    id: randoID,
    email: email,
    password: password,
  }
  // console.log('register page',users);
  res.cookie("user_id", randoID)
  res.redirect("/urls");
});

//  login page
app.get("/login", (req, res) => {
  const templateVars = {
    user: req.cookies["userId"],
  };
  res.render("urls_login", templateVars);
});

//  login button on header
app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Something went wrong,\n invalid email or password')
  };
  if (!checkRegistry(req.body)) {
    return res.status(400).send('Something went wrong,\n email already exists')
  }
  
  const randoID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  users[randoID] = {
    id: randoID,
    email: email,
    password: password,
  }
  // console.log('register page',users);
  res.cookie("user_id", randoID)
  res.redirect("/urls");
})

//  urls main page showing urlDatabase contents
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  // console.log('after redirect', users)
  res.render("urls_index", templateVars);
});

//  logout button on header
app.post("/logout", (req, res) => {
  // console.log('before clear', users)

  res.clearCookie("user_id");
  // console.log('after clear', users)
  res.redirect("/urls");
})

app.post("urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
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
    user: users[req.cookies["user_id"]],
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
    user: users[req.cookies["user_id"]],
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

//  check if the user already exists in registry; input is email, output is false or user
const checkRegistry = (body) => {
  for (const user in users) {
    // console.log(users[user].email);
    if (users[user].email === body.email) {
      return users[user].id;
    }
  }
  return false;

}
