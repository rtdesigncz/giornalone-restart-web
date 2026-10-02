import re

with open("src/components/agenda/EntryDrawer.tsx", "r") as f:
    content = f.read()

# 1. Update the condition to show the selector
old_ui = r'\{isDuplicate && \('
new_ui = '{(isDuplicate || allowSectionChange) && ('
content = re.sub(old_ui, new_ui, content)

# 2. Update the validation logic
old_val = r'if \(isDuplicate && !effectiveSection\) \{\n\s*alert\("Seleziona obbligatoriamente la sezione in cui duplicare l\'appuntamento\."\);\n\s*setLoading\(false\);\n\s*return;\n\s*\}'
new_val = """if ((isDuplicate || allowSectionChange) && !effectiveSection) {
            alert("Seleziona obbligatoriamente la sezione di destinazione.");
            setLoading(false);
            return;
        }"""
content = re.sub(old_val, new_val, content)

with open("src/components/agenda/EntryDrawer.tsx", "w") as f:
    f.write(content)

print("EntryDrawer updated for Reschedule!")
