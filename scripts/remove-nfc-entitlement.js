// hooks/remove-nfc-entitlement.js
module.exports = function (context) {
    const fs = require('fs');
    const path = require('path');
    const plist = require('plist');

    const projectRoot = context.opts.projectRoot;

    // Path to entitlements file inside iOS platform folder
    const entitlementsPath = path.join(
        projectRoot,
        'platforms',
        'ios',
        'App',
        'App.entitlements' // <-- adjust if your entitlements file has a different name
    );

    if (!fs.existsSync(entitlementsPath)) {
        console.log('[NFC Hook] Entitlements file not found:', entitlementsPath);
        return;
    }

    console.log('[NFC Hook] Found entitlements file. Reading...');

    try {
        const plistContent = fs.readFileSync(entitlementsPath, 'utf8');
        const entitlements = plist.parse(plistContent);

        if (entitlements['com.apple.developer.nfc.readersession.formats']) {
            const formats = entitlements['com.apple.developer.nfc.readersession.formats'];

            // Remove only NDEF entries
            const filtered = formats.filter(f => f !== 'NDEF');

            if (filtered.length === 0) {
                console.log('[NFC Hook] Removing entire NFC entitlement because it only contained NDEF.');
                delete entitlements['com.apple.developer.nfc.readersession.formats'];
            } else if (filtered.length < formats.length) {
                console.log('[NFC Hook] Removed NDEF from NFC entitlement formats.');
                entitlements['com.apple.developer.nfc.readersession.formats'] = filtered;
            } else {
                console.log('[NFC Hook] NFC entitlement exists, but no NDEF found. Nothing to change.');
            }

            const newPlistContent = plist.build(entitlements);
            fs.writeFileSync(entitlementsPath, newPlistContent, 'utf8');
            console.log('[NFC Hook] Successfully updated entitlements file.');
        } else {
            console.log('[NFC Hook] No NFC entitlement found. Nothing to do.');
        }
    } catch (err) {
        console.error('[NFC Hook] Error processing entitlements file:', err);
    }
};
