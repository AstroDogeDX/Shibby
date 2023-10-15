const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getFiles(filePath, fileList);
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    }

    return fileList;
}

module.exports = getFiles;
