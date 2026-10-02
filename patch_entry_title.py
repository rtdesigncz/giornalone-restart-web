import re

with open("src/components/agenda/EntryDrawer.tsx", "r") as f:
    content = f.read()

# Update title logic
old_title = r'\{isDuplicate \? "Duplica Appuntamento" : \(allowSectionChange && isNew\) \? "Riprogramma Appuntamento" : isNew \? "Nuovo Inserimento" : "Modifica Appuntamento"\}'
new_title = r'{isDuplicate ? "Duplica Appuntamento" : (allowSectionChange && !isNew) ? "Sposta Appuntamento" : (allowSectionChange && isNew) ? "Riprogramma Appuntamento" : isNew ? "Nuovo Inserimento" : "Modifica Appuntamento"}'
content = content.replace(old_title, new_title)

# Update select placeholder
old_placeholder = r'placeholder="-- Scegli dove duplicare --"'
new_placeholder = r'placeholder={isDuplicate ? "-- Scegli dove duplicare --" : "-- Scegli nuova sezione --"}'
content = content.replace(old_placeholder, new_placeholder)

with open("src/components/agenda/EntryDrawer.tsx", "w") as f:
    f.write(content)
print("Title patched!")
