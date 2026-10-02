with open("src/components/agenda/AgendaMobileList.tsx", "r") as f:
    lines = f.read().split('\n')

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "highlightId && rows.length > 0" in lines[i+1]:
        start_idx = i
    if start_idx != -1 and "}, [highlightId, rows]);" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    block = lines[start_idx:end_idx+1]
    del lines[start_idx:end_idx+1]
    
    items_idx = -1
    for i, line in enumerate(lines):
        if "const [rows, setRows] = useState" in line:
            items_idx = i
            break
            
    for j, b in enumerate(block):
        lines.insert(items_idx + 1 + j, b)

    with open("src/components/agenda/AgendaMobileList.tsx", "w") as f:
        f.write('\n'.join(lines))
    print("Fixed TDZ in AgendaMobileList!")
