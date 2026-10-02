import re

with open("src/components/agenda/EntryDrawer.tsx", "r") as f:
    content = f.read()

# Modify initial state of targetSection to be empty if it's a duplicate
# We can do this in the component body
old_state = r'const \[targetSection, setTargetSection\] = useState\(section \|\| initialData\?\.section \|\| "APPUNTAMENTI \(Pianificazione\)"\);'
new_state = 'const [targetSection, setTargetSection] = useState(isDuplicate ? "" : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)"));'
content = re.sub(old_state, new_state, content)

# Also fix the useEffect that resets it
old_effect_reset = r'setTargetSection\(section \|\| initialData\?\.section \|\| "APPUNTAMENTI \(Pianificazione\)"\);'
new_effect_reset = 'setTargetSection(isDuplicate ? "" : (section || initialData?.section || "APPUNTAMENTI (Pianificazione)"));'
content = re.sub(old_effect_reset, new_effect_reset, content)

# In handleSave, we check if effectiveSection is empty
old_save = r'const effectiveSection = \(isDuplicate \|\| allowSectionChange\) \? targetSection : section;'
new_save = """const effectiveSection = (isDuplicate || allowSectionChange) ? targetSection : section;
        
        if (isDuplicate && !effectiveSection) {
            alert("Seleziona obbligatoriamente la sezione in cui duplicare l'appuntamento.");
            setLoading(false);
            return;
        }"""
content = re.sub(old_save, new_save, content)

# Now, add the UI for the section selector!
# We find: {/* Form Main Body */} \n <div className="...">
# And we insert the selector right after it if isDuplicate or allowSectionChange is true.

old_body = r'\{/\* Form Main Body \*/\}\s*<div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">'
new_body = """{/* Form Main Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
                    
                    {isDuplicate && (
                        <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100 mb-4">
                            <label className="block text-xs font-bold text-cyan-800 mb-2 uppercase tracking-wide">Sezione di destinazione *</label>
                            <CustomSelect 
                                options={DB_SECTIONS.map(s => ({ value: s, label: getSectionLabel(s) }))}
                                value={targetSection}
                                onChange={(val) => setTargetSection(val)}
                                placeholder="-- Scegli dove duplicare --"
                            />
                        </div>
                    )}
"""
content = re.sub(old_body, new_body, content)

with open("src/components/agenda/EntryDrawer.tsx", "w") as f:
    f.write(content)

print("EntryDrawer updated with section selector!")
