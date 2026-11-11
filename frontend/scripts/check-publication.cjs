// Refuses a production store build while the publisher details are missing.
// Runs automatically on EAS (eas-build-pre-install). Other profiles and local
// runs only report. Use --strict to enforce locally.
const fs = require("node:fs");
const path = require("node:path");

function read(file = path.join(__dirname, "..", "src", "publication.ts")) {
  const source = fs.readFileSync(file, "utf8");
  const value = (name) => (source.match(new RegExp(`export const ${name} = "([^"]*)";`)) || [])[1];
  return { url: value("PRIVACY_POLICY_URL"), email: value("SUPPORT_EMAIL") };
}

function problems({ url, email }) {
  const out = [];
  if (url === undefined || email === undefined) out.push("src/publication.ts: constants not found");
  if (url !== undefined && !/^https:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/.test(url))
    out.push("PRIVACY_POLICY_URL must be a public https address");
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    out.push("SUPPORT_EMAIL must be an e-mail address");
  return out;
}

module.exports = { read, problems };

if (require.main === module) {
  const strict = process.argv.includes("--strict") || process.env.EAS_BUILD_PROFILE === "production";
  const found = problems(read());
  if (!found.length) console.log("Publication details: complete.");
  else {
    console.log((strict ? "Publication details missing:" : "Publication details not final yet:") + "\n- " + found.join("\n- "));
    if (strict) process.exit(1);
  }
}
