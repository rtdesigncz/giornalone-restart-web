import re

with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

# Add safety checks for new Date(dateParam)
old_date_1 = r'new Date\(dateParam\)\.toLocaleDateString\("it-IT", \{ weekday: "long" \}\)'
new_date_1 = r'(isNaN(new Date(dateParam).getTime()) ? "Data Invalida" : new Date(dateParam).toLocaleDateString("it-IT", { weekday: "long" }))'
content = content.replace(old_date_1, new_date_1)

old_date_2 = r'new Date\(dateParam\)\.toLocaleDateString\("it-IT", \{ day: "numeric", month: "long" \}\)'
new_date_2 = r'(isNaN(new Date(dateParam).getTime()) ? dateParam : new Date(dateParam).toLocaleDateString("it-IT", { day: "numeric", month: "long" }))'
content = content.replace(old_date_2, new_date_2)

old_date_3 = r'''const d = new Date\(dateParam\);
                                            const day = d\.getDay\(\);'''
new_date_3 = '''const d = new Date(dateParam);
                                            if (isNaN(d.getTime())) return dateParam;
                                            const day = d.getDay();'''
content = re.sub(old_date_3, new_date_3, content)

# Check the button arrows
old_date_4 = r'''const d = new Date\(dateParam\);
                                d\.setDate\(d\.getDate\(\) - \(viewMode === "calendar" \? 7 : 1\)\);'''
new_date_4 = '''const d = new Date(dateParam);
                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() - (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }'''
content = re.sub(old_date_4, new_date_4, content)

old_date_5 = r'''const d = new Date\(dateParam\);
                                d\.setDate\(d\.getDate\(\) \+ \(viewMode === "calendar" \? 7 : 1\)\);'''
new_date_5 = '''const d = new Date(dateParam);
                                if (!isNaN(d.getTime())) {
                                    d.setDate(d.getDate() + (viewMode === "calendar" ? 7 : 1));
                                    const newDate = d.toISOString().slice(0, 10);
                                    router.push(`/agenda?section=${encodeURIComponent(activeTab)}&date=${newDate}`);
                                }'''
content = re.sub(old_date_5, new_date_5, content)


# Also in AgendaTable.tsx? dateParam is used as a string.

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)

print("AgendaView date checking patched!")
