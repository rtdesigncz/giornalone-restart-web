import os

files = [
    "src/components/agenda/AgendaTable.tsx",
    "src/components/agenda/AgendaMobileList.tsx",
    "src/components/medical/AppointmentTable.tsx",
    "src/components/medical/WaitingList.tsx"
]

for file in files:
    with open(file, "r") as f:
        lines = f.read().split('\n')
        
    effect_idx = -1
    deps_var = ""
    for i, line in enumerate(lines):
        if "useEffect(() => {" in line and "highlightId &&" in lines[i+1]:
            effect_idx = i
            if "rows.length" in lines[i+1]: deps_var = "rows"
            if "appointments.length" in lines[i+1]: deps_var = "appointments"
            if "waitingList.length" in lines[i+1]: deps_var = "waitingList"
            break
            
    if effect_idx != -1 and deps_var:
        var_idx = -1
        for i, line in enumerate(lines):
            if f"const [{deps_var}" in line:
                var_idx = i
                break
        
        if effect_idx < var_idx:
            print(f"TDZ BUG in {file}: effect at {effect_idx}, var at {var_idx}")
        else:
            print(f"OK in {file}: var at {var_idx}, effect at {effect_idx}")
