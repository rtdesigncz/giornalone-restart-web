import re

with open("src/components/agenda/AgendaCalendar.tsx", "r") as f:
    content = f.read()

old_get_week = r'''const getWeekDays = \(dateStr: string\) => \{
        const d = new Date\(dateStr\);
        const day = d\.getDay\(\);'''
new_get_week = '''const getWeekDays = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return [];
        const day = d.getDay();'''

content = re.sub(old_get_week, new_get_week, content)

with open("src/components/agenda/AgendaCalendar.tsx", "w") as f:
    f.write(content)

print("AgendaCalendar patched!")
