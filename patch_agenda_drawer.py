import re

with open("src/components/agenda/AgendaTable.tsx", "r") as f:
    content = f.read()

end_hook = r'''            <AbsentPopup
                isOpen=\{absentPopup\.open\}
                onClose=\{\(\) => setAbsentPopup\(\{ open: false, entry: null \}\)\}
                entry=\{absentPopup\.entry\}
                onConfirm=\{confirmAbsent\}
            \/\>
        \<\/div\>
    \)\;
\}'''

new_end = '''            <AbsentPopup
                isOpen={absentPopup.open}
                onClose={() => setAbsentPopup({ open: false, entry: null })}
                entry={absentPopup.entry}
                onConfirm={confirmAbsent}
            />
            
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

content = re.sub(end_hook, new_end, content)

with open("src/components/agenda/AgendaTable.tsx", "w") as f:
    f.write(content)

print("AgendaTable drawer properly injected")
