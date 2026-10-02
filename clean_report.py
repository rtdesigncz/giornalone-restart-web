import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

# Remove phonesToCheck array building since we don't need it
old_phones = r'''    // Identify "Recuperati": Venduti who had a PREVIOUS appointment in the system
    const phonesToCheck = normalized\.filter\(r => r\.venduto && r\.telefono\)\.map\(r => r\.telefono\);

    if \(phonesToCheck\.length > 0\) \{
      // Fetch ALL past entries for these phones
      // Nuova logica Recuperati: Venduto == true && Section == "MISS CON APPUNTAMENTO"
      normalized\.forEach\(row => \{
        if \(row\.venduto && row\.section === "MISS CON APPUNTAMENTO"\) \{
          row\.isRecuperato = true;
        \}
      \}\);
    \}'''

new_phones = '''    // Nuova logica Recuperati: Venduto == true && Section == "MISS CON APPUNTAMENTO"
    normalized.forEach(row => {
      if (row.venduto && row.section === "MISS CON APPUNTAMENTO") {
        row.isRecuperato = true;
      }
    });'''

content = re.sub(old_phones, new_phones, content)

with open("src/app/api/report/route.ts", "w") as f:
    f.write(content)

print("cleaned up report api")
