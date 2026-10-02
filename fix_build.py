import re

with open("next.config.js", "r") as f:
    content = f.read()

content = re.sub(r'  eslint: \{[\s\S]*?\},', '', content)

with open("next.config.js", "w") as f:
    f.write(content)

with open("src/app/api/search/route.ts", "r") as f:
    route = f.read()
route = route.replace("const results = [];", "const results: any[] = [];")
route = route.replace("a.consulenti?.name", "(a.consulenti as any)?.name")
route = route.replace("a.gestioni?.created_at", "(a.gestioni as any)?.created_at")
route = route.replace("b.gestioni?.created_at", "(b.gestioni as any)?.created_at")
route = route.replace("c.gestioni?.nome", "(c.gestioni as any)?.nome")
route = route.replace("m.medical_sessions?.date", "(m.medical_sessions as any)?.date")
with open("src/app/api/search/route.ts", "w") as f:
    f.write(route)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    rep = f.read()
rep = rep.replace("r.isRecuperato", "(r as any).isRecuperato")
rep = rep.replace("row.isRecuperato", "(row as any).isRecuperato")
with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(rep)

with open("src/components/agenda/EntryDrawer.tsx", "r") as f:
    drawer = f.read()
drawer = drawer.replace('size="sm"', '')
with open("src/components/agenda/EntryDrawer.tsx", "w") as f:
    f.write(drawer)

print("Build configs and TS errors patched!")
