#!/bin/bash

input_cnt_array=(10 20 30 40 50)
delete_cnt_array=(2 4 6 8 10)

run_benchmark() {
  input_cnt=$1
  delete_cnt=$2

  # run the benchmark and redirect the output to a temporary file
  test/run_once.sh $input_cnt $delete_cnt 2>&1 > /dev/null
  
  # extract the begin_time and end_time from the temporary file
  begin_time=$(awk '/begin time:/{print $NF}' .tmp.time)
  end_time=$(awk '/end time:/{print $NF}' .tmp.time)
  
  runtime=$(echo "$end_time - $begin_time" | bc)
  
  echo "$input_cnt,$delete_cnt,$runtime" >> benchmark_results.csv
}

echo "input_cnt,delete_cnt,time" > benchmark_results.csv

for input_cnt in "${input_cnt_array[@]}"; do
  for delete_cnt in "${delete_cnt_array[@]}"; do
    run_benchmark $input_cnt $delete_cnt
  done
done

rm -f .tmp.time


