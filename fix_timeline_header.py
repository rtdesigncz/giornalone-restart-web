import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

# Update the Header block
old_header = r'''                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Calendar size=\{12\} className="text-slate-400" \/>
                          \{formatDate\(ev\.entry_date\)\} \{ev\.entry_time \? `• \$\{ev\.entry_time\.slice\(0, 5\)\}` : ""\}
                        \<\/span\>
                        <span className=\{`text-\[10px\] font-bold uppercase tracking-wider px-2 py-0\.5 rounded-md \$\{colorClass\.replace\('bg-', 'bg-opacity-30 bg-'\)\.replace\('border-', 'border-'\)\}`\}>
                          \{statusText\}
                        \<\/span\>
                      \<\/div\>'''

new_header = '''                      <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-2 bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                            <Calendar size={12} className="text-slate-400" />
                            {formatDate(ev.entry_date)} {ev.entry_time ? `• ${ev.entry_time.slice(0, 5)}` : ""}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${colorClass.replace('bg-', 'bg-opacity-30 bg-').replace('border-', 'border-')}`}>
                            {statusText}
                          </span>
                        </div>
                        {ev.consulente_name && (
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                            <Users size={11} className="text-slate-400 shrink-0" />
                            Consulente: <span className="uppercase text-slate-700 tracking-wider font-bold">{ev.consulente_name}</span>
                          </div>
                        )}
                      </div>'''
content = re.sub(old_header, new_header, content)

# Remove it from the body block
old_body = r'''                        <div className="flex flex-col gap-1\.5 border-b border-slate-50/50 pb-2">
                          <div className="flex items-center gap-2">
                            <ArrowRight size=\{14\} className="text-brand shrink-0" \/>
                            <span className="text-\[11px\] font-bold text-slate-700 uppercase tracking-wider leading-snug">\{ev\.section\}\<\/span\>
                          \<\/div\>
                          \{ev\.consulente_name && \(
                            <div className="flex items-center gap-1\.5 text-\[11px\] font-bold text-slate-500 pl-\[22px\]">
                              <Users size=\{12\} className="shrink-0" \/>
                              <span className="uppercase tracking-wider text-slate-600">\{ev\.consulente_name\}\<\/span\>
                            \<\/div\>
                          \)\}
                        \<\/div\>'''

new_body = '''                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <ArrowRight size={14} className="text-brand shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-snug">{ev.section}</span>
                        </div>'''
content = re.sub(old_body, new_body, content)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Timeline header fixed")
