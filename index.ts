/// <reference path="tsdef/node.d.ts" />
/// <reference path="tsdef/express.d.ts" />
/// <reference path="tsdef/mongoose.d.ts" />

import express = require("express");
import mongoose = require("mongoose");
var	stylus = require("stylus"),
	nib = require("nib")

//beginregion Ugly setup stuff
var app = express();
var compile = function (str, path) {
	return stylus(str)
		.set('filename', path)
		.use(nib());
};

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(stylus.middleware(
	{ 
		src: __dirname + '/public', 
		compile: compile
  	}
));
app.configure(function() {
	app.use(express.static('public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(app.router);
});
//endregion

var voterCache = {};

app.get("/", function (request, response) {
	if (voterCache[request.ip] === undefined) {
		voterCache[request.ip] = {};
	}

	var questions = [];
	Question.find(function (err, q) {
		for (var question in q) {
			var newQuestion:any = {};
			newQuestion.text = q[question].text;
			newQuestion.votes = q[question].votes;

			if (voterCache[request.ip][q[question]._id] === undefined) {
				voterCache[request.ip][q[question]._id] = false;
			}
			newQuestion.upVote = voterCache[request.ip][q[question]._id];
			newQuestion.id = q[question]._id;

			questions.push(newQuestion);
		}
		questions.sort(function (q1, q2) { return q2.votes - q1.votes; } );
		response.render("index", { "questions": questions });
	});
});

app.post("/submitvote", function (request, response) {
	if (voterCache[request.ip][request.body["question"]] === undefined) {
		response.end("failed");
		return;
	}
	var currentVote = voterCache[request.ip][request.body["question"]];
	voterCache[request.ip][request.body["question"]] = !currentVote;

	Question.findById(request.body["question"], function (err, obj) {
		if (obj != null) {
			if (currentVote == false) obj.votes++;
			else obj.votes--;
			obj.save(function () {
				response.end("success");
			});
		}
		else response.end("success");
	});
});

app.post("/submitvotes", function (request, response) {
	console.log(request.body);
	var count = 0; for (var q in request.body) count++;
	for (var question in request.body) {
		if (request.body[question] === "true") {
			Question.findById(question, function (err, obj) {
				if (obj !== null) {
					obj.votes++;
					obj.save(function (err, obj) {
						count--;
						if (count === 0) response.end("success");
					});
				} else {
					count--;
					if (count === 0) response.end("success");
				}
			});
		} else count--;
	}
	if (count === 0) response.end("success");
});

mongoose.connect("mongodb://localhost:27017");
var db = mongoose.connection;
db.once("open",function(){
	console.log("Connected to db");
});

var Question = mongoose.model("Question",  new mongoose.Schema({
	text: String,
	votes: Number
}));


app.listen(8442);