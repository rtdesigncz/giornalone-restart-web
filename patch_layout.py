import re

with open("src/app/layout.tsx", "r") as f:
    content = f.read()

# Add import
content = content.replace(
    'import MainLayout from "@/components/layout/MainLayout";',
    'import MainLayout from "@/components/layout/MainLayout";\nimport { ThemeProvider } from "@/components/ThemeProvider";'
)

# Add html suppression and ThemeProvider wrapper
old_html = r'<html lang="it" className={`\$\{outfit\.variable\}`\}>'
new_html = r'<html lang="it" suppressHydrationWarning className={`${outfit.variable}`}>'
content = re.sub(old_html, new_html, content)

old_body = r'<body className="font-sans antialiased min-h-screen bg-\[\#fbfbfb\]">'
new_body = r'<body className="font-sans antialiased min-h-screen bg-background text-foreground">'
content = re.sub(old_body, new_body, content)

old_main = r'<MainLayout>\{children\}</MainLayout>'
new_main = r'''<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>'''
content = content.replace('<MainLayout>{children}</MainLayout>', new_main)

with open("src/app/layout.tsx", "w") as f:
    f.write(content)

print("layout.tsx patched")
