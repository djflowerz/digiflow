import os
import shutil
import glob

def revert_structure():
    print("Reverting to static structure...")
    
    # 1. Move HTML files from templates/ to root
    if os.path.exists("templates"):
        html_files = glob.glob("templates/*.html")
        print(f"Moving {len(html_files)} HTML files back to root...")
        for file_path in html_files:
            # file_path is templates/foo.html, we want ./foo.html
            filename = os.path.basename(file_path)
            shutil.move(file_path, filename)
        
        # Remove templates dir
        try:
            os.rmdir("templates") # will fail if not empty (admin dir)
        except:
            shutil.rmtree("templates") # forceful removal for admin/
            
    # 2. Move Assets from static/assets to root
    if os.path.exists("static/assets"):
        print("Moving assets back to root...")
        if os.path.exists("assets"):
            shutil.rmtree("assets") # Clear if exists to avoid conflict
        shutil.move("static/assets", "assets")
        
    if os.path.exists("static"):
        try:
            os.rmdir("static")
        except:
            pass
            
    # 3. Fix paths in HTML files
    # Replace /static/assets/ with assets/
    print("Restoring resource links in HTML files...")
    html_files = glob.glob("*.html")
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content.replace('src="/static/assets/', 'src="assets/')
        new_content = new_content.replace('href="/static/assets/', 'href="assets/')
        
        # Also clean up the url_for static calls in admin templates if we moved them? 
        # But we deleted admin templates.
        
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)

    # 4. Cleanup Backend Files
    backend_files = ["app.py", "models.py", "init_db.py", "etrade.db"]
    for f in backend_files:
        if os.path.exists(f):
            os.remove(f)
            
    if os.path.exists("__pycache__"):
        shutil.rmtree("__pycache__")

    print("Reversion complete.")

if __name__ == "__main__":
    revert_structure()
