import re

with open("src/components/agenda/AgendaCalendar.tsx", "r") as f:
    content = f.read()

old_get = r'''const getWeekRange = \(dateStr: string\) => \{
        const d = new Date\(dateStr\);
        const day = d\.getDay\(\); // 0=Sun, 1=Mon'''
new_get = '''const getWeekRange = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return [];
        const day = d.getDay(); // 0=Sun, 1=Mon'''

content = re.sub(old_get, new_get, content)

with open("src/components/agenda/AgendaCalendar.tsx", "w") as f:
    f.write(content)

print("AgendaCalendar properly patched!")
