import glob
import shutil

def promote_homepage():
    # 1. Overwrite index.html with index-1.html
    print("Converting index-1.html to index.html...")
    with open("index-1.html", "r", encoding="utf-8") as f_src:
        content = f_src.read()
    
    with open("index.html", "w", encoding="utf-8") as f_dst:
        f_dst.write(content)

    print("index.html updated successfully.")

    # 2. Update all links from index-1.html to index.html
    files = glob.glob("*.html")
    print(f"Updating links in {len(files)} files...")
    
    count = 0
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Replace href="index-1.html" with href="index.html"
        new_content = content.replace('href="index-1.html"', 'href="index.html"')
        
        # Also clean up the redundant menu item if it exists
        # <li><a href="index.html">Home - Electronics</a></li> (after replacement)
        # We might want to rename it to just "Home" or keep it.
        # Let's simple-replace for now to ensure functionality.
        
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f_out:
                f_out.write(new_content)
            print(f"Updated {file_path}")
            count += 1

    print(f"Finished. Modified {count} files.")

if __name__ == "__main__":
    promote_homepage()
