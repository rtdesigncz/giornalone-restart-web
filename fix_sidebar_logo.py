import re

with open("src/components/layout/Sidebar.tsx", "r") as f:
    content = f.read()

old_logo = r'<div className="flex items-center w-full justify-start py-2">\s*<div className="flex items-center w-full justify-start py-2">\s*<img src="/app-logo\.png" alt="Restart" className="h-10 w-auto object-contain" />\s*<\/div>\s*<\/div>'
new_logo = '<div className="flex items-center w-full justify-start py-2">\n                            <img src="/app-logo.png" alt="Restart" className="h-10 w-auto object-contain" />\n                        </div>'

content = re.sub(old_logo, new_logo, content)

with open("src/components/layout/Sidebar.tsx", "w") as f:
    f.write(content)
