import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

# Replace .saas-panel
old_saas_panel = r'\.saas-panel \{[\s\S]*?\}'
new_saas_panel = """.saas-panel {
    @apply bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200;
  }"""
content = re.sub(old_saas_panel, new_saas_panel, content)

old_saas_panel_hover = r'\.saas-panel-hover \{[\s\S]*?\}'
new_saas_panel_hover = """.saas-panel-hover {
    @apply hover:border-slate-300 hover:shadow-md;
  }"""
content = re.sub(old_saas_panel_hover, new_saas_panel_hover, content)

# Change background color in body
old_body = r'body \{[\s\S]*?\}'
new_body = """body {
  @apply bg-[#fafafa] text-slate-900;
}"""
content = re.sub(old_body, new_body, content)

with open("src/app/globals.css", "w") as f:
    f.write(content)

print("CSS updated!")
