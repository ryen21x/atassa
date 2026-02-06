const fs = require("fs-extra");
if (fs.existsSync(".env"))
    require("dotenv").config({ path: __dirname + "/.env", quiet: true });

module.exports = {
    SESSION_ID: process.env.SESSION_ID,
    DATABASE_URL: process.env.DATABASE_URL, // Postress...will fallback to path: ./gift/database.db if not provided
};

let fileName = require.resolve(__filename);
fs.watchFile(fileName, () => {
    fs.unwatchFile(fileName);
    console.log(`Writing File: ${__filename}`);
    delete require.cache[fileName];
    require(fileName);
});
