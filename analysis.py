import subprocess
import time

def setup_tmux_session():
    """ Set up the tmux session according to the Makefile script """
    try:
        # Kill existing session (if any)
        subprocess.run(['tmux', 'kill-session', '-t', 'mpc-test'], check=False)

        # Start new tmux session
        subprocess.run(['tmux', 'new-session', '-d', '-s', 'mpc-test', 'NODE_NO_WARNINGS=1 node server.js; read'], check=True)
        subprocess.run(['tmux', 'split-window', '-h', '-t', 'mpc-test', 'sleep 0.1 && node analyst.js; read'], check=True)
        subprocess.run(['tmux', 'split-window', '-v', '-t', 'mpc-test'], check=True)
        subprocess.run(['tmux', 'select-pane', '-t', '0'], check=True)
        subprocess.run(['tmux', 'rotate-window', '-t', 'mpc-test'], check=True)
        subprocess.run(['tmux', 'rotate-window', '-t', 'mpc-test'], check=True)
        subprocess.run(['tmux', 'attach-session', '-d', '-t', 'mpc-test'], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while setting up tmux session: {e}")
        exit(1)

def run_input_script():
    """ Run the commands in the third terminal and time their execution """
    input_script = """
    node input-party.js input david@brown.edu 1
    node input-party.js input henry@brown.edu 2
    node input-party.js input weili@brown.edu 3
    node input-party.js input delete1@brown.edu 4
    node input-party.js input delete2@brown.edu 5
    node input-party.js input haha@brown.edu 6
    node input-party.js delete delete1@brown.edu
    node input-party.js delete delete2@brown.edu
    """

    start_time = time.time()
    subprocess.run(['tmux', 'send-keys', '-t', 'mpc-test:2', input_script, 'C-m'], check=True)
    end_time = time.time()

    return end_time - start_time

def main():
    setup_tmux_session()
    execution_time = run_input_script()
    print(f"Input script execution time: {execution_time} seconds")

if __name__ == "__main__":
    main()