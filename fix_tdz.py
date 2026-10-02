import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# We need to find the highlight useEffect block and move it below the `const [items, setItems] = useState<Item[]>([]);`
# The block is:
effect_block = r"""    useEffect\(\) => \{
        if \(highlightId && items\.length > 0\) \{
            setTimeout\(\(\) => \{
                const el = document\.getElementById\(`row-\$\{highlightId\}`\);
                if \(el\) \{
                    el\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\);
                    setFlashId\(highlightId\);
                    setTimeout\(\(\) => setFlashId\(null\), 3000\);
                \}
            \}, 300\);
        \}
    \}, \[highlightId, items\]\);\n"""

# Actually, it's easier to just do text manipulation:
lines = content.split('\n')
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "highlightId && items.length > 0" in lines[i+1]:
        start_idx = i
    if start_idx != -1 and "}, [highlightId, items]);" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    block = lines[start_idx:end_idx+1]
    # Remove it
    del lines[start_idx:end_idx+1]
    
    # Find where items is declared
    items_idx = -1
    for i, line in enumerate(lines):
        if "const [items, setItems] = useState" in line:
            items_idx = i
            break
            
    # Insert right after items
    for j, b in enumerate(block):
        lines.insert(items_idx + 1 + j, b)

    with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
        f.write('\n'.join(lines))
    print("Fixed TDZ in ConsulenzeClientV2!")
else:
    print("Could not find the useEffect block.")
