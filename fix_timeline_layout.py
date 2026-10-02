import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

# Add Users icon
if 'Users' not in content:
    content = content.replace('ArrowRight } from "lucide-react";', 'ArrowRight, Users } from "lucide-react";')

# Update layout
old_layout = r'''                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight size=\{14\} className="text-brand" \/>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">\{ev\.section\}\<\/span\>
                          \<\/div\>
                          \{ev\.consulente_name && \(
                            <span className="text-\[10px\] font-bold text-slate-500 bg-slate-100 px-2 py-0\.5 rounded-full uppercase truncate max-w-\[120px\]">
                              \{ev\.consulente_name\}
                            \<\/span\>
                          \)\}
                        \<\/div\>'''

new_layout = '''                        <div className="flex flex-col gap-1.5 border-b border-slate-50/50 pb-2">
                          <div className="flex items-center gap-2">
                            <ArrowRight size={14} className="text-brand shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-snug">{ev.section}</span>
                          </div>
                          {ev.consulente_name && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 pl-[22px]">
                              <Users size={12} className="shrink-0" />
                              <span className="uppercase tracking-wider text-slate-600">{ev.consulente_name}</span>
                            </div>
                          )}
                        </div>'''

content = re.sub(old_layout, new_layout, content)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Layout updated")
