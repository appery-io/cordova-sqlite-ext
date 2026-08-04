#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

module.exports = async function (ctx) {
    const configPath = path.join(ctx.opts.projectRoot, "config.xml");

    if (!fs.existsSync(configPath)) {
        return;
    }

    const xml = fs.readFileSync(configPath, "utf8");

    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder({
        xmldec: {
            version: "1.0",
            encoding: "UTF-8"
        }
    });

    const doc = await parser.parseStringPromise(xml);

    let prefs = doc.widget.preference || [];

    let pref = prefs.find(p => p.$.name === "GradlePluginKotlinVersion");

    if (!pref) {
        prefs.push({
            $: {
                name: "GradlePluginKotlinVersion",
                value: "2.2.20"
            }
        });
        doc.widget.preference = prefs;
    } else {
        const current = pref.$.value || "";

        if (compareVersions(current, "2.2.20") < 0) {
            pref.$.value = "2.2.20";
        }
    }

    fs.writeFileSync(configPath, builder.buildObject(doc), "utf8");

    console.log("GradlePluginKotlinVersion checked");
};

function compareVersions(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);

    const len = Math.max(pa.length, pb.length);

    for (let i = 0; i < len; i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;

        if (x > y) return 1;
        if (x < y) return -1;
    }

    return 0;
}
