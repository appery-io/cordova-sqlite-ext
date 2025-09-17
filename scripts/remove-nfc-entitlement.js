// hooks/remove-nfc-entitlement.js
module.exports = function (context) {
    const fs = require('fs');
    const path = require('path');
    const plist = require('plist');

    const projectRoot = context.opts.projectRoot;
    const iosPlatformPath = path.join(projectRoot, 'platforms', 'ios');

    if (!fs.existsSync(iosPlatformPath)) {
        console.log('[NFC Hook] iOS platform not found. Skipping.');
        return;
    }

    // Recursively find all *.entitlements files
    function findEntitlementsFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(findEntitlementsFiles(filePath));
            } else if (file.endsWith('.entitlements')) {
                results.push(filePath);
            }
        });
        return results;
    }

    const entitlementsFiles = findEntitlementsFiles(iosPlatformPath);

    if (entitlementsFiles.length === 0) {
        console.log('[NFC Hook] No entitlements files found under iOS platform.');
        return;
    }

    entitlementsFiles.forEach(entitlementsPath => {
        console.log('[NFC Hook] Processing:', entitlementsPath);

        try {
            const plistContent = fs.readFileSync(entitlementsPath, 'utf8');
            const entitlements = plist.parse(plistContent);

            if (entitlements['com.apple.developer.nfc.readersession.formats']) {
                const formats = entitlements['com.apple.developer.nfc.readersession.formats'];

                // Remove NDEF entries
                const filtered = formats.filter(f => f !== 'NDEF');

                if (filtered.length === 0) {
                    console.log('[NFC Hook] Removing entire NFC entitlement (only contained NDEF).');
                    delete entitlements['com.apple.developer.nfc.readersession.formats'];
                } else if (filtered.length < formats.length) {
                    console.log('[NFC Hook] Removed NDEF from NFC entitlement formats.');
                    entitlements['com.apple.developer.nfc.readersession.formats'] = filtered;
                } else {
                    console.log('[NFC Hook] NFC entitlement exists, but no NDEF found.');
                }

                const newPlistContent = plist.build(entitlements);
                fs.writeFileSync(entitlementsPath, newPlistContent, 'utf8');
                console.log('[NFC Hook] Updated:', entitlementsPath);
            } else {
                console.log('[NFC Hook] No NFC entitlement found in this file.');
            }
        } catch (err) {
            console.error('[NFC Hook] Error processing entitlements file:', entitlementsPath, err);
        }
    });
};
