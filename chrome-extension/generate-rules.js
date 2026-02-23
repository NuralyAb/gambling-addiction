// Run: node generate-rules.js > rules.json
const { GAMBLING_DOMAINS } = require("./gambling-domains");

const rules = GAMBLING_DOMAINS.map((domain, i) => ({
  id: i + 1,
  priority: 1,
  action: { type: "block" },
  condition: {
    urlFilter: `||${domain}`,
    resourceTypes: ["main_frame", "sub_frame"],
  },
}));

console.log(JSON.stringify(rules, null, 2));
