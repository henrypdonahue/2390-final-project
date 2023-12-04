run:
	@NODE_NO_WARNINGS=1 tmux new-session -d -s mpc-test 'node server.js; read' \; \
	split-window -v 'sleep 0.1 && node analyst.js; read' \; \
	split-window -h \; \
	select-pane -t 0 \; \
	attach-session -d -t mpc-test

clean:
	tmux kill-session -t mpc-test