# Benchmarking

- `input.sh` randomly generates input and deletion commands.
   usage: `input.sh ${input_cnt} ${delete_cnt}`
- `run_once.sh` runs one round of mpc with randomly generated inputs and deletion commands.
   usage: `run_once.sh ${input_cnt} ${delete_cnt}`
- `run.sh` runs `run_once` for each input_cnt and delete_cnt specified in the arrays `input_cnt_array` and `delete_cnt_array`, and outputs the results into `benchmark_results.csv`
