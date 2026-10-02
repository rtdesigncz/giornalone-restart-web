import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Replace preso with appuntamentiDaFare in the return object of kpi useMemo
old_return = r'return \{ totale, contattati, preso, fatte, daFare, esiti, nuoviAbb \};'
new_return = 'return { totale, contattati, appuntamentiDaFare, fatte, daFare, esiti, nuoviAbb };'
content = re.sub(old_return, new_return, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Return statement fixed!")
