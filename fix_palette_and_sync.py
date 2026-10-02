import re

# 1. Update CommandPalette to include section for Agenda
with open("src/components/ui/CommandPalette.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'action = () => router.push(`/agenda?date=${r.raw.entry_date}&highlight=${r.id}`);',
    'action = () => router.push(`/agenda?section=${encodeURIComponent(r.raw.section)}&date=${r.raw.entry_date}&highlight=${r.id}`);'
)

with open("src/components/ui/CommandPalette.tsx", "w") as f:
    f.write(content)

# 2. Update ConsulenzeClientV2 to sync urlGestioneId
with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

sync_code = """    useEffect(() => {
        if (urlGestioneId) setGestioneId(urlGestioneId);
    }, [urlGestioneId]);
"""
if "if (urlGestioneId) setGestioneId(urlGestioneId);" not in content:
    content = content.replace('const [gestioneId, setGestioneId] = useState<string>("");', 'const [gestioneId, setGestioneId] = useState<string>("");\n' + sync_code)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

# 3. Update SessionManager to sync urlSession
with open("src/components/medical/SessionManager.tsx", "r") as f:
    content = f.read()

sync_code2 = """    useEffect(() => {
        if (urlSession) setSelectedSessionId(urlSession);
    }, [urlSession]);
"""
if "if (urlSession) setSelectedSessionId(urlSession);" not in content:
    content = content.replace('const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);', 'const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);\n' + sync_code2)

with open("src/components/medical/SessionManager.tsx", "w") as f:
    f.write(content)

print("URL syncing fixed!")
