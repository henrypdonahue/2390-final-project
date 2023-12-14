#!/bin/bash

# Run the command and capture the output
test/run_once.sh 2>&1

begin_time=$(awk '/begin time:/{print $NF}' .tmp.time)
end_time=$(awk '/end time:/{print $NF}' .tmp.time)

# Calculate the runtime in seconds
runtime=$((end_time - begin_time))

echo "Begin time: $begin_time"
echo "End time: $end_time"
echo "Runtime: $runtime seconds"