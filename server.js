var http = require('http');
var fs = require('fs');
var url = require('url');

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('quiz.sqlite3');

var server = http.Server();
server.listen(1337, '127.0.0.1');

var html = fs.readFileSync('./index.html');
var js = fs.readFileSync('./app.js');

server.on('request', function(request, response){
	var urlData = url.parse(request.url);
	if(urlData && urlData.path == '/'){
		response.end(html);
	} else if(urlData && urlData.path == '/app.js'){
		response.end(js);
	} else {
		response.statusCode = 404;
		response.end("Not Found");
	}
});

var question = {};
var index = 0;
var current_answer = '';

db.get("SELECT * FROM questions ORDER BY RANDOM()", function(err, row){
	question = row;
	current_answer = Array(question.answer.length+1).join('*');
	index = Math.floor(Math.random() * (current_answer.length));
});

var io = require('socket.io').listen(2337);
var answer_interval;
io.sockets.on('connection', function (socket) {
	socket.emit('question', {question: question.question+' '+current_answer+' ('+current_answer.length+' букв)' });

	socket.on('nickname', function(data){
		socket.set('nickname', data.nickname, function () {
			socket.broadcast.emit('user connected', { nickname: data.nickname });
    	});
	});

	socket.on('answer', function(data) {
		socket.get('nickname', function (err, name) {
			socket.broadcast.emit('user answer', { nickname: name, answer: data.answer });
			if(data.answer == question.answer) {
				io.sockets.emit('question_succeeded', {answer: question.answer, nickname: name, question: question.question});
				db.get("SELECT * FROM questions WHERE id != ? ORDER BY RANDOM()", question.id, function(err, row){
					question = row;
					current_answer = Array(question.answer.length+1).join('*');
					index = Math.floor(Math.random() * (current_answer.length));
				});
			}
		});
	})

	socket.on('disconnect', function () {
		socket.get('nickname', function (err, name) {
			io.sockets.emit('user disconnected', { nickname: name });
		});
	});
});

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

var answer_interval = setInterval(function(){
	while(current_answer[index]!='*' && current_answer != question.answer){
		index = Math.floor(Math.random() * (current_answer.length));
	}
	current_answer = setCharAt(current_answer, index, question.answer[index]);
	if(current_answer == question.answer) {
		io.sockets.emit('question_failed', {answer: question.answer});
		db.get("SELECT * FROM questions WHERE id != ? ORDER BY RANDOM()", question.id, function(err, row){
			question = row;
			current_answer = Array(question.answer.length+1).join('*');
			index = Math.floor(Math.random() * (current_answer.length));
		});
	}
	else {
		io.sockets.emit('question', {question: question.question+' '+current_answer+' ('+current_answer.length+' букв)' });
	}
}, 4000);