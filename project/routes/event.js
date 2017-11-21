  const express = require('express');
const Events = require('../models/event');

const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');

const router = express.Router();

// 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

/* GET events listing. */
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {content: {'$regex': term, '$options': 'i'}},
      {location: {'$regex': term, '$options': 'i'}},
      {start: {'$regex': term, '$options': 'i'}},
      {finish: {'$regex': term, '$options': 'i'}},
      {host: {'$regex': term, '$options': 'i'}},
      {hostcontent: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const events = await Events.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('events/index', {events: events, query: req.query});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('events/new', {event: {}});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const event = await Events.findById(req.params.id);
  res.render('events/edit', {event: event});
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const event = await Events.findById(req.params.id).populate('author');
  const answers = await Answer.find({event: event.id}).populate('author');
  event.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???
  await event.save();
  res.render('events/show', {event: event, answers: answers});
}));

router.put('/:id', catchErrors(async (req, res, next) => {
  const event = await Events.findById(req.params.id);

  if (!event) {
    req.flash('danger', 'Not exist event');
    return res.redirect('back');
  }
  event.title = req.body.title;
  event.content = req.body.content;
  event.location = req.body.location;
  event.start = req.body.start;
  event.finish = req.body.finish;
  event.host = req.body.host;
  event.hostcontent = req.body.hostcontent;
  event.tags = req.body.tags.split(" ").map(e => e.trim());

  await event.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/events');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Events.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/events');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  var event = new Events({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    location: req.body.location,
    start: req.body.start,
    finish: req.body.finish,
    host: req.body.host,
    hostcontent: req.body.hostcontent,
    tags: req.body.tags.split(" ").map(e => e.trim()),
  });
  await event.save();
  req.flash('success', 'Successfully posted');
  res.redirect('/events');
}));

router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  const event = await Events.findById(req.params.id);

  if (!event) {
    req.flash('danger', 'Not exist event');
    return res.redirect('back');
  }

  var answer = new Answer({
    author: user._id,
    event: event._id,
    content: req.body.content,
    location: req.body.location,
    start: req.body.start,
    finish: req.body.finish,
    host: req.body.host,
    hostcontent: req.body.hostcontent
  });
  await answer.save();
  event.numAnswers++;
  await event.save();

  req.flash('success', 'Successfully answered');
  res.redirect(`/events/${req.params.id}`);
}));



module.exports = router;