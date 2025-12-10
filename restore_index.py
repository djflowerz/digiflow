import shutil
import os

def restore_index():
    if os.path.exists("index-1.html"):
        print("Restoring index.html from index-1.html...")
        with open("index-1.html", "r", encoding="utf-8") as f:
            content = f.read()
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(content)
        print("index.html restored.")
    else:
        print("Error: index-1.html not found.")

if __name__ == "__main__":
    restore_index()
