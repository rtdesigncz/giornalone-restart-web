with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace("  if (!isOpen) return null;\n\n  const [mounted, setMounted]", "  const [mounted, setMounted]")

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Hooks fixed")
