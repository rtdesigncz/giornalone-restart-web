import re

with open("src/components/layout/MainLayout.tsx", "r") as f:
    content = f.read()

# Add a check for /login
old_return = r'''    return \(
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900"\>'''

new_return = '''    const isLogin = pathname === "/login";

    if (isLogin) {
        return <div className="min-h-screen bg-slate-50">{children}</div>;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">'''

content = re.sub(old_return, new_return, content)

with open("src/components/layout/MainLayout.tsx", "w") as f:
    f.write(content)

print("MainLayout fixed for login page")
