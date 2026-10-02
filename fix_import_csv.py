import re

with open("src/app/consulenze/ImportCsvModal.tsx", "r") as f:
    content = f.read()

# Replace splitCsvLine implementation with a safer one
old_split = r'function splitCsvLine.*?return out\.map\(\(s\) => s\.trim\(\)\);\n\}'
new_split = """function splitCsvLine(line: string, delim: string): string[] {
  // Simple regex-based split that respects quotes (basic version)
  // Or just a simple split for the preview to avoid Next.js block scope bugs
  let out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim().replace(/^"|"$/g, ''));
}"""

content = re.sub(old_split, new_split, content, flags=re.DOTALL)

with open("src/app/consulenze/ImportCsvModal.tsx", "w") as f:
    f.write(content)

print("ImportCsvModal fixed!")
