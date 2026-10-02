with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()
content = content.replace('flashId === row.id ?', 'flashId === String(row.id) ?')
with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)

with open("src/components/agenda/AgendaMobileList.tsx", "r") as f:
    content = f.read()
content = content.replace('flashId === row.id ?', 'flashId === String(row.id) ?')
with open("src/components/agenda/AgendaMobileList.tsx", "w") as f:
    f.write(content)

with open("src/components/medical/AppointmentTable.tsx", "r") as f:
    content = f.read()
content = content.replace('flashId === app.id ?', 'flashId === String(app.id) ?')
with open("src/components/medical/AppointmentTable.tsx", "w") as f:
    f.write(content)

with open("src/components/medical/WaitingList.tsx", "r") as f:
    content = f.read()
content = content.replace('flashId === item.id ?', 'flashId === String(item.id) ?')
with open("src/components/medical/WaitingList.tsx", "w") as f:
    f.write(content)

print("Agenda types fixed!")
