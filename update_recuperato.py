import re

filepath = "src/app/api/report/route.ts"
with open(filepath, "r") as f:
    content = f.read()

# Replace the entire pastEntries lookup block
old_block = r'''      const \{ data: pastEntries, error: pastError \} = await supabase
        \.from\("entries"\)
        \.select\("telefono, entry_date"\)
        \.in\("telefono", phonesToCheck\);

      if \(!pastError && pastEntries && pastEntries\.length > 0\) \{
        // Group by phone for fast lookup
        const pastByPhone: Record<string, any\[\]> = \{\};
        pastEntries\.forEach\(\(entry: any\) => \{
          if \(!pastByPhone\[entry\.telefono\]\) pastByPhone\[entry\.telefono\] = \[\];
          pastByPhone\[entry\.telefono\]\.push\(entry\);
        \}\);

        // Flag the rows
        normalized\.forEach\(row => \{
          if \(!row\.venduto \|\| !row\.telefono \|\| !pastByPhone\[row\.telefono\]\) return;
          
          const past = pastByPhone\[row\.telefono\];
          // Check if there is any entry for this phone strictly BEFORE this row's entry_date
          const hasPrevious = past\.some\(\(p: any\) => p\.entry_date < row\.entry_date\);
          
          if \(hasPrevious\) \{
            row\.isRecuperato = true;
          \}
        \}\);
      \}'''

new_block = '''      // Nuova logica Recuperati: Venduto == true && Section == "MISS CON APPUNTAMENTO"
      normalized.forEach(row => {
        if (row.venduto && row.section === "MISS CON APPUNTAMENTO") {
          row.isRecuperato = true;
        }
      });'''

content = re.sub(old_block, new_block, content)

with open(filepath, "w") as f:
    f.write(content)

print("Report API updated for new Recuperato logic")
