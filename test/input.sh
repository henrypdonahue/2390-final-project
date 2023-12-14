#!/bin/bash

input_cnt=$1
delete_cnt=$2

command_array=()
input_emails=()
input_nums=()

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

# generate a random email
generate_random_email() {
  email=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 8 | head -n 1)@brown.edu
  echo "$email"
}


# generate $input_cnt number of random inputs
for ((i=1; i<=$input_cnt; i++)); do
  email=$(generate_random_email)
  input_emails+=("$email")
  command="node input-party.js input $email $i"
  command_array+=("$command")
  input_nums+=("$i")
done

# generate $delete_cnt number of random delete commands
for ((i=1; i<=$delete_cnt; i++)); do
  if [ "${#input_emails[@]}" -eq 0 ]; then
    echo "No more input emails to delete."
    break
  fi

  # randomly select an email from the input_emails array
  index=$(( RANDOM % ${#input_emails[@]} ))
  email=${input_emails[$index]}
  # set corresponding input number to 0 to mark as deleted
  input_nums[$index]=0
  # store generated command
  command="node input-party.js delete $email"
  command_array+=("$command")
done

# execute input/delete command and check its exit code
execute_command() {
  local command="$1"
  eval "$command" > /dev/null
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "Command '$command' failed with exit code $exit_code."
  fi
}

# execute each input/delete command
for command in "${command_array[@]}"; do
  execute_command "$command"
done

# calculate sum
sum=0
for num in "${input_nums[@]}"; do
  sum=$((sum + num))
done

printf "Expected sum is: %d\n" $sum
