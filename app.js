$(document).ready(function(){
	var socket;
	var nick;
	var game_area = $('#game_area');
	$('#nickname_submit').click(function(event){
		event.preventDefault();
		nick = $('#nickname').val(); 
		if( nick.length ) {
			socket = io.connect('http://localhost:2337/');

			socket.on('connect', function() {
				game_area.append('Connected to server as ' + nick + '\r\n');
				game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				socket.emit('nickname', { nickname: nick });

				socket.on('user connected', function(data) {
					game_area.append(data.nickname + ' connected\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});

				socket.on('user answer', function(data) {
					game_area.append(data.nickname + ': ' + data.answer +'\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});

				socket.on('question_succeeded', function(data) {
					game_area.append(data.nickname + ' answered question: "' + data.question +'" with "' + data.answer + '"\r\n');
					game_area.append('This answer is correct!\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});

				socket.on('user disconnected', function(data) {
					game_area.append(data.nickname + ' disconnected\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});

				socket.on('question_failed', function(data){
					game_area.append('Right answer: ' + data.answer + '\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});

				socket.on('question', function(data){
					game_area.append('Question: ' + data.question + '\r\n');
					game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
				});
			});

			$('#nick_data').hide();
			$('#game_field').show();
		}
	});

	$('#answer_submit').click(function(event){
		event.preventDefault();
		var answer = $('#answer').val();
		$('#answer').val('');
		if( answer.length ) {
			socket.emit('answer', { answer: answer });
			game_area.append(nick + ': ' + answer + '\r\n');
			game_area.scrollTop(game_area[0].scrollHeight - game_area.height());
		}
	});
});
