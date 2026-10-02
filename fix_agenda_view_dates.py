import re

with open("src/components/agenda/AgendaView.tsx", "r") as f:
    content = f.read()

# Fix line 69
old1 = 'new Date(dateParam).toLocaleDateString("it-IT", { weekday: "long" })'
new1 = '(isNaN(new Date(dateParam).getTime()) ? "Data Invalida" : new Date(dateParam).toLocaleDateString("it-IT", { weekday: "long" }))'
content = content.replace(old1, new1)

# Fix line 82
old2 = 'new Date(dateParam).toLocaleDateString("it-IT", { day: "numeric", month: "long" })'
new2 = '(isNaN(new Date(dateParam).getTime()) ? "Data Invalida" : new Date(dateParam).toLocaleDateString("it-IT", { day: "numeric", month: "long" }))'
content = content.replace(old2, new2)

with open("src/components/agenda/AgendaView.tsx", "w") as f:
    f.write(content)
print("AgendaView dates fixed!")
