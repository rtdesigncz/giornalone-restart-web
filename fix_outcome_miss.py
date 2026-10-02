import re

with open("src/hooks/useOutcomeManager.ts", "r") as f:
    content = f.read()

# Inside confirmMiss, we add `section: "MISS CON APPUNTAMENTO",`
old_code = r'setRescheduleEntryData\(\{\n\s*\.\.\.reschedulePopup\.entry,\n\s*id: "new", // Treat as new entry'
new_code = 'setRescheduleEntryData({\n                ...reschedulePopup.entry,\n                id: "new", // Treat as new entry\n                section: "MISS CON APPUNTAMENTO",'

content = re.sub(old_code, new_code, content)

with open("src/hooks/useOutcomeManager.ts", "w") as f:
    f.write(content)

print("useOutcomeManager updated!")
