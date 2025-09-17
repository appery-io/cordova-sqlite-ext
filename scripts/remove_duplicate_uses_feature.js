module.exports = function (context) {
    const fs = require('fs');
    const path = require('path');
    const xml2js = require('xml2js');

    const projectRoot = context.opts.projectRoot;
    const manifestPath = path.join(projectRoot, 'platforms/android/app/src/main/AndroidManifest.xml');

    // Ensure the manifest file exists before proceeding.
    if (!fs.existsSync(manifestPath)) {
        console.log('[Feature Hook] AndroidManifest.xml not found. Skipping.');
        return;
    }

    console.log('[Feature Hook] Found AndroidManifest.xml. Reading file...');

    const manifestXml = fs.readFileSync(manifestPath, 'utf8');
    const parser = new xml2js.Parser();

    parser.parseString(manifestXml, (err, result) => {
        if (err) {
            console.error('[Feature Hook] Error parsing AndroidManifest.xml:', err);
            return;
        }

        const features = result.manifest['uses-feature'];

        if (!features || features.length === 0) {
            console.log('[Feature Hook] No <uses-feature> tags found. Nothing to do.');
            return;
        }

        console.log(`[Feature Hook] Found ${features.length} feature declarations.`);

        // Use a Map to easily find unique features based on their name.
        const uniqueFeaturesMap = new Map();
        features.forEach(feature => {
            if (feature && feature.$ && feature.$['android:name']) {
                uniqueFeaturesMap.set(feature.$['android:name'], feature);
            }
        });

        const uniqueFeaturesArray = Array.from(uniqueFeaturesMap.values());

        if (uniqueFeaturesArray.length < features.length) {
            const numRemoved = features.length - uniqueFeaturesArray.length;
            console.log(`[Feature Hook] Removed ${numRemoved} duplicate feature(s).`);

            // Replace the old features array with the de-duplicated one.
            result.manifest['uses-feature'] = uniqueFeaturesArray;

            // Build the XML back from the JavaScript object.
            const builder = new xml2js.Builder();
            const newManifestXml = builder.buildObject(result);

            // Write the cleaned manifest back to the file.
            fs.writeFileSync(manifestPath, newManifestXml, 'utf8');
            console.log('[Feature Hook] Successfully wrote updated AndroidManifest.xml.');
        } else {
            console.log('[Feature Hook] No duplicate features found.');
        }
    });
};
