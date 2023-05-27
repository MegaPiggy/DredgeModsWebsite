const core = require("@actions/core");
const node_fetch = require("node-fetch");
const fs = require("fs");

function srcDir() {
    let dir = process.cwd().split("\\").slice(-1)[0];
    let src_dir = dir == "build" ? "../../src" : "src";
    return src_dir;
}

async function run() {
    core.info("Started fetching mod database");

    await fetch_json("https://raw.githubusercontent.com/xen-42/DredgeModDatabase/database/database.json").then((results) => {
        let json = JSON.stringify(results, null, 2);
        core.info(json);

        fs.writeFile(srcDir() + "/database.json", json, 'utf8', (err : Error) => {
            if (err) {
                throw new Error(err.message);
            }
            else {
                core.info("Saved updated database");
            }
        });
        core.info("Saved database.json");

        let dir = `${srcDir()}/pages/mods`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        // Now we fetch the readmes
        results.forEach(load_mod_readme);
    });
}

async function load_mod_readme(mod : {readme_raw : string, name : string}) {
    await fetch_text(mod.readme_raw).then((results) => {
        let page_name = mod.name.toLowerCase().trim().split(" ").join("_");

        let mod_page = 
`---
layout: ../../layouts/ModPage.astro
title: ${mod.name}
---
${results}`

        fs.writeFile(`${srcDir()}/pages/mods/${page_name}.md`, mod_page, 'utf8', (err : Error) => {
            if (err) {
                throw new Error(err.message);
            }
            else {
                core.info("Saved mod page for " + mod.name);
            }
        });
    });
}

async function fetch_json(url : string) {
    let settings = {method: "GET"};
    let res = await node_fetch(url, settings);
    let json = await res.json();

    if (json.hasOwnProperty("message") && (json["message"] as string).includes("API rate limit exceeded")) {
        throw new Error(json["message"]);
    }

    return json;
}

async function fetch_text(url : string) {
    let settings = {method: "GET"};
    let res = await node_fetch(url, settings);
    let text = await res.text();

    return text;
}

run().catch((error) => core.setFailed("Workflow failed! " + error.message));