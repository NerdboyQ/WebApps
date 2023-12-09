import os, subprocess

print("checking dependencies...")
requirements = {'Flask==3.0.0', 'Flask-SQLAlchemy==3.1.1', 'openpyxl==3.1.2', 'pandas==2.1.0', 'selenium==4.12.0'}

proc = subprocess.Popen(['pip', 'freeze'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
out, err = proc.communicate()
installs = out.decode('utf-8').split("\n")[:-1]
installs = set(map(lambda x: x.strip(), installs)) 
missing = requirements - installs

for m in missing:
    os.system(f"python -m pip install {m}")

print("completed dependency check")