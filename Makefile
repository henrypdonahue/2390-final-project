run:
	@NODE_NO_WARNINGS=1 tmux new-session -d -s mpc-test 'node server.js; read' \; \
	split-window -h 'sleep 0.1 && node analyst.js; read' \; \
	split-window -v \; \
	select-pane -t 0 \; \
	rotate-window\; \
	rotate-window\; \
	attach-session -d -t mpc-test

clean:
	tmux kill-session -t mpc-test