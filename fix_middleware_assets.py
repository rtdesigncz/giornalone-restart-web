import re

with open("middleware.ts", "r") as f:
    content = f.read()

old_if = r'''  if \(
    pathname === "/login" \|\|
    pathname\.startsWith\("/_next"\) \|\|
    pathname\.startsWith\("/api"\) \|\|
    pathname === "/favicon\.ico"
  \) \{'''

new_if = '''  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".json") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon")
  ) {'''

content = re.sub(old_if, new_if, content)

with open("middleware.ts", "w") as f:
    f.write(content)

print("Middleware fixed for assets")
