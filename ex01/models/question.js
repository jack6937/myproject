const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: true},
  content: {type: String, trim: true, required: true},
  location: {type: String, trim: true, required: true},
  start: {type: String, trim: true, required: true},
  finish: {type: String, trim: true, required: true},
  host: {type: String, trim: true, required: true},
  hostcontent: {type: String, trim: true, required: true},
  charge: {type: Boolean, default: 0},
  price:{type: Number, default: 0},
  tags: [String],
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now},
  sort:{type:String , default:" X "},
  field:{type:String , default:" X "},
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Question = mongoose.model('Question', schema);

module.exports = Question;
