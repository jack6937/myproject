const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');
const Join = require('../models/join');
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

function validateForm(form, options) {
  var title = form.title || "";
  var content = form.content || "";
  var location = form.location || "";
  var start = form.start || "";
  var finish = form.finish || "";
  var host = form.host || "";
  var maximum = form.maximum || "";
  var hostcontent = form.hostcontent || "";
  title = title.trim();
  content = content.trim();
  location = location.trim();

  host = host.trim();
  hostcontent = hostcontent.trim();

  if (!title) {
    return '이벤트 제목은 필수입력사항입니다.';
  }

  if (!content) {
    return '이벤트 내용은 필수입력사항입니다.';
  }
  
  if (!maximum) {
    return '참가인원은 필수입력사항입니다.';
  }

  if (!location) {
    return '장소는 필수입력사항입니다..';
  }

  if (!start) {
    return '시작시간은 필수입력사항입니다.';
  }
  
  if (!finish) {
    return '종료시간은 필수입력사항입니다.';
  }

  if (!host) {
    return '등록조직 이름은 필수입력사항입니다.';
  }

  if (!hostcontent) {
    return '등록조직 설명은 필수입력사항입니다.';
  }
  return null;
}
/* GET questions listing. */
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {content: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const questions = await Question.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('questions/index', {questions: questions, term: term, query: req.query});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('questions/new', {question: {}});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  res.render('questions/edit', {question: question});
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id).populate('author');
  const answers = await Answer.find({question: question.id}).populate('author');
  question.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???

  await question.save();
  res.render('questions/show', {question: question, answers: answers});
}));

router.put('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  var err = validateForm(req.body);
  if (!question) {
    req.flash('danger', 'Not exist question');
    return res.redirect('back');
  }
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  question.title = req.body.title;
  question.content = req.body.content;
  question.sort = req.body.sort;
  question.field = req.body.field;
  question.location = req.body.location;
  question.start = req.body.start;
  question.finish = req.body.finish;
  question.host = req.body.host;
  question.maximum =req.body.maximum;
  question.price =req.body.price;
  question.hostcontent = req.body.hostcontent;
  question.tags = req.body.tags.split(" ").map(e => e.trim());

  await question.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/questions');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Question.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/questions');
}));


router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  var err = validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var question = new Question({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    sort: req.body.sort,
    field: req.body.field,
    location: req.body.location,
    start: req.body.start,
    finish: req.body.finish,
    host: req.body.host,
    price: req.body.price,
    hostcontent: req.body.hostcontent,
    maximum: req.body.maximum,
    tags: req.body.tags.split(" ").map(e => e.trim()),
  });
  await question.save();
  req.flash('success', 'Successfully posted');
  res.redirect('/questions');
}));

router.post('/:id/join', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  const question = await Question.findById(req.params.id);

  if (!question) {
    req.flash('danger', 'Not exist question');
    return res.redirect('back');
  }
  var finduser = await Join.findOne({author: req.user._id, question: question._id});//??
  if (!finduser){//추가
    if(question.maximum>question.numParticipate){
      var join = new Join({
        author: user._id,
        question: question._id
      }); 
      await join.save();
      question.numParticipate++;
      req.flash('success', '참가 신청 완료');
    }else{
      req.flash('danger', '참가 인원 초과');
    }
    await question.save();
  }else{
      req.flash('danger', '이미 신청되었습니다');
  }
  res.redirect('back');
}));

router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  const question = await Question.findById(req.params.id);

  if (!question) {
    req.flash('danger', 'Not exist event');
    return res.redirect('back');
  }

  var answer = new Answer({
    author: user._id,
    question: question._id,
    content: req.body.content
  });
  await answer.save();
  question.numAnswers++;
  await question.save();

  req.flash('success', 'Successfully answered');
  res.redirect(`/questions/${req.params.id}`);
}));




module.exports = router;
