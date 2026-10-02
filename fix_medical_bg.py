import re

with open("src/components/medical/MedicalVisitsView.tsx", "r") as f:
    content = f.read()

content = content.replace('bg-[#fafafa]', 'bg-slate-50')

with open("src/components/medical/MedicalVisitsView.tsx", "w") as f:
    f.write(content)
