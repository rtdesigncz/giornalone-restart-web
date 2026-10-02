import re

def fix_tdz(filepath, state_var, length_check, new_length_check):
    with open(filepath, "r") as f:
        lines = f.read().split('\n')

    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if "useEffect(() => {" in line and "highlightId &&" in lines[i+1]:
            start_idx = i
        if start_idx != -1 and ("}, [highlightId" in line or "}, [ highlightId" in line):
            end_idx = i
            break

    if start_idx != -1 and end_idx != -1:
        block = lines[start_idx:end_idx+1]
        del lines[start_idx:end_idx+1]
        
        # Modify the block's length check
        for j, b in enumerate(block):
            if length_check in b:
                block[j] = b.replace(length_check, new_length_check)
        
        items_idx = -1
        for i, line in enumerate(lines):
            if f"const [{state_var}" in line:
                items_idx = i
                break
                
        if items_idx != -1:
            for j, b in enumerate(block):
                lines.insert(items_idx + 1 + j, b)

            with open(filepath, "w") as f:
                f.write('\n'.join(lines))
            print(f"Fixed {filepath}")
        else:
            print(f"Could not find {state_var} in {filepath}")
    else:
        print(f"Could not find useEffect in {filepath}")

fix_tdz("src/components/medical/AppointmentTable.tsx", "appointments", "appointments.length > 0", "Object.keys(appointments).length > 0")
fix_tdz("src/components/medical/WaitingList.tsx", "items", "waitingList.length > 0", "items.length > 0")

