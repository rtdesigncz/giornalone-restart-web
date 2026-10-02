import re

with open("src/app/globals.css", "r") as f:
    content = f.read()

rule = """
@layer base {
  /* Forza il maiuscolo su tutti gli input per pulizia visiva */
  input[type="text"], input:not([type]), textarea {
    text-transform: uppercase;
  }
"""

content = content.replace("@layer base {\n  :root {", rule + "\n  :root {")

with open("src/app/globals.css", "w") as f:
    f.write(content)
print("CSS updated!")
