const fs = require("fs-extra");
if (fs.existsSync(".env"))
    require("dotenv").config({ path: __dirname + "/.env", quiet: true });

module.exports = {
    SESSION_ID: process.env.SESSION_ID,'Gifted~H4sIAAAAAAAAA5VUW5OiOBj9L3nVGgEvgFVdNYiAtoiCIpeteYgQEOSaBFGn/O9b2NM9/bA728tTSFIn5zvnfN9PUJQJQSt0A9OfoMLJBVLULemtQmAKZk0UIQz6IIQUgimYGL35Os1ZFh7WBd8MFhQ5kdxq13xx9hW5PueMFGBbW2fSC3j0QdUcsyT4A+BIG2KVvXPjWunRSjOC9DCMJXuXnK5ZYLfmLMgHgrrYq4r9Ah4dIkxwUsRKdUI5wjBbodsWJvhr9OFm6Y1irAv+an+wWAMKeunsrMldsluVCxeF0Wqxre8n5y/Sd/3EcPaKIzt7hjHzXB6dx9U+8z1ra7VBm4ojci1Ua1Ny3ht9ksQFCpchKmhCb1/WvVnpr8iPVSRt5iumkNdtub2j/WbmnMYOvZMVvkUyyaSJ5n2NuBzLgmo32aRWZ3NBUepiUZvlRTy9KpEwgK5+jz3uxqbYMj8T3+L3rJz/j+7t6ij3BP80EPyeNWOF3OCSEz/Ar3zJLs5V/Eq5zBwEg5v2Rd1xZc1IWmV0cfW0easIw4EoKeWlpvsLazl+ntrl8biK6/sn3SFt8J9YhkQSaqzyPr24W851aG8m61XeUw9YGQVQJwfkDvy4EfQINsiTnYqIaS9pax8NFQbt1150QdYgR/bKpDHpJcVVnrcvz4rO6LYMwZR99AFGcUIohjQpi26PY9k+gOFlhwKM6FNecC3lMUt6h9iFc5XVV55Uh3ejtiptMj/OmJupy0OOUatT5r2APqhwGSBCULhICC3xbY0IgTEiYPrXjz4o0JW+Gdc9N2T7IEowoXbRVFkJw3dX3w9hEJRNQXe3IpC7BcJgyvzeRpQmRUw6HZsC4uCUXJB8gpSAaQQzgj4qRBiFYEpxgz66Vi7DTnjHs73Fzp6DPsifhiQhmAJuPOFHnMAynMhMxe/kW9uhwqr6ViAK+iB73hLEMc8xvCjwAjcZTsXv3fbjg16HFiIKk4x0Kde3d35Uyso68rl1q2mSEktyLIHf5bzn4k13TugxwqhIJ80tHbBoZM2dq2OZnHv2bGvPEXd5yRnqRL4TvPwDSDchibpsIl4rF6+6LsxmDbEyTSbEvxgL0w9bJtXoTkyMYbq+O5q5xSa7LGKhR5FtaoM6W4nDtE71cqOszcoqDWs1Tp8h6oMQXZIAfX7scLkfXTznK/kqS+V+4UavDXcMOLceC0wuTXbItV23PnjGpHYmhTjS0GlFCGNS14BRT8h0c3sYzLPrqVUY/moY60yT4rfEPjsm+zWpkmeWOqO63yhBz8YvYGfffxr3xruLF/Pof4L4NUn+pRtn4WVLt5vXUQ+TciC6jWKy5HC2jWysqYotYvWmj6l+KLhDAR6PH31QZZBGJc67QV+EuExC0Ae4bLq8Louo/NM4lJilLMW7rvAMEir97oF9kiNCYV6BKcvz7GgkjsfDt1tbXFYLSE6dBlvWO0VdoG9SVe0opO8tBaTu2xwwePwNhlRuH24HAAA=
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢɪғᴛᴇᴅ ᴛᴇᴄʜ*'
    DATABASE_URL: process.env.DATABASE_URL, // Postress(Get one for free from neon.tech/supabase/render)...will fallback to path: ./gift/database/database.db if not provided
};

let fileName = require.resolve(__filename);
fs.watchFile(fileName, () => {
    fs.unwatchFile(fileName);
    console.log(`Writing File: ${__filename}`);
    delete require.cache[fileName];
    require(fileName);
});
