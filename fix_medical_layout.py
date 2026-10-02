import re

with open("src/components/medical/MedicalVisitsView.tsx", "r") as f:
    content = f.read()

# Replace <div className="glass-card relative border border-slate-200/60 bg-white/50 p-6">
# with <div className="flex-1 overflow-auto relative">

old_container = r'<div className="glass-card relative border border-slate-200/60 bg-white/50 p-6">'
new_container = '<div className="flex-1 overflow-auto relative">'

content = re.sub(old_container, new_container, content)

with open("src/components/medical/MedicalVisitsView.tsx", "w") as f:
    f.write(content)

print("MedicalVisitsView layout updated!")
