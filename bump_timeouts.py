import re
import os

files = [
    "src/app/consulenze/ConsulenzeClientV2.tsx",
    "src/components/agenda/AgendaTable.tsx",
    "src/components/agenda/AgendaMobileList.tsx",
    "src/components/medical/AppointmentTable.tsx",
    "src/components/medical/WaitingList.tsx"
]

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    # Increase the initial timeout from 300 to 600
    content = content.replace("}, 300);", "}, 600);")
    
    with open(file, "w") as f:
        f.write(content)
print("Timeouts bumped!")
