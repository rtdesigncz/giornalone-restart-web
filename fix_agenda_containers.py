import re

# 1. Remove the wrapper from AgendaView
with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

old_wrapper = r'<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">\s*(\{viewMode === "list" \? \([\s\S]*?\) : \([\s\S]*?\)\})\s*<\/div>'
new_wrapper = r'<div className="flex-1 overflow-auto relative">\n                \1\n            </div>'
content = re.sub(old_wrapper, new_wrapper, content)

# Remove the "flex flex-col h-full bg-slate-50/50 relative" wrapper from mobile if needed (not strictly necessary but keeps it clean)

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)

# 2. Add the wrapper back to AgendaTable
with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    table_content = f.read()

old_table_wrapper = r'<div className="w-full">'
new_table_wrapper = '<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative w-full">'
table_content = re.sub(old_table_wrapper, new_table_wrapper, table_content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(table_content)

# 3. Add the wrapper back to AgendaCalendar
with open("src/components/agenda/AgendaCalendar.tsx", "r") as f:
    calendar_content = f.read()

old_cal_wrapper = r'<div className="flex flex-col h-full bg-white min-h-\[600px\]">'
new_cal_wrapper = '<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative flex flex-col h-full min-h-[600px]">'
calendar_content = re.sub(old_cal_wrapper, new_cal_wrapper, calendar_content)

with open("src/components/agenda/AgendaCalendar.tsx", "w") as f:
    f.write(calendar_content)

print("Agenda containers updated!")
