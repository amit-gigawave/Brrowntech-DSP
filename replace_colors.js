const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceColors(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replacing background gradients in page.tsx
    content = content.replace(/rgba\(47,142,255/g, 'rgba(255,204,0'); // blue -> yellow
    content = content.replace(/rgba\(0,204,183/g, 'rgba(255,153,0'); // teal -> orange
    content = content.replace(/#071019/g, '#0a0a00');
    content = content.replace(/#08131d/g, '#050500');
    content = content.replace(/#05080d/g, '#000000');
    content = content.replace(/#050a0f/g, '#0a0a00');
    
    // Replace cyan with yellow
    content = content.replace(/cyan-([0-9]+)/g, 'yellow-$1');
    content = content.replace(/cyan-400\/([0-9]+)/g, 'yellow-400/$1');
    content = content.replace(/cyan-500\/([0-9]+)/g, 'yellow-500/$1');
    
    // Replace blue with yellow
    content = content.replace(/blue-([0-9]+)/g, 'yellow-$1');
    
    // Replace emerald with orange
    content = content.replace(/emerald-([0-9]+)/g, 'orange-$1');
    
    // Replace indigo with orange
    content = content.replace(/indigo-([0-9]+)/g, 'orange-$1');

    // In globals.css
    content = content.replace(/from-blue-600 via-purple-600 to-pink-600/g, 'from-yellow-400 via-orange-500 to-yellow-600');
    
    // Specific shadow rgba (cyan is 6,182,212; blue is 59,130,246; emerald is 16,185,129)
    // Let's replace cyan rgba
    content = content.replace(/rgba\(6,182,212,/g, 'rgba(250,204,21,'); // yellow-400
    content = content.replace(/rgba\(34,211,238,/g, 'rgba(250,204,21,'); // cyan-400 -> yellow-400
    content = content.replace(/rgba\(59,130,246,/g, 'rgba(250,204,21,'); // blue-500 -> yellow-400
    content = content.replace(/rgba\(16,185,129,/g, 'rgba(249,115,22,'); // emerald-500 -> orange-500

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            replaceColors(fullPath);
        }
    });
}

traverseDirectory(directoryPath);
console.log('Done.');
