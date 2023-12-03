run:
	@NODE_NO_WARNINGS=1 tmux new-session -d -s mysession 'node server.js; read' \; \
	split-window -v 'node analyst.js; read' \; \
	split-window -h \; \
	select-pane -t 0 \; \
	attach-session -d -t mysession