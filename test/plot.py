import pandas as pd
import matplotlib.pyplot as plt

# Read data from benchmark_slow.csv
df_slow = pd.read_csv('benchmark_results_slow.csv')
input_cnt_slow = df_slow['input_cnt']
delete_cnt_slow = df_slow['delete_cnt']
time_slow = df_slow['time']

# Read data from benchmark_fast.csv
df_fast = pd.read_csv('benchmark_results_fast.csv')
input_cnt_fast = df_fast['input_cnt']
delete_cnt_fast = df_fast['delete_cnt']
time_fast = df_fast['time']

# Plotting
plt.plot(delete_cnt_fast, time_slow, marker='o', label='Slow', color='red')
plt.plot(delete_cnt_slow, time_fast, marker='o', label='Fast', color='blue')
plt.xlabel('Delete Count')
plt.ylabel('Time [s]')
plt.title('Time for different deletion count and fixed input count of 50')
plt.legend()
plt.grid(True)
plt.show()