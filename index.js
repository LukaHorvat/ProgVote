/// <reference path="tsdef/node.d.ts" />
/// <reference path="tsdef/express.d.ts" />
/// <reference path="tsdef/mongoose.d.ts" />
var express = require("express");
var mongoose = require("mongoose");
var stylus = require("stylus"), nib = require("nib");

//beginregion Ugly setup stuff
var app = express();
var compile = function (str, path) {
    return stylus(str).set('filename', path).use(nib());
};

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: compile
}));
app.configure(function () {
    app.use(express.static('public'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(app.router);
});

//endregion
app.get("/", function (request, response) {
    Question.find(function (err, q) {
        q.sort(function (q1, q2) {
            return q2.votes - q1.votes;
        });
        response.render("index", { questions: q });
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

app.post("/submitvotes", function (request, response) {
    console.log(request.body);
    var count = 0;
    for (var q in request.body)
        count++;
    for (var question in request.body) {
        if (request.body[question] === "true") {
            Question.findById(question, function (err, obj) {
                if (obj !== null) {
                    obj.votes++;
                    obj.save(function (err, obj) {
                        count--;
                        if (count === 0)
                            response.end("success");
                    });
                } else {
                    count--;
                    if (count === 0)
                        response.end("success");
                }
            });
        } else
            count--;
    }
    if (count === 0)
        response.end("success");
});

mongoose.connect("mongodb://localhost:27017");
var db = mongoose.connection;
db.once("open", function () {
    console.log("Connected to db");
});

var Question = mongoose.model("Question", new mongoose.Schema({
    text: String,
    votes: Number
}));

app.listen(8442);

