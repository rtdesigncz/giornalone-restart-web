import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Add imports
if 'import ClientTimelineDrawer' not in content:
    content = content.replace(
        'import { cn } from "@/lib/utils";',
        'import { cn } from "@/lib/utils";\nimport ClientTimelineDrawer from "@/components/ui/ClientTimelineDrawer";\nimport { Clock } from "lucide-react";'
    )

# Add State
state_hook = r'    const \[source, setSource\] = useState<any\[\]>\(\[\]\);'
if 'timelineOpen' not in content:
    content = re.sub(state_hook, state_hook.replace('\\', '') + '\n    const [timelineOpen, setTimelineOpen] = useState(false);\n    const [timelinePhone, setTimelinePhone] = useState<string | null>(null);\n    const [timelineName, setTimelineName] = useState<string | null>(null);', content)

# Modify name display
old_name = r'''<div className="font-bold text-slate-800">\{row\.cognome\} \{row\.nome\}</div>'''
new_name = '''<div className="flex items-center gap-2 group/timeline">
                                                        <div className="font-bold text-slate-800 group-hover/timeline:text-brand transition-colors cursor-pointer" onClick={() => { setTimelinePhone(row.telefono); setTimelineName(`${row.cognome || ""} ${row.nome || ""}`); setTimelineOpen(true); }}>
                                                            {row.cognome} {row.nome}
                                                        </div>
                                                        <button onClick={() => { setTimelinePhone(row.telefono); setTimelineName(`${row.cognome || ""} ${row.nome || ""}`); setTimelineOpen(true); }} className="opacity-0 group-hover/timeline:opacity-100 transition-opacity p-1 bg-brand/10 text-brand rounded-full hover:bg-brand hover:text-white" title="Vedi Storico">
                                                            <Clock className="w-3 h-3" />
                                                        </button>
                                                    </div>'''
content = re.sub(old_name, new_name, content)

# Add modal at the end
modal_target = r'</div\>\n        </div\>\n    \);\n\}'
new_modal = '''    {/* TIMELINE MODAL */}
            <ClientTimelineDrawer 
                isOpen={timelineOpen} 
                onClose={() => setTimelineOpen(false)} 
                phone={timelinePhone} 
                name={timelineName} 
            />
        </div>
    );
}'''

if 'ClientTimelineDrawer isOpen' not in content:
    content = re.sub(modal_target, new_modal, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Reportistica Timeline patched")
