import re

with open("src/components/ui/ClientTimelineDrawer.tsx", "r") as f:
    content = f.read()

# Add createPortal to imports
if 'createPortal' not in content:
    content = content.replace(
        'import { useEffect, useState } from "react";',
        'import { useEffect, useState } from "react";\nimport { createPortal } from "react-dom";'
    )

# Wrap return in createPortal
old_return = r'''  return \(
    <div className="fixed inset-0 z-\[300\] flex justify-end bg-slate-900\/60 backdrop-blur-sm transition-opacity" onClick=\{onClose\}\>'''

new_return = '''  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}>'''

if 'createPortal(' not in content:
    content = re.sub(old_return, new_return, content)
    
    # Close the createPortal call at the very end
    end_hook = r'''      \<\/div\>
    \<\/div\>
  \)\;
\}'''
    new_end = '''      </div>
    </div>,
    document.body
  );
}'''
    content = re.sub(end_hook, new_end, content)

with open("src/components/ui/ClientTimelineDrawer.tsx", "w") as f:
    f.write(content)

print("Portal added to Drawer")
