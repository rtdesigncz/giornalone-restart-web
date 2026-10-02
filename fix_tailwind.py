import re

with open("tailwind.config.js", "r") as f:
    content = f.read()

# Replace the sans font family
old_sans = r'sans: \["Outfit", "Inter", "var\(--font-inter\)", "system-ui", "-apple-system", "sans-serif"\],'
new_sans = 'sans: ["var(--font-outfit)", "Outfit", "Inter", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],'
content = re.sub(old_sans, new_sans, content)

with open("tailwind.config.js", "w") as f:
    f.write(content)

print("tailwind.config.js updated!")
