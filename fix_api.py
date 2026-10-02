import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

# Replace the Lookahead logic with Lookbehind logic
lookahead_regex = r'    // --- LOOKAHEAD LOGIC ---[\s\S]*?return NextResponse\.json\('

lookbehind_logic = """    // --- LOOK-BEHIND LOGIC (RECUPERATI) ---
    // A "Recuperato" is a SOLD entry that has a previous entry (e.g. a previous Miss/Assente)
    // We look at all VENDUTI in the current dataset, and check if their phone number existed before their entry_date
    const venduti = normalized.filter(r => r.venduto && r.telefono && r.telefono.length > 5);
    const phonesToCheck = [...new Set(venduti.map(r => r.telefono))];

    if (phonesToCheck.length > 0) {
      // Fetch ALL past entries for these phones
      const { data: pastEntries, error: pastError } = await supabase
        .from("entries")
        .select("telefono, entry_date")
        .in("telefono", phonesToCheck);

      if (!pastError && pastEntries && pastEntries.length > 0) {
        // Group by phone for fast lookup
        const pastByPhone: Record<string, any[]> = {};
        pastEntries.forEach((entry: any) => {
          if (!pastByPhone[entry.telefono]) pastByPhone[entry.telefono] = [];
          pastByPhone[entry.telefono].push(entry);
        });

        // Flag the rows
        normalized.forEach(row => {
          if (!row.venduto || !row.telefono || !pastByPhone[row.telefono]) return;
          
          const past = pastByPhone[row.telefono];
          // Check if there is any entry for this phone strictly BEFORE this row's entry_date
          const hasPrevious = past.some((p: any) => p.entry_date < row.entry_date);
          
          if (hasPrevious) {
            row.isRecuperato = true;
          }
        });
      }
    }

    return NextResponse.json("""

content = re.sub(lookahead_regex, lookbehind_logic, content)

with open("src/app/api/report/route.ts", "w") as f:
    f.write(content)

print("API logic replaced!")
