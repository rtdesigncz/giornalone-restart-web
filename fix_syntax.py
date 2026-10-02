import re

with open("src/components/medical/AppointmentTable.tsx", "r") as f:
    content = f.read()

content = content.replace(r'const \[appointments, setAppointments\] = useState<Record<string, any>>\(\{\}\); // Map slot -> appointment', 'const [appointments, setAppointments] = useState<Record<string, any>>({}); // Map slot -> appointment')

with open("src/components/medical/AppointmentTable.tsx", "w") as f:
    f.write(content)

print("Syntax fixed!")
