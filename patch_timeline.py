import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Add Imports
if 'import ClientTimelineDrawer' not in content:
    content = content.replace(
        'import ConsulenzeReportModal from "./ConsulenzeReportModal";',
        'import ConsulenzeReportModal from "./ConsulenzeReportModal";\nimport ClientTimelineDrawer from "@/components/ui/ClientTimelineDrawer";'
    )
    # Add Clock to lucide-react if not there, wait I'll just check if Clock is there, if not add it.
    if 'Clock' not in content:
        content = content.replace('PieChart } from "lucide-react";', 'PieChart, Clock } from "lucide-react";')

# Add State
state_hook = r'  const \[reportOpen, setReportOpen\] = useState\(false\);'
if 'timelineOpen' not in content:
    content = re.sub(state_hook, state_hook.replace('\\', '') + '\n    const [timelineOpen, setTimelineOpen] = useState(false);\n    const [timelinePhone, setTimelinePhone] = useState<string | null>(null);\n    const [timelineName, setTimelineName] = useState<string | null>(null);', content)

# Modify the desktop name display
old_desktop_name = r'''<div className="font-bold text-slate-800 text-sm">\{cleanName\(r\.cognome\)\} \{cleanName\(r\.nome\)\}</div>'''
new_desktop_name = '''<div className="flex items-center gap-2 group/timeline">
                                                                        <div className="font-bold text-slate-800 text-sm group-hover/timeline:text-brand transition-colors cursor-pointer" onClick={() => { setTimelinePhone(r.telefono); setTimelineName(`${cleanName(r.cognome)} ${cleanName(r.nome)}`); setTimelineOpen(true); }}>
                                                                            {cleanName(r.cognome)} {cleanName(r.nome)}
                                                                        </div>
                                                                        <button onClick={() => { setTimelinePhone(r.telefono); setTimelineName(`${cleanName(r.cognome)} ${cleanName(r.nome)}`); setTimelineOpen(true); }} className="opacity-0 group-hover/timeline:opacity-100 transition-opacity p-1 bg-brand/10 text-brand rounded-full hover:bg-brand hover:text-white" title="Vedi Storico">
                                                                            <Clock className="w-3 h-3" />
                                                                        </button>
                                                                    </div>'''
content = re.sub(old_desktop_name, new_desktop_name, content)

# Modify the mobile name display
old_mobile_name = r'''<div className="font-bold text-slate-900">\{cleanName\(r\.cognome\)\} \{cleanName\(r\.nome\)\}</div>'''
new_mobile_name = '''<div className="flex items-center justify-between w-full">
                                                                <div className="font-bold text-slate-900">{cleanName(r.cognome)} {cleanName(r.nome)}</div>
                                                                <button onClick={() => { setTimelinePhone(r.telefono); setTimelineName(`${cleanName(r.cognome)} ${cleanName(r.nome)}`); setTimelineOpen(true); }} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-brand hover:text-white" title="Vedi Storico">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>'''
content = re.sub(old_mobile_name, new_mobile_name, content)


# Add the drawer component at the end near ACTION MODALS
modal_target = r'{/* ACTION MODALS */}'
new_modal = '''{/* ACTION MODALS */}
            <ClientTimelineDrawer 
                isOpen={timelineOpen} 
                onClose={() => setTimelineOpen(false)} 
                phone={timelinePhone} 
                name={timelineName} 
            />'''

if 'ClientTimelineDrawer isOpen' not in content:
    content = content.replace(modal_target, new_modal)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("Timeline patched")
