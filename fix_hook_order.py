import re

with open("src/components/dashboard/AbsentListPopup.tsx", "r") as f:
    content = f.read()

# Fix hook order
old_hooks = '''    if (!mounted) return null;
    const router = useRouter();'''
new_hooks = '''    const router = useRouter();
    if (!mounted) return null;'''

content = content.replace(old_hooks, new_hooks)

with open("src/components/dashboard/AbsentListPopup.tsx", "w") as f:
    f.write(content)

print("Hooks order fixed!")
