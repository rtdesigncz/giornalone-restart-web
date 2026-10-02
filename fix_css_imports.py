import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

# Remove the import line
import_line = r"@import url\('https://fonts\.googleapis\.com/css2\?family=Outfit:wght@300;400;500;600;700;800&display=swap'\);\n\n"
content = re.sub(import_line, "", content)

# Add it to the top
content = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');\n\n" + content

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("CSS imports fixed!")
