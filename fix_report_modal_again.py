with open("src/app/reportistica/ReportisticaClientV2.tsx", "r") as f:
    content = f.read()

bad_modal = """            {/* TIMELINE MODAL */}
            <ClientTimelineDrawer 
                isOpen={timelineOpen} 
                onClose={() => setTimelineOpen(false)} 
                phone={timelinePhone} 
                name={timelineName} 
            />"""

# It appears twice. We want to remove the first one.
parts = content.split(bad_modal)
if len(parts) >= 3:
    # First part + first bad_modal replaced with nothing + second part + second bad_modal + third part
    new_content = parts[0] + parts[1] + bad_modal + parts[2]
    with open("src/app/reportistica/ReportisticaClientV2.tsx", "w") as f:
        f.write(new_content)
    print("Fixed extra modal")
else:
    print("Not found multiple times")

