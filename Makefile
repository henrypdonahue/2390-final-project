run:
	tmux new-session -d -s mysession 'node server.js; read'
	tmux split-window -v 'node analyst.js; read'
	tmux split-window -h
	tmux select-pane -t 0
	tmux attach-session -d -t mysession