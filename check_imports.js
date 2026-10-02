const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('find src -type f -name "*.ts" -o -name "*.tsx"').toString().split('\n').filter(Boolean);

let errorCount = 0;
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        
        if (importPath.startsWith('@/')) {
            importPath = importPath.replace('@/', 'src/');
        } else if (importPath.startsWith('.')) {
            importPath = path.join(path.dirname(file), importPath);
        } else {
            continue; // Node module
        }
        
        // Resolve extension
        const exts = ['.tsx', '.ts', '.js', '.jsx', '/index.tsx', '/index.ts'];
        let found = false;
        
        for (const ext of exts) {
            const p = importPath.endsWith(ext) ? importPath : importPath + ext;
            if (fs.existsSync(p)) {
                // Check real case
                const dir = path.dirname(p);
                const base = path.basename(p);
                if (fs.existsSync(dir)) {
                    const realFiles = fs.readdirSync(dir);
                    if (!realFiles.includes(base)) {
                        console.error(`Case mismatch in ${file}: imports ${importPath} but real file is differently cased`);
                        errorCount++;
                    }
                }
                found = true;
                break;
            }
        }
    }
});
if (errorCount === 0) console.log("No case mismatches found!");
