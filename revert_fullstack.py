import os
import shutil
import glob

def revert_to_clientside():
    print("Reverting to Client-Side Admin state...")
    
    # 1. Move HTML files from templates/ to root
    if os.path.exists("templates"):
        # Handle admin templates specifically?
        # In clientside version, admin.html was in root.
        # But in Flask version, we had templates/admin/dashboard.html etc.
        # We should restore the root admin.html if possible, or we might need to recreate it.
        
        # Move all html files up
        for root, dirs, files in os.walk("templates"):
            for file in files:
                if file.endswith(".html"):
                    src = os.path.join(root, file)
                    # If it's a file like templates/admin/dashboard.html, we might not want it in root as dashboard.html
                    # But the User wants the previous state.
                    # Previous state had 'admin.html' in root.
                    # The Flask setup had templates/admin/login.html etc.
                    # We should probably ignore templates/admin/* for the move if we are going to restore admin.html separately.
                    
                    if "admin" in root:
                        continue 
                        
                    dst = os.path.join(".", file)
                    shutil.move(src, dst)
        
        # Now remove templates dir
        shutil.rmtree("templates")
            
    # 2. Move Assets from static/assets to root
    if os.path.exists("static/assets"):
        print("Moving assets back to root...")
        if os.path.exists("assets"):
            shutil.rmtree("assets") # Clear if exists
        shutil.move("static/assets", "assets")
        
    if os.path.exists("static"):
        shutil.rmtree("static")
            
    # 3. Fix paths in HTML files ( /static/assets/ -> assets/ )
    print("Restoring resource links in HTML files...")
    html_files = glob.glob("*.html")
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content = content.replace('src="/static/assets/', 'src="assets/')
        new_content = new_content.replace('href="/static/assets/', 'href="assets/')
        
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)

    # 4. Cleanup Backend Files
    backend_files = [
        "app.py", "models.py", "init_db.py", "init_db_v2.py", 
        "digiflow_v2.db", "etrade.db", "convert_structure.py"
    ]
    for f in backend_files:
        if os.path.exists(f):
            os.remove(f)
            
    if os.path.exists("__pycache__"):
        shutil.rmtree("__pycache__")
        
    if os.path.exists("migrations"):
        shutil.rmtree("migrations")

    print("Reversion to static structure complete.")

if __name__ == "__main__":
    revert_to_clientside()
