with open("src/app/login/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'router.push("/");\n      router.refresh();',
    'window.location.href = "/";'
)

with open("src/app/login/page.tsx", "w") as f:
    f.write(content)

print("Login redirect fixed")
