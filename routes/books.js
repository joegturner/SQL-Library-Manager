const express = require('express');
const router = express.Router();
const db = require('../db');
const { Book } = db.models;
const { Op } = require('sequelize');

/* Global Variables */
// allows user to return to search results or certain page
// when returning from /books/id page
let listingPage = '/books';

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}
/* returns book listing pagination values */
function getPages(length, queryPage) {
  const totalBooks = length;
  const booksPerPage = 10;
  const totalPages = Math.ceil(length / booksPerPage);
  let currentPage;
  !queryPage ? currentPage = 1 : currentPage = parseInt(queryPage);
  const first = (currentPage - 1) * booksPerPage;
  const calcLast = currentPage * booksPerPage - 1;
  let last;
  calcLast <= length ? last = calcLast : last = length - 1;

  const bookPages = {
    booksPerPage,
    totalBooks,
    totalPages,
    currentPage,
    first,
    last,
  };

  return bookPages;
}

/* GET books listing */
router.get('/', asyncHandler(async (req, res) => {
  
  // store current URL - allows return from /books/id
  listingPage = req.originalUrl;

  // store search term. Display search term if not undefined
  let search;
  typeof req.query.search != "undefined" ? search = req.query.search : search = "";
  
  // read from database based on search parameters
  let books;
  if (!search) {
    books = await Book.findAll();
  } else {
    books = await Book.findAll({
      where: {
        [Op.or]: [
          { 
            title: {
            [Op.substring]: req.query.search
            }
          },
          { 
            author: {
            [Op.substring]: req.query.search
            }
          },
          { 
            genre: {
            [Op.substring]: req.query.search
            }
          },
          { 
            year: {
            [Op.substring]: req.query.search
            }
          }
        ]
      }
    });
  }

  // assemble book listing pagination values
  const bookPages = getPages(books.length, req.query.page);

  res.render("books/index", { 
    books, 
    title: "Books", 
    bookPages,
    search,
   });
}));

/* Clear search */
router.get('/reset', (req, res) => {
  redirect('/books');
});

/* Server Error handler */
router.get('/error', (req, res) => {
  const error = new Error('error');
  error.status = 500;
  error.message = "Sorry! There was an unexpected error on the server.";
  
  console.error(`An error occured: ${error.message}`);
  console.error(`Error status: ${error.status}`)
  res.render("books/page-not-found", {error, title: "Server Error"});
});

/* New book form */
router.get('/new', (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
});

/* POST new book form */
router.post('/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books/" + book.id);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render("books/new-book", { book, errors: error.errors, title: "New Book"});
    } else {
      throw error;
    }
  }
}));

/* GET individual book info */
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);

  if (book) {
    res.render("books/update", { book, listingPage, title: "Edit Book" });
  } else {
    res.redirect("/books/error");
  }
}));

/* POST edit book form */
router.post('/:id', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect("/books/" + book.id);
    } else {
      res.redirect("/books/error");
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render("books/update", { book, errors: error.errors, title: "Edit book"});
    } else {
      throw error;
    }
  }
}));

/* GET delete book form */
router.get('/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render("books/delete", { book, title: "Delete Book"});
  } else {
    res.redirect("/books/error");
  }
}));

/* POST delete book form */
router.post('/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    res.redirect("/books/error");
  }
}));


module.exports = router;