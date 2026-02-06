const { gmd, commands } = require("../gift/gmdCmds");
const {
  getSetting,
  setSetting,
  getAllSettings,
  resetSetting,
  resetAllSettings,
} = require("../gift/database/settings");
const {
  getGroupSetting,
  setGroupSetting,
  getEnabledGroupSettings,
  resetAllGroupSettings,
  getAllGroupSettings,
} = require("../gift/database/groupSettings");
const { getSudoNumbers, clearAllSudo } = require("../gift/database/sudo");
const {
  getAllUsersNotes,
  deleteNoteById,
  updateNoteById,
  deleteAllNotes,
  NotesDB,
} = require("../gift/database/notes");

function parseBooleanInput(input) {
  if (!input) return null;
  const val = input.toLowerCase().trim();
  if (val === "on") return "true";
  if (val === "off") return "false";
  return val;
}

function formatBoolDisplay(val) {
  return val === "true" ? "ON" : "OFF";
}

function isSettingEnabled(val) {
  if (!val) return false;
  const v = String(val).toLowerCase().trim();
  return (
    v === "true" ||
    v === "on" ||
    v === "1" ||
    v === "yes" ||
    v === "warn" ||
    v === "kick" ||
    v === "delete"
  );
}

async function formatGroupsWithNames(jids, Gifted) {
  if (!jids || jids.length === 0) return "None";

  const groupInfos = await Promise.all(
    jids.map(async (jid) => {
      try {
        const metadata = await Gifted.groupMetadata(jid);
        const name = metadata?.subject || "Unknown";
        return `• ${name}`;
      } catch (e) {
        return `• ${jid}`;
      }
    }),
  );
  return groupInfos.join("\n");
}

gmd(
  {
    pattern: "settings",
    aliases: ["botsettings", "setting", "botsetting", "allsettings"],
    react: "⚙️",
    category: "owner",
    description: "View all bot settings",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser } = conText;
    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }
    try {
      const settings = await getAllSettings();
      const sudoList = await getSudoNumbers();
      const enabledGroupSettings = await getEnabledGroupSettings();

      let msg = `╭━━━━━━━━━━━╮\n`;
      msg += `│   *⚙️ BOT SETTINGS*\n`;
      msg += `╰━━━━━━━━━━━╯\n\n`;

      const keys = Object.keys(settings).sort();
      for (const key of keys) {
        const val = settings[key] || "Not Set";
        const displayVal = val.length > 40 ? val.substring(0, 40) + "..." : val;
        msg += `▸ *${key}:* ${displayVal}\n`;
      }

      msg += `\n▸ *SUDO_USERS:* ${sudoList.length > 0 ? sudoList.join(", ") : "None"}\n`;

      msg += `\n╭━━━━━━━━━━━╮\n`;
      msg += `│   *📋 GROUP SETTINGS*\n`;
      msg += `╰━━━━━━━━━━━╯\n\n`;

      const [
        welcomeGroups,
        goodbyeGroups,
        eventsGroups,
        antilinkGroups,
        antibadGroups,
        antigroupmentionGroups,
      ] = await Promise.all([
        formatGroupsWithNames(enabledGroupSettings.WELCOME_MESSAGE, Gifted),
        formatGroupsWithNames(enabledGroupSettings.GOODBYE_MESSAGE, Gifted),
        formatGroupsWithNames(enabledGroupSettings.GROUP_EVENTS, Gifted),
        formatGroupsWithNames(enabledGroupSettings.ANTILINK, Gifted),
        formatGroupsWithNames(enabledGroupSettings.ANTIBAD, Gifted),
        formatGroupsWithNames(enabledGroupSettings.ANTIGROUPMENTION, Gifted),
      ]);

      msg += `*🎉 WELCOME MESSAGE:*\n${welcomeGroups}\n\n`;
      msg += `*👋 GOODBYE MESSAGE:*\n${goodbyeGroups}\n\n`;
      msg += `*📢 GROUP EVENTS:*\n${eventsGroups}\n\n`;
      msg += `*🔗 ANTILINK:*\n${antilinkGroups}\n\n`;
      msg += `*🚫 ANTIBAD:*\n${antibadGroups}\n\n`;
      msg += `*🛡️ ANTI-GROUP-MENTION:*\n${antigroupmentionGroups}\n`;

      await reply(msg);
      await react("✅");
    } catch (error) {
      console.error("settings error:", error);
      await react("❌");
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setprefix",
    aliases: ["prefix", "botprefix", "changeprefix"],
    react: "⚙️",
    category: "owner",
    description: "Set bot prefix",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide a prefix!\nExample: .setprefix !");
    try {
      const current = await getSetting("PREFIX");
      if (current === q.trim()) {
        return reply(`⚠️ Prefix is already set to: *${q.trim()}*`);
      }
      await setSetting("PREFIX", q.trim());
      await react("✅");
      await reply(`✅ Prefix set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setbotname",
    aliases: ["botname", "namebot", "changename"],
    react: "⚙️",
    category: "owner",
    description: "Set bot name",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide a bot name!");
    try {
      const current = await getSetting("BOT_NAME");
      if (current === q.trim()) {
        return reply(`⚠️ Bot name is already set to: *${q.trim()}*`);
      }
      await setSetting("BOT_NAME", q.trim());
      await react("✅");
      await reply(`✅ Bot name set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setownername",
    aliases: ["ownername", "myname"],
    react: "⚙️",
    category: "owner",
    description: "Set owner name",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide an owner name!");
    try {
      const current = await getSetting("OWNER_NAME");
      if (current === q.trim()) {
        return reply(`⚠️ Owner name is already set to: *${q.trim()}*`);
      }
      await setSetting("OWNER_NAME", q.trim());
      await react("✅");
      await reply(`✅ Owner name set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setownernumber",
    aliases: ["ownernumber", "ownernum", "mynumber"],
    react: "⚙️",
    category: "owner",
    description: "Set owner number",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide an owner number!");
    try {
      const num = q.replace(/\D/g, "");
      const current = await getSetting("OWNER_NUMBER");
      if (current === num) {
        return reply(`⚠️ Owner number is already set to: *${num}*`);
      }
      await setSetting("OWNER_NUMBER", num);
      await react("✅");
      await reply(`✅ Owner number set to: *${num}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setfooter",
    aliases: ["footer", "botfooter"],
    react: "⚙️",
    category: "owner",
    description: "Set bot footer",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide a footer text!");
    try {
      const current = await getSetting("FOOTER");
      if (current === q.trim()) {
        return reply(`⚠️ Footer is already set to: *${q.trim()}*`);
      }
      await setSetting("FOOTER", q.trim());
      await react("✅");
      await reply(`✅ Footer set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setcaption",
    aliases: ["caption", "botcaption"],
    react: "⚙️",
    category: "owner",
    description: "Set bot caption",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide a caption!");
    try {
      const current = await getSetting("CAPTION");
      if (current === q.trim()) {
        return reply(`⚠️ Caption is already set to: *${q.trim()}*`);
      }
      await setSetting("CAPTION", q.trim());
      await react("✅");
      await reply(`✅ Caption set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setbotpic",
    aliases: ["botpic", "botimage", "setbotimage"],
    react: "⚙️",
    category: "owner",
    description: "Set bot picture URL",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q) return reply("❌ Please provide an image URL!");
    try {
      const current = await getSetting("BOT_PIC");
      if (current === q.trim()) {
        return reply(`⚠️ Bot picture URL is already set to this value!`);
      }
      await setSetting("BOT_PIC", q.trim());
      await react("✅");
      await reply(`✅ Bot picture URL updated!`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setmode",
    aliases: ["mode", "botmode", "changemode"],
    react: "⚙️",
    category: "owner",
    description: "Set bot mode (public/private)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const mode = q?.toLowerCase();
    if (!mode || !["public", "private"].includes(mode)) {
      return reply("❌ Please specify: public or private");
    }
    try {
      const current = await getSetting("MODE");
      if (current === mode) {
        return reply(`⚠️ Bot mode is already set to: *${mode}*`);
      }
      await setSetting("MODE", mode);
      await react("✅");
      await reply(`✅ Bot mode set to: *${mode}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "settimezone",
    aliases: ["timezone", "tz", "settz"],
    react: "⚙️",
    category: "owner",
    description: "Set bot timezone",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!q)
      return reply(
        "❌ Please provide a timezone!\nExample: .settimezone Africa/Nairobi",
      );
    try {
      const current = await getSetting("TIME_ZONE");
      if (current === q.trim()) {
        return reply(`⚠️ Timezone is already set to: *${q.trim()}*`);
      }
      await setSetting("TIME_ZONE", q.trim());
      await react("✅");
      await reply(`✅ Timezone set to: *${q.trim()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setdmpresence",
    aliases: ["dmpresence", "chatpresence", "inboxpresence"],
    react: "⚙️",
    category: "owner",
    description: "Set DM presence (online/offline/typing/recording)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["online", "offline", "typing", "recording"];
    if (!q || !valid.includes(q.toLowerCase())) {
      return reply(`❌ Please specify: ${valid.join(", ")}`);
    }
    try {
      const current = await getSetting("DM_PRESENCE");
      if (current === q.toLowerCase()) {
        return reply(`⚠️ DM presence is already set to: *${q.toLowerCase()}*`);
      }
      await setSetting("DM_PRESENCE", q.toLowerCase());
      await react("✅");
      await reply(`✅ DM presence set to: *${q.toLowerCase()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setgcpresence",
    aliases: ["gcpresence", "grouppresence", "grppresence"],
    react: "⚙️",
    category: "owner",
    description: "Set group presence (online/offline/typing/recording)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["online", "offline", "typing", "recording"];
    if (!q || !valid.includes(q.toLowerCase())) {
      return reply(`❌ Please specify: ${valid.join(", ")}`);
    }
    try {
      const current = await getSetting("GC_PRESENCE");
      if (current === q.toLowerCase()) {
        return reply(
          `⚠️ Group presence is already set to: *${q.toLowerCase()}*`,
        );
      }
      await setSetting("GC_PRESENCE", q.toLowerCase());
      await react("✅");
      await reply(`✅ Group presence set to: *${q.toLowerCase()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setchatbot",
    aliases: ["chatbot", "ai", "setai"],
    react: "⚙️",
    category: "owner",
    description: "Set chatbot (on/off/audio)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["true", "false", "audio"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: on, off, or audio`);
    }
    try {
      const current = await getSetting("CHATBOT");
      if (current === value) {
        const display =
          value === "true" ? "ON" : value === "false" ? "OFF" : value;
        return reply(`⚠️ Chatbot is already set to: *${display}*`);
      }
      await setSetting("CHATBOT", value);
      await react("✅");
      await reply(
        `✅ Chatbot set to: *${value === "true" ? "ON" : value === "false" ? "OFF" : value}*`,
      );
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setchatbotmode",
    aliases: ["chatbotmode", "aimode"],
    react: "⚙️",
    category: "owner",
    description: "Set chatbot mode (inbox/groups/allchats)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["inbox", "groups", "allchats"];
    if (!q || !valid.includes(q.toLowerCase())) {
      return reply(`❌ Please specify: ${valid.join(", ")}`);
    }
    try {
      const current = await getSetting("CHATBOT_MODE");
      if (current === q.toLowerCase()) {
        return reply(`⚠️ Chatbot mode is already set to: *${q.toLowerCase()}*`);
      }
      await setSetting("CHATBOT_MODE", q.toLowerCase());
      await react("✅");
      await reply(`✅ Chatbot mode set to: *${q.toLowerCase()}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setstartmsg",
    aliases: ["startmsg", "startingmessage", "startmessage"],
    react: "⚙️",
    category: "owner",
    description: "Set starting message (on/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["true", "false"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: on or off`);
    }
    try {
      const current = await getSetting("STARTING_MESSAGE");
      if (current === value) {
        return reply(
          `⚠️ Starting message is already: *${formatBoolDisplay(value)}*`,
        );
      }
      await setSetting("STARTING_MESSAGE", value);
      await react("✅");
      await reply(`✅ Starting message set to: *${formatBoolDisplay(value)}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setantidelete",
    aliases: ["antidelete", "antidel"],
    react: "⚙️",
    category: "owner",
    description: "Set antidelete (inchat/indm/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["inchat", "indm", "false"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: inchat, indm or off`);
    }
    try {
      const current = await getSetting("ANTIDELETE");
      if (current === value) {
        const displayVal = value === "false" ? "OFF" : value.toUpperCase();
        return reply(`⚠️ Antidelete is already set to: *${displayVal}*`);
      }
      await setSetting("ANTIDELETE", value);
      await react("✅");
      const displayVal = value === "false" ? "OFF" : value.toUpperCase();
      await reply(`✅ Antidelete set to: *${displayVal}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setwelcome",
    aliases: ["welcome", "welcomemsg"],
    react: "⚙️",
    category: "group",
    description: "Set welcome message for this group (on/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");
    const valid = ["true", "false"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: on or off`);
    }
    try {
      const current = await getGroupSetting(from, "WELCOME_MESSAGE");
      if (current === value) {
        return reply(
          `⚠️ Welcome message for this group is already: *${formatBoolDisplay(value)}*`,
        );
      }
      await setGroupSetting(from, "WELCOME_MESSAGE", value);
      await react("✅");
      await reply(
        `✅ Welcome message for this group: *${formatBoolDisplay(value)}*`,
      );
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setgoodbye",
    aliases: ["goodbye", "goodbyemsg", "bye"],
    react: "⚙️",
    category: "group",
    description: "Set goodbye message for this group (on/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");
    const valid = ["true", "false"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: on or off`);
    }
    try {
      const current = await getGroupSetting(from, "GOODBYE_MESSAGE");
      if (current === value) {
        return reply(
          `⚠️ Goodbye message for this group is already: *${formatBoolDisplay(value)}*`,
        );
      }
      await setGroupSetting(from, "GOODBYE_MESSAGE", value);
      await react("✅");
      await reply(
        `✅ Goodbye message for this group: *${formatBoolDisplay(value)}*`,
      );
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "welcomemessage",
    aliases: ["setwelcomemsg", "welcomemsg", "setwelcometext"],
    react: "⚙️",
    category: "group",
    description: "Set custom welcome message for this group",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    if (!q || !q.trim()) {
      const current = await getGroupSetting(from, "WELCOME_MESSAGE_TEXT");
      if (current && current.trim()) {
        return reply(
          `📝 Current welcome message:\n\n${current}\n\nTo change: .welcomemessage Your new message here\nTo clear: .welcomemessage clear`,
        );
      }
      return reply(
        `❌ Please provide a welcome message.\nExample: .welcomemessage Thank you for joining! Please follow the rules.`,
      );
    }

    try {
      if (q.toLowerCase().trim() === "clear") {
        await setGroupSetting(from, "WELCOME_MESSAGE_TEXT", "");
        await react("✅");
        return reply(
          "✅ Custom welcome message cleared. Default message will be used.",
        );
      }

      await setGroupSetting(from, "WELCOME_MESSAGE_TEXT", q.trim());
      await react("✅");
      await reply(`✅ Welcome message set:\n\n${q.trim()}`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "goodbyemessage",
    aliases: ["setgoodbyemsg", "goodbyemsg", "setgoodbyetext", "byemsg"],
    react: "⚙️",
    category: "group",
    description: "Set custom goodbye message for this group",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    if (!q || !q.trim()) {
      const current = await getGroupSetting(from, "GOODBYE_MESSAGE_TEXT");
      if (current && current.trim()) {
        return reply(
          `📝 Current goodbye message:\n\n${current}\n\nTo change: .goodbyemessage Your new message here\nTo clear: .goodbyemessage clear`,
        );
      }
      return reply(
        `❌ Please provide a goodbye message.\nExample: .goodbyemessage Thank you for staying with us. Take care!`,
      );
    }

    try {
      if (q.toLowerCase().trim() === "clear") {
        await setGroupSetting(from, "GOODBYE_MESSAGE_TEXT", "");
        await react("✅");
        return reply(
          "✅ Custom goodbye message cleared. Default message will be used.",
        );
      }

      await setGroupSetting(from, "GOODBYE_MESSAGE_TEXT", q.trim());
      await react("✅");
      await reply(`✅ Goodbye message set:\n\n${q.trim()}`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setanticall",
    aliases: ["anticall", "blockcall"],
    react: "⚙️",
    category: "owner",
    description: "Set anticall (on/off/block/decline)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) return reply("❌ Owner Only Command!");
    const valid = ["true", "block", "false", "decline"];
    const value = parseBooleanInput(q);
    if (!value || !valid.includes(value)) {
      return reply(`❌ Please specify: on, off, block or decline`);
    }
    try {
      const current = await getSetting("ANTICALL");
      if (current === value) {
        const displayVal =
          value === "true"
            ? "ON"
            : value === "false"
              ? "OFF"
              : value.toUpperCase();
        return reply(`⚠️ Anticall is already set to: *${displayVal}*`);
      }
      await setSetting("ANTICALL", value);
      await react("✅");
      const displayVal =
        value === "true"
          ? "ON"
          : value === "false"
            ? "OFF"
            : value.toUpperCase();
      await reply(`✅ Anticall set to: *${displayVal}*`);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setantilink",
    aliases: ["antilink"],
    react: "⚙️",
    category: "group",
    description: "Set antilink for this group (on/warn/delete/kick/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const input = (q || "").toLowerCase().trim();
    const modeMap = {
      on: "delete",
      off: "false",
      true: "delete",
      false: "false",
      delete: "delete",
      kick: "kick",
      warn: "warn",
    };

    const value = modeMap[input];
    if (!value) {
      const warnCount = await getGroupSetting(from, "ANTILINK_WARN_COUNT");
      return reply(`❌ Please specify a mode:
• *on/delete* - Delete links (no kick)
• *warn* - Warn user, kick after ${warnCount} warnings
• *kick* - Delete link & immediately kick user
• *off* - Disable antilink`);
    }

    try {
      const current = await getGroupSetting(from, "ANTILINK");
      if (current === value) {
        const displayVal = value === "false" ? "OFF" : value.toUpperCase();
        return reply(`⚠️ Antilink is already: *${displayVal}*`);
      }
      await setGroupSetting(from, "ANTILINK", value);
      await react("✅");
      const displayVal = value === "false" ? "OFF" : value.toUpperCase();
      let msg = `✅ Antilink: *${displayVal}*`;
      if (value === "warn") {
        const warnCount = await getGroupSetting(from, "ANTILINK_WARN_COUNT");
        msg += `\nKick after *${warnCount}* warnings`;
      }
      await reply(msg);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "antilinkwarn",
    aliases: ["setwarncount", "warncount", "antilinkwarncount", "warnlimit"],
    react: "⚙️",
    category: "group",
    description: "Set antilink warning count before kick (default 5)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const count = parseInt(q);
    if (!q) {
      const current =
        (await getGroupSetting(from, "ANTILINK_WARN_COUNT")) || "5";
      return reply(
        `⚠️ Current warn count for this group: *${current}*\nUsage: .antilinkwarn 3`,
      );
    }

    if (isNaN(count) || count < 1 || count > 10) {
      return reply("❌ Please provide a number between 1-10");
    }

    try {
      await setGroupSetting(from, "ANTILINK_WARN_COUNT", count.toString());
      await react("✅");
      await reply(
        `✅ Antilink warn count set to: *${count}* for this group.\nUsers will be kicked after ${count} warnings.`,
      );
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setantibad",
    aliases: ["antibad", "antibadwords", "badwordfilter"],
    react: "⚙️",
    category: "group",
    description: "Set anti-badwords for this group (on/warn/delete/kick/off)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const input = (q || "").toLowerCase().trim();
    const modeMap = {
      on: "delete",
      off: "false",
      true: "delete",
      false: "false",
      delete: "delete",
      kick: "kick",
      warn: "warn",
    };

    const value = modeMap[input];
    if (!value) {
      const warnCount = await getGroupSetting(from, "ANTIBAD_WARN_COUNT");
      const { getBadWords } = require("../gift/database/groupSettings");
      const badWords = await getBadWords(from);
      return reply(`❌ Please specify a mode:
• *on/delete* - Delete bad word messages
• *warn* - Warn user, kick after ${warnCount} warnings
• *kick* - Delete & immediately kick user
• *off* - Disable anti-badwords

Current bad words (${badWords.length}): ${badWords.length > 0 ? badWords.slice(0, 10).join(", ") + (badWords.length > 10 ? "..." : "") : "None set"}`);
    }

    try {
      const current = await getGroupSetting(from, "ANTIBAD");
      if (current === value) {
        const displayVal = value === "false" ? "OFF" : value.toUpperCase();
        return reply(`⚠️ Anti-badwords is already: *${displayVal}*`);
      }
      await setGroupSetting(from, "ANTIBAD", value);
      await react("✅");
      const displayVal = value === "false" ? "OFF" : value.toUpperCase();
      let msg = `✅ Anti-BadWords: *${displayVal}*`;
      if (value === "warn") {
        const warnCount = await getGroupSetting(from, "ANTIBAD_WARN_COUNT");
        msg += `\nKick after *${warnCount}* warnings`;
      }
      if (value !== "false") {
        msg += `\n\nUse *.badwords add <word>* to add prohibited words`;
      }
      await reply(msg);
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "antibadwarn",
    aliases: ["badwarncount", "antibadwarncount", "setbadwarn"],
    react: "⚙️",
    category: "group",
    description: "Set anti-badwords warning count before kick (default 5)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const count = parseInt(q);
    if (!q) {
      const current =
        (await getGroupSetting(from, "ANTIBAD_WARN_COUNT")) || "5";
      return reply(
        `⚠️ Current bad word warn count: *${current}*\nUsage: .antibadwarn 3`,
      );
    }

    if (isNaN(count) || count < 1 || count > 10) {
      return reply("❌ Please provide a number between 1-10");
    }

    try {
      await setGroupSetting(from, "ANTIBAD_WARN_COUNT", count.toString());
      await react("✅");
      await reply(
        `✅ Anti-badwords warn count set to: *${count}*\nUsers will be kicked after ${count} warnings.`,
      );
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "badwords",
    aliases: ["setbadwords", "badword", "profanity"],
    react: "🚫",
    category: "group",
    description:
      "Manage bad words list. Usage: .badwords add/remove/list/clear/default",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser, isGroup, isAdmin, args } = conText;
    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const {
      getBadWords,
      addBadWord,
      removeBadWord,
      clearBadWords,
      initializeDefaultBadWords,
      DEFAULT_BAD_WORDS,
    } = require("../gift/database/groupSettings");

    const action = (args[0] || "").toLowerCase();
    const words = args.slice(1);

    if (
      !action ||
      ![
        "add",
        "remove",
        "del",
        "delete",
        "list",
        "clear",
        "reset",
        "default",
        "defaults",
      ].includes(action)
    ) {
      const badWords = await getBadWords(from);
      return reply(`📋 *Bad Words Management*

*Usage:*
• *.badwords add <word>* - Add a bad word
• *.badwords add <word1> <word2>* - Add multiple words
• *.badwords remove <word>* - Remove a word
• *.badwords list* - Show all bad words
• *.badwords clear* - Remove all bad words
• *.badwords default* - Load default offensive words (${DEFAULT_BAD_WORDS.length})

*Current list (${badWords.length}):*
${
  badWords.length > 0
    ? badWords
        .slice(0, 15)
        .map((w, i) => `${i + 1}. ${w}`)
        .join("\n") +
      (badWords.length > 15 ? `\n... and ${badWords.length - 15} more` : "")
    : "_No bad words set_"
}`);
    }

    try {
      if (action === "add") {
        if (words.length === 0) {
          return reply(
            "❌ Please provide word(s) to add!\nUsage: .badwords add word1 word2",
          );
        }

        let added = 0;
        for (const word of words) {
          if (word.length >= 2) {
            await addBadWord(from, word);
            added++;
          }
        }

        await react("✅");
        await reply(`✅ Added *${added}* bad word(s) to the filter.`);
      } else if (["remove", "del", "delete"].includes(action)) {
        if (words.length === 0) {
          return reply(
            "❌ Please provide word(s) to remove!\nUsage: .badwords remove word1",
          );
        }

        let removed = 0;
        for (const word of words) {
          const success = await removeBadWord(from, word);
          if (success) removed++;
        }

        await react("✅");
        await reply(`✅ Removed *${removed}* word(s) from the filter.`);
      } else if (action === "list") {
        const badWords = await getBadWords(from);
        if (badWords.length === 0) {
          return reply(
            "📭 No bad words set for this group.\nUse *.badwords add <word>* to add words.",
          );
        }

        const chunks = [];
        for (let i = 0; i < badWords.length; i += 20) {
          chunks.push(badWords.slice(i, i + 20));
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const startIdx = i * 20;
          let msg =
            i === 0
              ? `🚫 *BAD WORDS LIST* (${badWords.length} total)\n\n`
              : `🚫 *BAD WORDS* (continued)\n\n`;
          msg += chunk
            .map((w, idx) => `${startIdx + idx + 1}. ${w}`)
            .join("\n");
          await Gifted.sendMessage(from, { text: msg });
        }
        await react("✅");
      } else if (["clear", "reset"].includes(action)) {
        await clearBadWords(from);
        await react("✅");
        await reply("✅ All bad words have been cleared for this group.");
      } else if (["default", "defaults"].includes(action)) {
        const added = await initializeDefaultBadWords(from);
        await react("✅");
        const total = await getBadWords(from);
        await reply(
          `✅ Default bad words loaded!\n\n*Added:* ${added} new words\n*Total:* ${total.length} bad words`,
        );
      }
    } catch (error) {
      await reply(`❌ Error: ${error.message}`);
    }
  },
);
