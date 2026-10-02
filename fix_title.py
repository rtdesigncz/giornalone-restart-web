import re

with open("src/components/agenda/EntryDrawer.tsx", "r") as f:
    content = f.read()

old_title = r'\{isDuplicate \? "Duplica Appuntamento" : isNew \? "Nuovo Inserimento" : "Modifica Appuntamento"\}'
new_title = '{isDuplicate ? "Duplica Appuntamento" : (allowSectionChange && isNew) ? "Riprogramma Appuntamento" : isNew ? "Nuovo Inserimento" : "Modifica Appuntamento"}'

content = re.sub(old_title, new_title, content)

with open("src/components/agenda/EntryDrawer.tsx", "w") as f:
    f.write(content)

print("Title updated!")
