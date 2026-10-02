import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

old_block = r'''    // --- LOOK-BEHIND LOGIC \(RECUPERATI\) ---[\s\S]*?    if \(format === "json"\) \{'''

new_block = '''    // --- LOOK-AHEAD LOGIC (RECUPERATI) ---
    // A "Recuperato" badge is placed on the *original* unsold appointment (e.g. Tour Spontaneo)
    // if the same person (by phone) subsequently bought in a later appointment.
    const unsoldPhones = [...new Set(normalized.filter(r => !r.venduto && r.telefono && r.telefono.length > 5).map(r => r.telefono))];

    if (unsoldPhones.length > 0) {
      // Fetch any sold entry for these phones
      const { data: futureSoldEntries, error: futureError } = await supabase
        .from("entries")
        .select("telefono, entry_date")
        .in("telefono", unsoldPhones)
        .eq("venduto", true);

      if (!futureError && futureSoldEntries && futureSoldEntries.length > 0) {
        // Map phone -> array of sold dates
        const soldDatesByPhone: Record<string, string[]> = {};
        futureSoldEntries.forEach((entry: any) => {
          if (!soldDatesByPhone[entry.telefono]) soldDatesByPhone[entry.telefono] = [];
          soldDatesByPhone[entry.telefono].push(entry.entry_date);
        });

        // Tag the original unsold rows
        normalized.forEach(row => {
          if (row.venduto || !row.telefono || !soldDatesByPhone[row.telefono]) return;
          
          const soldDates = soldDatesByPhone[row.telefono];
          // Check if there is a sold appointment ON OR AFTER this row's date
          const hasFutureSale = soldDates.some(soldDate => soldDate >= row.entry_date);
          
          if (hasFutureSale) {
            row.isRecuperato = true;
          }
        });
      }
    }

    if (format === "json") {'''

content = re.sub(old_block, new_block, content)

with open("src/app/api/report/route.ts", "w") as f:
    f.write(content)

print("Lookahead logic applied")
