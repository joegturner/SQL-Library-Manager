var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var booksRouter = require('./routes/books');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', indexRouter);
app.use('/books', booksRouter);

// 404 error handler
app.use(function(req, res, next) {
  const error = new Error('error');
  error.status = 404;
  error.message = "Sorry! We couldn't find the page you were looking for.";
  
  console.error(`An error occured: ${error.message}`);
  console.error(`Error status: ${error.status}`);
  res.render("books/page-not-found", {error, title: "Page Not Found"})
});

module.exports = app;
