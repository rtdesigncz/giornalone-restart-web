import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# 1. Update the Modal Label
content = content.replace(
    '<label className="text-xs font-bold text-slate-700 uppercase">Nuovo Abbonamento</label>',
    '<label className="text-xs font-bold text-slate-700 uppercase">Nuovo Abbonamento <span className="text-red-500">*</span></label>'
)

content = content.replace(
    'placeholder="— Seleziona Abbonamento —"',
    'placeholder="— Seleziona Abbonamento (Obbligatorio) —"'
)

# 2. Update Inline Edit select
old_inline = r'<select className="input-sm w-full text-xs" value=\{r\.nuovo_abbonamento_name \|\| ""\} onChange=\{e => setItems\(it => it\.map\(x => x\.id === r\.id \? \{ \.\.\.x, nuovo_abbonamento_name: e\.target\.value \} : x\)\)\}>\n\s*<option value="">— Nuovo Abb —</option>'
new_inline = r'<select className={cn("input-sm w-full text-xs", !r.nuovo_abbonamento_name && "border-red-400 bg-red-50")} value={r.nuovo_abbonamento_name || ""} onChange={e => setItems(it => it.map(x => x.id === r.id ? { ...x, nuovo_abbonamento_name: e.target.value } : x))}>\n                                                                            <option value="">— Nuovo Abb (Obbligatorio) —</option>'
content = re.sub(old_inline, new_inline, content)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)
print("Consulenze UI validation added!")
