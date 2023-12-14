#!/bin/bash

export NODE_NO_WARNINGS=1
node server.js &
# wait for server initialize
sleep 1
# wait for analyst initialize
(sleep 1 && test/input.sh 10 2 1>&2 && echo -e '\n') | node analyst.js
end_time=$(date +%s)
runtime=$((end_time - begin_time))
echo "Begin time: $begin_time"
echo "End time: $end_time"
echo "Runtime: $runtime seconds"