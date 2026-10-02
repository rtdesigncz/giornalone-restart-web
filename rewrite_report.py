import re

with open("src/app/api/report/route.ts", "r") as f:
    content = f.read()

# The old logic to replace:
old_logic = r'''    if \(phonesToCheck\.length > 0\) \{
      // Nuova logica Recuperati: Venduto == true && Section == "MISS CON APPUNTAMENTO"
      normalized\.forEach\(row => \{
        if \(row\.venduto && row\.section === "MISS CON APPUNTAMENTO"\) \{
          row\.isRecuperato = true;
        \}
      \}\);
    \}'''

# Wait, in clean_report.py I removed phonesToCheck completely! Let's check what's actually there.
