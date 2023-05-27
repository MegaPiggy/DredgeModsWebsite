const core = require("@actions/core");
const node_fetch = require("node-fetch");
const fs = require("fs");

async function run() {
    core.info("Started fetching mod database");

    await fetch_json("https://raw.githubusercontent.com/xen-42/DredgeModDatabase/database/database.json").then((results) => {
        let json = JSON.stringify(results, null, 2);
        core.info(json);
        fs.writeFile("../../src/database.json", json, 'utf8', (err : Error) => {
            if (err) {
                throw new Error(err.message);
            }
            else {
                core.info("Saved updated database");
            }
        });
        core.info("Saved database.json - cwd is " + process.cwd());
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

run().catch((error) => core.setFailed("Workflow failed! " + error.message));