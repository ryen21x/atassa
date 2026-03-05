const fs = require("fs-extra");
if (fs.existsSync(".env"))
    require("dotenv").config({ path: __dirname + "/.env", quiet: true });

module.exports = {
    MODE: process.env.MODE 'private',
    SESSION_ID: process.env.SESSION_ID 'Gifted~H4sIAAAAAAAAA5VU2a6jOBD9lZFfE3UIS0giXalZEiA7kJXRPDhgwCyGYEOWVv59xF369sNMzx2eTGGqTtU5p34AUmCK5ugOxj9AWeEGMtQe2b1EYAzUOgxRBboggAyCMXDniWAaEctLfrRuVqQZImuqRYNOykZDfJZYmHkrU9OO+9MLeHZBWZ8z7P8m4Tp37/ElRf0dMTn7rCvTx845Lc6NPFzvpY7HxFEod5aL2UF5Ac82I8QVJtGkjFGOKpjN0X0DcfVF+GpsE0/fDi/1Qx4Kt8loZj4MX93e5OmVO1lyc7H1IZ5M9vRr8G2td6uSYxXThGjOYEFS2b/PBS2FWDX7iX69D/ybI1haLr7BpzgiKLACRBhm9y/Pfa4vOkW18Yl9SkRT38PDdqRF8vGqaomfcUPurD9oaAaQDL8GPE6reuQWyW1V8kmYa/ZCgLPM7PTmD02WqmZlouxQzjsHJ/0V+Kb60Er6f+be0S1dCSwjP3qlSm5UkNQaa4kyc/1lZz8TJxqXboWlU02XX4NvXNzAjVQ2ina70VDPm9oZeENBETPRu/aSxhETwUk3xSpZfsKHrK5+h5I6Lrlmzi0MfI9AZanW/PYeCHP3MJ/EJp4L0vSMO1eJTxLa0EsVTYXAviXxeqVyBctxz/OP+4Xk76TIW4f2MFcvClZeXjtK0d0KwLj/7IIKRZiyCjJckDYmDrsABo2L/Aqx1+kCJjHdTadzJRh0PHM5PPeobdViOKH9U8q2U5m7st31vB5slRfQBWVV+IhSFJiYsqK6LxGlMEIUjP/8qwsIurE33tpqQr8LQlxRtiN1mRUw+CD14yP0/aImzL0TX2sPqAJj7jOMGMMkou0YawIrP8YN0mLIKBiHMKPoZ4OoQgEYs6pGP02rFUE79yl3mu35/gl0Qf7KBw7AGPDSQB4IfYkT+dFY+k6/XdussCy/EcRAFxDYXgbOHZI/1KxGoAuy9x+5kSRJ/ECQZE7gxtL3Nv78CbmtECAGcUbBGGhL43hdRsZko5sl5QxDsSNFixTw2eKHVN64UE+yr9+0w2X32KzSU36Gt0V8KDb8cTeMGjMMt6NsQS6cT+yXf0gCxqARzXgVy+bhUPYtf5sYg0W0h/lhjy5Y3YtwauWuYhZ7jscxIcaxd79kYt0/+sJDJgecqpFmMG/h2tLaRNxq6zgRUq4vbbUANdhHvxZbFHut2a6NCY03ndqqG7rnpcOgcTZF5J1ia73NTW6je0EWTyYbTok6giHQm3gLts7pMe2Lk9CeqLtMzY8cTmlhC7oZX99E/Gqi7H154Vd9teS1ryFGr7vgnaX/IvMNdys57tn9JcX7cvkXg6r2YS0oQzu7ZMvHwzNmOU9dcX/RR1l/Yy1ugsD1PFcaMHPGgefzry4oM8jCospbd+dnCLqgKupWwBYJi99U0pSlpduR1XadQcqUT1NscY4og3kJxn1Z5mVe4sX+261NVZQmpHE7AENU8rpV+F0pS5dB9uExoLTPvD8Fz78BBlZG4n4HAAA=',
    TIME_ZONE: process.env.TIME_ZONE,
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS 'on',
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS 'on',
    DATABASE_URL: process.env.DATABASE_URL, // Postress(Get one for free from neon.tech/supabase/render/heroku in built postgress)...will fallback to path: ./gift/database/database.db if not provided
};

let fileName = require.resolve(__filename);
fs.watchFile(fileName, () => {
    fs.unwatchFile(fileName);
    console.log(`Writing File: ${__filename}`);
    delete require.cache[fileName];
    require(fileName);
});
