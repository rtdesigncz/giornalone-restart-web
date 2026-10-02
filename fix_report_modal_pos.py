import re

with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

# Remove it from DropdownFilter
bad_injection = r'''            \{\/\* TIMELINE MODAL \*\/\}
            <ClientTimelineDrawer 
                isOpen=\{timelineOpen\} 
                onClose=\{\(\) => setTimelineOpen\(false\)\} 
                phone=\{timelinePhone\} 
                name=\{timelineName\} 
            \/\>
        \<\/div\>
    \)\;
\}

\/\/ \-\-\- MAIN COMPONENT \-\-\-'''

good_dropdown = '''        </div>
    );
}

// --- MAIN COMPONENT ---'''

content = re.sub(bad_injection, good_dropdown, content)

# Add it to the end of ReportisticaClientV2
end_of_file = r'''                    \{\/\* FOOTER \*\/\}
                    <div className="border-t border-slate-100 bg-slate-50\/50 px-6 py-3 text-xs text-slate-500 flex justify-between items-center"\>
                        <span\>Mostrando <b\>\{filteredRows\.length\}\<\/b\> risultati\<\/span\>
                        <span\>Totale nel periodo: <b\>\{resp\?\.rows\.length \|\| 0\}\<\/b\>\<\/span\>
                    \<\/div\>
                \<\/div\>
            \<\/div\>
        \<\/div\>
    \)\;
\}'''

good_end = '''                    {/* FOOTER */}
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
                        <span>Mostrando <b>{filteredRows.length}</b> risultati</span>
                        <span>Totale nel periodo: <b>{resp?.rows.length || 0}</b></span>
                    </div>
                </div>
            </div>
            
            {/* TIMELINE MODAL */}
            <ClientTimelineDrawer 
                isOpen={timelineOpen} 
                onClose={() => setTimelineOpen(false)} 
                phone={timelinePhone} 
                name={timelineName} 
            />
        </div>
    );
}'''

content = re.sub(end_of_file, good_end, content)

with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
    f.write(content)

print("Modal position fixed")
