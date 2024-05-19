const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {

  return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {

  return users.some(user => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  if (!username || !password) {
    return res.status(404).json({ message: "Error in login" });
  }
  
  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,
      username,
    };

    return res.status(200).send("Login successful");
  } else {
    return res.status(208).json({ message: "Ivalid username or password" });
  }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const username = req.session.authorization && req.session.authorization.username;
  const isbn = req.params.isbn;
  const review = req.body.review;

  if (!username) {
    return res.status(403).json({ message: "No user logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} is not found` });
  }

  let book = books[isbn];

  if (!book.reviews) {
    book.reviews = {};
  }

  book.reviews[username] = review;
  return res.status(200).send(`Review for the book with ISBN ${isbn} is updated by user ${username}`);
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const username = req.session.authorization && req.session.authorization.username;
  const isbn = req.params.isbn;

  if (!username) {
    return res.status(403).json({ message: "No user logged in" });
  }

  if (!books[isbn] || !books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: `Review by user ${username} for book with ISBN ${isbn} not found` });
  }

  delete books[isbn].reviews[username];
  return res.status(200).send(`Review for the book with ISBN ${isbn} by user ${username} is now deleted`);
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
