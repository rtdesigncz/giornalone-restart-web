import re

with open("src/components/medical/MedicalVisitsView.tsx", "r") as f:
    content = f.read()

# Replace <div className="space-y-6 animate-in-up">
# with <div className="flex flex-col h-screen bg-[#fafafa] text-slate-900 font-sans p-4 md:p-6 lg:p-8 animate-in-up space-y-6">
# Note: Agenda uses bg-slate-50 but we set bg-[#fafafa] globally. Let's match Agenda's exactly to be safe, or just use p-4 md:p-6 lg:p-8 space-y-6 animate-in-up

old_div = r'<div className="space-y-6 animate-in-up">'
new_div = '<div className="flex flex-col h-screen bg-[#fafafa] text-slate-900 font-sans p-4 md:p-6 lg:p-8 animate-in-up space-y-6">'

content = re.sub(old_div, new_div, content)

with open("src/components/medical/MedicalVisitsView.tsx", "w") as f:
    f.write(content)

print("MedicalVisitsView updated!")
