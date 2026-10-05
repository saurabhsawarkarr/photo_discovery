import sys
import subprocess
import os

def run_script(script_path, args, output_file):
    print(f"Running {script_path}...", flush=True)
    result = subprocess.run([sys.executable, script_path] + args, capture_output=True, text=True, encoding='utf-8')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result.stdout)
    if result.stderr:
        print(f"Stderr for {script_path}: {result.stderr}", flush=True)
    print(f"Finished {script_path}.", flush=True)

if __name__ == '__main__':
    run_script("src/collectors/scripts/youtube_scraper.py", ["Google Photos", "5", "50"], "youtube_results.json")
    run_script("src/collectors/scripts/reddit_scraper.py", ["Google Photos", "50"], "reddit_results.json")
