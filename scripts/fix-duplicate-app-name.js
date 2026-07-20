const fs = require('fs');
const path = require('path');

module.exports = function(ctx) {
    const file = path.join(
        ctx.opts.projectRoot,
        'platforms/android/app/src/main/res/values/cdv_strings.xml'
    );

    if (!fs.existsSync(file)) {
        return;
    }

    let xml = fs.readFileSync(file, 'utf8');

    xml = xml.replace(
        /\s*<string name="app_name">[\s\S]*?<\/string>\s*/g,
        '\n'
    );

    fs.writeFileSync(file, xml);
    console.log('Removed duplicate app_name from cdv_strings.xml');
};
