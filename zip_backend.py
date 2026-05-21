import os
import zipfile

def create_zip():
    zip_path = 'aniverse-backend-latest.zip'
    backend_dir = 'backend'
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    print(f"Creating {zip_path}...")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(backend_dir):
            if '__pycache__' in root or '.pytest_cache' in root:
                continue
                
            for file in files:
                if file.endswith('.pyc'):
                    continue
                    
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, backend_dir)
                zipf.write(file_path, arcname)
                print(f"Added: {arcname}")

    print(f"Successfully created {zip_path}")

if __name__ == '__main__':
    create_zip()
