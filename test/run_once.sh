#!/bin/bash

export NODE_NO_WARNINGS=1

input_cnt=$1
delete_cnt=$2

# check input_cnt and delete_cnt are provided
if [ -z "$input_cnt" ] || [ -z "$delete_cnt" ]; then
  echo "Error: Please provide input_cnt and delete_cnt as arguments."
  echo "Usage: ./test.sh input_cnt delete_cnt"
  exit 1
fi

# check if input_cnt and delete_cnt are valid positive integers
if ! [[ "$input_cnt" =~ ^[0-9]+$ ]] || ! [[ "$delete_cnt" =~ ^[0-9]+$ ]]; then
  echo "Error: input_cnt and delete_cnt must be positive integers."
  echo "Usage: ./test.sh input_cnt delete_cnt"
  exit 1
fi

node server.js 2>&1 > /dev/null &
# wait for server initialize
sleep 1
# wait for analyst initialize
{ sleep 1 && test/input.sh $input_cnt $delete_cnt && echo -e '\n' && printf "begin time: %s\n" $(date +%s) > .tmp.time; } | node analyst.js &
wait $!
printf "end time: %s\n" $(date +%s) >> .tmp.time
