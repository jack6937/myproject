var express = require('express');
var router = express.Router();
const Question = require('../models/question');
const catchErrors = require('../lib/async-error');

/* GET home page. */


router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  const find = req.query.find;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {host: {'$regex': term, '$options': 'i'}},
      {field: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const questions = await Question.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  const recentquestion = await Question.find().sort({createdAt: -1}).limit(3);
  res.render('index', {recentquestion: recentquestion, questions: questions, term: term, query: req.query});
}));

module.exports = router;
