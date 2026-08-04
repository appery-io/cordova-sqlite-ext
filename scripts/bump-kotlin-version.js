#!/usr/bin/env node
/**
 * Appery/config.xml may pin GradlePluginKotlinVersion too low for modern
 * Google Play / AdMob AARs. Cordova regenerates platforms/android/cdv-gradle-config.json
 * from that preference on prepare, so patch the generated file after prepare /
 * before build instead of editing config.xml.
 */
const fs = require('fs');
const path = require('path');

const MIN_KOTLIN_VERSION = '2.2.20';

function compareVersions(a, b) {
    const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
    const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);

    for (let i = 0; i < len; i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

module.exports = function (ctx) {
    const configPath = path.join(
        ctx.opts.projectRoot,
        'platforms',
        'android',
        'cdv-gradle-config.json'
    );

    if (!fs.existsSync(configPath)) {
        console.log(
            '[cordova-sqlite-ext] cdv-gradle-config.json not found, skip Kotlin bump'
        );
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const current = config.KOTLIN_VERSION || '0.0.0';

    if (compareVersions(current, MIN_KOTLIN_VERSION) >= 0) {
        console.log(
            `[cordova-sqlite-ext] Kotlin ${current} already >= ${MIN_KOTLIN_VERSION}`
        );
        return;
    }

    config.KOTLIN_VERSION = MIN_KOTLIN_VERSION;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log(
        `[cordova-sqlite-ext] Bumped KOTLIN_VERSION ${current} -> ${MIN_KOTLIN_VERSION}`
    );
};
