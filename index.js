/// <reference path="tsdef/node.d.ts" />
/// <reference path="tsdef/express.d.ts" />
/// <reference path="tsdef/mongoose.d.ts" />
var express = require("express");
var mongoose = require("mongoose");
var stylus = require("stylus"), nib = require("nib");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//beginregion Ugly setup stuff
var app = express();
var compile = function (str, path) {
    return stylus(str).set('filename', path).use(nib());
};

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


app.use(logger('dev'));
app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: compile
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//endregion
var voterCache = {};

var getIp = function (request) {
    var ipAddr = request.headers["x-forwarded-for"];
    if (ipAddr) {
        var list = ipAddr.split(",");
        ipAddr = list[list.length - 1];
    } else {
        ipAddr = request.ip;
    }
    return ipAddr;
};

app.get("/", function (request, response) {
    var ipAddr = getIp(request);

    if (voterCache[ipAddr] === undefined) {
        voterCache[ipAddr] = {};
    }

    var questions = [];
    Question.find(function (err, q) {
        for (var question in q) {
            var newQuestion = {};
            newQuestion.text = q[question].text;
            newQuestion.votes = q[question].votes;

            if (voterCache[ipAddr][q[question]._id] === undefined) {
                voterCache[ipAddr][q[question]._id] = false;
            }
            newQuestion.upVote = voterCache[ipAddr][q[question]._id];
            newQuestion.id = q[question]._id;

            questions.push(newQuestion);
        }
        questions.sort(function (q1, q2) {
            return q2.votes - q1.votes;
        });
        response.render("index", { "questions": questions });
    });
});

app.post("/submitvote", function (request, response) {
    var ipAddr = getIp(request);

    if (voterCache[ipAddr][request.body["question"]] === undefined) {
        response.end("failed");
        return;
    }
    var currentVote = voterCache[ipAddr][request.body["question"]];
    voterCache[ipAddr][request.body["question"]] = !currentVote;

    Question.findById(request.body["question"], function (err, obj) {
        if (obj != null) {
            if (currentVote == false)
                obj.votes++;
else
                obj.votes--;
            obj.save(function () {
                response.end("success");
            });
        } else
            response.end("success");
    });
});

app.post("/submit", function (request, response) {
    console.log(request.param("question"));
    var q = new Question({
        text: request.param("question"),
        votes: 0
    });
    q.save(function (err, obj) {
        console.log("Question " + request.param("question") + " saved to db");
        response.redirect("/");
    });
});

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost:27017");
var db = mongoose.connection;
db.once("open", function () {
    console.log("Connected to db");
});

var Question = mongoose.model("Question", new mongoose.Schema({
    text: String,
    votes: Number
}));

app.listen(process.env.PORT || 8442);

