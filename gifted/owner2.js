const { gmd, commands, getSetting } = require("../gift");
const fs = require("fs").promises;
const fsA = require("node:fs");
const { S_WHATSAPP_NET } = require("gifted-baileys");
const { Jimp } = require("jimp");
const path = require("path");
const moment = require("moment-timezone");
const {
  groupCache,
  getGroupMetadata,
  cachedGroupMetadata,
} = require("../gift/connection/groupCache");


gmd(
  {
    pattern: "owner",
    react: "👑",
    category: "owner",
    description: "Get Bot Owner.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, isSuperUser, ownerNumber, ownerName, botName } =
      conText;

    if (!isSuperUser) {
      await react("❌");
      return reply(`Owner Only Command!`);
    }

    try {
      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        `FN:${ownerName}\n` +
        `ORG:${botName};\n` +
        `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` +
        "END:VCARD";

      await Gifted.sendMessage(
        from,
        {
          contacts: {
            displayName: ownerName,
            contacts: [{ vcard }],
          },
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (error) {
      await react("❌");
      await reply(`❌ Failed: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "gcpp",
    aliases: ["setgcpp", "gcfullpp", "fullgcpp"],
    react: "🔮",
    category: "group",
    description: "Set group full profile picture without cropping.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, quoted, isGroup, isSuperUser, isAdmin } =
      conText;

    if (!isAdmin) {
      await react("❌");
      return reply(`Admin Only Command!`);
    }

    if (!isGroup) {
      await react("❌");
      return reply(`Command can only be used in groups!`);
    }

    let tempFilePath;
    try {
      const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
      if (!quotedImg) {
        await react("❌");
        return reply("Please quote an image");
      }
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        quotedImg,
        "temp_media",
      );

      const image = await Jimp.read(tempFilePath);
      image.crop({ x: 0, y: 0, w: image.width, h: image.height });
      image.scaleToFit({ w: 720, h: 720 });
      const imageBuffer = await image.getBuffer("image/jpeg");

      const pictureNode = {
        tag: "picture",
        attrs: { type: "image" },
        content: imageBuffer,
      };

      const iqNode = {
        tag: "iq",
        attrs: {
          to: S_WHATSAPP_NET,
          type: "set",
          xmlns: "w:profile:picture",
          target: from,
        },
        content: [pictureNode],
      };

      await Gifted.query(iqNode);
      await react("✅");
      await fs.unlink(tempFilePath);
      await reply(
        "✅ Group Profile picture updated successfully (full image)!",
      );
    } catch (error) {
      console.error("Error updating group profile picture:", error);

      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(console.error);
      }

      if (
        error.message.includes("not-authorized") ||
        error.message.includes("forbidden")
      ) {
        await reply(
          "❌ I need to be an admin to update group profile picture!",
        );
      } else {
        await reply(
          `❌ Failed to update group profile picture: ${error.message}`,
        );
      }
      await react("❌");
    }
  },
);

gmd(
  {
    pattern: "fullpp",
    aliases: ["setfullpp"],
    react: "🔮",
    category: "owner",
    description: "Set full profile picture without cropping.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, quoted, isSuperUser } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply(`Owner Only Command!`);
    }
    let tempFilePath;
    try {
      const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
      if (!quotedImg) {
        await react("❌");
        return reply("Please quote an image");
      }
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        quotedImg,
        "temp_media",
      );

      const image = await Jimp.read(tempFilePath);
      image.crop({ x: 0, y: 0, w: image.width, h: image.height });
      image.scaleToFit({ w: 720, h: 720 });
      const imageBuffer = await image.getBuffer("image/jpeg");

      const pictureNode = {
        tag: "picture",
        attrs: { type: "image" },
        content: imageBuffer,
      };

      const iqNode = {
        tag: "iq",
        attrs: {
          to: S_WHATSAPP_NET,
          type: "set",
          xmlns: "w:profile:picture",
        },
        content: [pictureNode],
      };

      await Gifted.query(iqNode);
      await react("✅");
      await fs.unlink(tempFilePath);
      await reply("✅ Profile picture updated successfully (full image)!");
    } catch (error) {
      console.error("Error updating profile picture:", error);

      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(console.error);
      }

      await reply(`❌ Failed to update profile picture: ${error.message}`);
      await react("❌");
    }
  },
);

gmd(
  {
    pattern: "whois",
    aliases: ["profile"],
    react: "👀",
    category: "owner",
    description: "Get someone's full profile details.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      sender,
      quoted,
      timeZone,
      isGroup,
      quotedMsg,
      newsletterJid,
      quotedUser,
      botName,
      botFooter,
      isSuperUser,
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply(`Owner Only Command!`);
    }

    if (!quotedUser) {
      await react("❌");
      return reply(`Please reply to/quote a user or their message!`);
    }

    let profilePictureUrl;
    let statusText = "Not Found";
    let setAt = "Not Available";
    let targetUser = quotedUser;

    try {
      if (quoted) {
        if (isGroup && !targetUser.endsWith("@s.whatsapp.net")) {
          try {
            const jid = await Gifted.getJidFromLid(targetUser);
            if (jid) targetUser = jid;
          } catch (error) {}
        }

        try {
          profilePictureUrl = await Gifted.profilePictureUrl(
            targetUser,
            "image",
          );
        } catch (error) {
          profilePictureUrl =
            "https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg";
        }

        try {
          const statusData = await Gifted.fetchStatus(targetUser);
          if (statusData && statusData.length > 0 && statusData[0].status) {
            statusText = statusData[0].status.status || "Not Found";
            const rawSetAt = statusData[0].status.setAt;
            if (rawSetAt) {
              const ts = rawSetAt instanceof Date ? rawSetAt.getTime() : (typeof rawSetAt === 'number' ? (rawSetAt < 1e12 ? rawSetAt * 1000 : rawSetAt) : new Date(rawSetAt).getTime());
              setAt = ts;
            }
          }
        } catch (error) {}

        let formattedDate = "Not Available";
        if (setAt && setAt !== "Not Available") {
          try {
            const tz = timeZone || "Africa/Nairobi";
            formattedDate = moment(setAt)
              .tz(tz)
              .format("dddd, MMMM Do YYYY, h:mm A z");
          } catch (e) {}
        }

        const number = targetUser.replace(/@s\.whatsapp\.net$/, "");

        await Gifted.sendMessage(
          from,
          {
            image: { url: profilePictureUrl },
            caption:
              `*👤 User Profile Information*\n\n` +
              `*• Name:* @${number}\n` +
              `*• Number:* ${number}\n` +
              `*• About:* ${statusText}\n` +
              `*• Last Updated:* ${formattedDate}\n\n` +
              `_${botFooter}_`,
            contextInfo: {
              mentionedJid: [targetUser],
              forwardingScore: 5,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: botName,
                serverMessageId: 143,
              },
            },
          },
          { quoted: mek },
        );
        await react("✅");
      }
    } catch (error) {
      console.error("Error in whois command:", error);
      await reply(
        `❌ An error occurred while fetching profile information.\nError: ${error.message}`,
      );
      await react("❌");
    }
  },
);

gmd(
  {
    pattern: "pp",
    aliases: ["setpp"],
    react: "🔮",
    category: "owner",
    description: "Set new profile picture.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, quoted, isSuperUser } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply(`Owner Only Command!`);
    }

    try {
      const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
      if (!quotedImg) {
        await react("❌");
        return reply("Please quote an image");
      }

      const tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        quotedImg,
        "temp_media",
      );
      const imageBuffer = await fs.readFile(tempFilePath);
      try {
        await Gifted.updateProfilePicture(Gifted.user.id, {
          url: tempFilePath,
        });
        await reply("Profile picture updated successfully!");
        await react("✅");
      } catch (modernError) {
        console.log("Modern method failed, trying legacy method...");

        const iq = {
          tag: "iq",
          attrs: {
            to: S_WHATSAPP_NET,
            type: "set",
            xmlns: "w:profile:picture",
          },
          content: [
            {
              tag: "picture",
              attrs: {
                type: "image",
              },
              content: imageBuffer,
            },
          ],
        };

        await Gifted.query(iq);
        await reply("Profile picture update requested (legacy method)");
        await react("✅");
      }
      await fs.unlink(tempFilePath).catch(console.error);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      await reply(`❌ An error occurred: ${error.message}`);
      await react("❌");
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(console.error);
      }
    }
  },
);

gmd(
  {
    pattern: "getpp",
    aliases: ["stealpp", "snatchpp"],
    react: "👀",
    category: "owner",
    description: "Download someone's profile picture.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      sender,
      quoted,
      quotedMsg,
      newsletterJid,
      quotedUser,
      botName,
      botFooter,
      isSuperUser,
    } = conText;

    if (!isSuperUser) {
      await react("❌");
      return reply(`Owner Only Command!`);
    }

    if (!quotedMsg) {
      await react("❌");
      return reply(
        `Please reply to/quote a user to get their profile picture!`,
      );
    }

    let profilePictureUrl;

    try {
      if (quoted) {
        try {
          profilePictureUrl = await Gifted.profilePictureUrl(
            quotedUser,
            "image",
          );
        } catch (error) {
          await react("❌");
          return reply(
            `User does not have profile picture or they have set it to private!`,
          );
        }

        await Gifted.sendMessage(
          from,
          {
            image: { url: profilePictureUrl },
            caption: `Here is the Profile Picture\n\n> *${botFooter}*`,
            contextInfo: {
              mentionedJid: [quotedUser],
              forwardingScore: 5,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: botName,
                serverMessageId: 143,
              },
            },
          },
          { quoted: mek },
        );
        await react("✅");
      }
    } catch (error) {
      console.error("Error processing profile picture:", error);
      await reply(`❌ An error occurred while fetching the profile picture.`);
      await react("❌");
    }
  },
);

gmd(
  {
    pattern: "getgcpp",
    aliases: ["stealgcpp", "snatchgcpp"],
    react: "👀",
    category: "group",
    description: "Download group profile picture",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, isGroup, newsletterJid, botName, botFooter } =
      conText;

    if (!isGroup) {
      await react("❌");
      return reply("❌ This command only works in groups!");
    }

    try {
      let profilePictureUrl;
      try {
        profilePictureUrl = await Gifted.profilePictureUrl(from, "image");
      } catch (error) {
        await react("❌");
        return reply("❌ This group has no profile picture set!");
      }

      await Gifted.sendMessage(
        from,
        {
          image: { url: profilePictureUrl },
          caption: `🖼️ *Group Profile Picture*\n\n${botFooter ? `_${botFooter}_` : ""}`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143,
            },
          },
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (error) {
      console.error("getgcpp error:", error);
      await react("❌");
      await reply(`❌ Failed to get group picture: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "vv2",
    aliases: ["‎2", "reveal2"],
    react: "🙄",
    category: "owner",
    description: "Reveal View Once Media",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, quoted, react, botName, isSuperUser } = conText;

    if (!quoted) return reply(`Please reply to/quote a ViewOnce message`);
    if (!isSuperUser) return reply(`Owner Only Command!`);

    let viewOnceContent, mediaType;

    if (
      quoted.imageMessage?.viewOnce ||
      quoted.videoMessage?.viewOnce ||
      quoted.audioMessage?.viewOnce
    ) {
      mediaType = Object.keys(quoted).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t)),
      );
      viewOnceContent = { [mediaType]: quoted[mediaType] };
    } else if (quoted.viewOnceMessage) {
      viewOnceContent = quoted.viewOnceMessage.message;
      mediaType = Object.keys(viewOnceContent).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t)),
      );
    } else {
      return reply("Please reply to a view once media message.");
    }

    if (!mediaType) return reply("Unsupported ViewOnce message type.");

    let msg;
    let tempFilePath = null;

    try {
      const mediaMessage = {
        ...viewOnceContent[mediaType],
        viewOnce: false,
      };

      const path = require("path");
      const tempDir = path.join(__dirname, "..", "gift", "temp");
      const tempFileName = `vv2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        mediaMessage,
        path.join(tempDir, tempFileName),
      );

      const originalCaption = mediaMessage.caption || "";
      const caption = originalCaption
        ? `${originalCaption}\n\n> *REVEALED BY ${botName}*`
        : `> *REVEALED BY ${botName}*`;
      const mime = mediaMessage.mimetype || "";

      if (mediaType.includes("image")) {
        msg = {
          image: { url: tempFilePath },
          caption,
          mimetype: mime,
        };
      } else if (mediaType.includes("video")) {
        msg = {
          video: { url: tempFilePath },
          caption,
          mimetype: mime,
        };
      } else if (mediaType.includes("audio")) {
        msg = {
          audio: { url: tempFilePath },
          ptt: true,
          mimetype: mime || "audio/mp4",
        };
      }

      await Gifted.sendMessage(from, msg);
      await react("✅");
    } catch (e) {
      console.error("Error in vv2 command:", e);
      reply(`Error: ${e.message}`);
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error("Failed to clean up temp file:", cleanupError);
        }
      }
    }
  },
);

gmd(
  {
    pattern: "vv",
    aliases: ["‎", "reveal"],
    react: "🙄",
    category: "owner",
    description: "Reveal View Once Media",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, quoted, react, botName, isSuperUser, sender } = conText;

    if (!quoted) return reply(`Please reply to/quote a ViewOnce message`);
    if (!isSuperUser) return reply(`Owner Only Command!`);

    let viewOnceContent, mediaType;

    if (
      quoted.imageMessage?.viewOnce ||
      quoted.videoMessage?.viewOnce ||
      quoted.audioMessage?.viewOnce
    ) {
      mediaType = Object.keys(quoted).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t)),
      );
      viewOnceContent = { [mediaType]: quoted[mediaType] };
    } else if (quoted.viewOnceMessage) {
      viewOnceContent = quoted.viewOnceMessage.message;
      mediaType = Object.keys(viewOnceContent).find(
        (key) =>
          key.endsWith("Message") &&
          ["image", "video", "audio"].some((t) => key.includes(t)),
      );
    } else {
      return reply("Please reply to a view once media message.");
    }

    if (!mediaType) return reply("Unsupported ViewOnce message type.");

    let msg;
    let tempFilePath = null;

    try {
      const mediaMessage = {
        ...viewOnceContent[mediaType],
        viewOnce: false,
      };

      const path = require("path");
      const tempDir = path.join(__dirname, "..", "gift", "temp");
      const tempFileName = `vv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        mediaMessage,
        path.join(tempDir, tempFileName),
      );

      const originalCaption = mediaMessage.caption || "";
      const caption = originalCaption
        ? `${originalCaption}\n\n> *REVEALED BY ${botName}*`
        : `> *REVEALED BY ${botName}*`;
      const mime = mediaMessage.mimetype || "";

      if (mediaType.includes("image")) {
        msg = {
          image: { url: tempFilePath },
          caption,
          mimetype: mime,
        };
      } else if (mediaType.includes("video")) {
        msg = {
          video: { url: tempFilePath },
          caption,
          mimetype: mime,
        };
      } else if (mediaType.includes("audio")) {
        msg = {
          audio: { url: tempFilePath },
          ptt: true,
          mimetype: mime || "audio/mp4",
        };
      }

      await Gifted.sendMessage(sender, msg);
      await react("✅");
    } catch (e) {
      console.error("Error in vv command:", e);
      reply(`Error: ${e.message}`);
    } finally {
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error("Failed to clean up temp file:", cleanupError);
        }
      }
    }
  },
);

gmd(
  {
    pattern: "disapp",
    aliases: ["disappearing", "disappear", "ephemeral", "vanish"],
    react: "⏱️",
    category: "group",
    description: "Toggle disappearing messages. Usage: .disapp on/off/1/7/90",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isSuperUser,
      isGroup,
      isAdmin,
      isSuperAdmin,
      q,
      args,
    } = conText;

    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    const input = (args[0] || "").toLowerCase();

    if (!input) {
      return reply(
        "📌 *Disappearing Messages*\n\n" +
          "*Usage:*\n" +
          "• .disapp on - Enable (24 hours default)\n" +
          "• .disapp off - Disable\n" +
          "• .disapp 1 - Enable for 1 day\n" +
          "• .disapp 7 - Enable for 7 days\n" +
          "• .disapp 90 - Enable for 90 days",
      );
    }

    try {
      let duration = 0;
      let durationText = "";

      if (input === "off" || input === "0") {
        duration = 0;
        durationText = "disabled";
      } else if (input === "on") {
        duration = 86400;
        durationText = "24 hours";
      } else if (input === "1") {
        duration = 86400;
        durationText = "1 day";
      } else if (input === "7") {
        duration = 604800;
        durationText = "7 days";
      } else if (input === "90") {
        duration = 7776000;
        durationText = "90 days";
      } else {
        return reply("❌ Invalid option. Use: on, off, 1, 7, or 90");
      }

      await Gifted.sendMessage(from, { disappearingMessagesInChat: duration });

      await react("✅");
      if (duration === 0) {
        return reply("✅ Disappearing messages *disabled* for this chat.");
      } else {
        return reply(
          `✅ Disappearing messages *enabled* for *${durationText}*!`,
        );
      }
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to set disappearing messages: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "del",
    aliases: ["delete", "dlt", "remove"],
    react: "🗑️",
    category: "group",
    description: "Delete a quoted message",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      isAdmin,
      isGroup,
      quotedMsg,
      quotedKey,
      isBotAdmin,
    } = conText;

    if (!isGroup) return reply("❌ This command only works in groups!");
    if (!isSuperUser && !isAdmin) return reply("❌ Admin/Owner Only Command!");

    if (!quotedMsg || !quotedKey)
      return reply("❌ Please quote a message to delete!");

    try {
      const isBotMessage = quotedKey.fromMe;

      if (!isBotMessage && !isBotAdmin) {
        return reply(
          "❌ Bot needs admin rights to delete others' messages in groups!",
        );
      }

      await Gifted.sendMessage(from, { delete: quotedKey });
      await react("✅");
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to delete message: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "mygroups",
    aliases: ["listgroups", "groups", "allgroups", "fetchgroups"],
    react: "👥",
    category: "owner",
    description: "List all groups the bot is in",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser } = conText;

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    try {
      await react("⏳");

      const groups = await Gifted.groupFetchAllParticipating();
      const groupList = Object.values(groups);

      if (groupList.length === 0) {
        return reply("📭 Bot is not in any groups.");
      }

      const chunkSize = 15;
      const chunks = [];
      for (let i = 0; i < groupList.length; i += chunkSize) {
        chunks.push(groupList.slice(i, i + chunkSize));
      }

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const startIdx = chunkIndex * chunkSize;
        let message =
          chunkIndex === 0
            ? `📋 *MY GROUPS* (${groupList.length} total)\n\n`
            : `📋 *MY GROUPS* (continued ${chunkIndex + 1}/${chunks.length})\n\n`;

        chunk.forEach((group, index) => {
          const memberCount = group.participants?.length || 0;
          message += `*${startIdx + index + 1}.* ${group.subject}\n`;
          message += `   📱 Members: ${memberCount}\n`;
          message += `   🆔 ${group.id}\n\n`;
        });

        await Gifted.sendMessage(from, { text: message });
        if (chunkIndex < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      await react("✅");
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to fetch groups: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "block",
    aliases: ["blockuser"],
    react: "🚫",
    category: "owner",
    description: "Block a user. Reply to their message or provide number",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      quotedUser,
      args,
      mentionedJid,
      superUser,
    } = conText;
    const { isJidGroup } = require("gifted-baileys");
    const { convertLidToJid } = require("../gift/connection/serializer");

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    let targetJid;
    let rawTarget;

    if (quotedUser) {
      rawTarget = quotedUser;
    } else if (mentionedJid && mentionedJid.length > 0) {
      rawTarget = mentionedJid[0];
    } else if (args[0]) {
      rawTarget = args[0];
    } else if (!isJidGroup(from)) {
      rawTarget = from;
    }

    if (!rawTarget) {
      return reply(
        "❌ Please reply to a message, mention someone, or provide a number!",
      );
    }

    if (rawTarget.endsWith("@lid")) {
      const converted = convertLidToJid(rawTarget);
      if (converted) rawTarget = converted;
    }

    const num = rawTarget.split("@")[0].replace(/[^0-9]/g, "");
    if (!num || num.length < 6) {
      return reply("❌ Could not determine valid phone number!");
    }
    targetJid = `${num}@s.whatsapp.net`;

    if (superUser && superUser.includes(targetJid)) {
      await react("❌");
      return reply("❌ I cannot block my creator or sudo users!");
    }

    try {
      await Gifted.updateBlockStatus(targetJid, "block");
      await react("✅");
      return reply(`✅ Blocked @${num}`, { mentions: [targetJid] });
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to block: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "unblock",
    aliases: ["unblockuser"],
    react: "✅",
    category: "owner",
    description: "Unblock a user. Reply to their message or provide number",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, quotedUser, args, mentionedJid } =
      conText;
    const { isJidGroup } = require("gifted-baileys");
    const { convertLidToJid } = require("../gift/connection/serializer");

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    let targetJid;
    let rawTarget;

    if (quotedUser) {
      rawTarget = quotedUser;
    } else if (mentionedJid && mentionedJid.length > 0) {
      rawTarget = mentionedJid[0];
    } else if (args[0]) {
      rawTarget = args[0];
    } else if (!isJidGroup(from)) {
      rawTarget = from;
    }

    if (!rawTarget) {
      return reply(
        "❌ Please reply to a message, mention someone, or provide a number!",
      );
    }

    if (rawTarget.endsWith("@lid")) {
      const converted = convertLidToJid(rawTarget);
      if (converted) rawTarget = converted;
    }

    const num = rawTarget.split("@")[0].replace(/[^0-9]/g, "");
    if (!num || num.length < 6) {
      return reply("❌ Could not determine valid phone number!");
    }
    targetJid = `${num}@s.whatsapp.net`;

    try {
      await Gifted.updateBlockStatus(targetJid, "unblock");
      await react("✅");
      return reply(`✅ Unblocked @${num}`, { mentions: [targetJid] });
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to unblock: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "blocklist",
    aliases: ["blocked", "listblocked"],
    react: "🚫",
    category: "owner",
    description: "List all blocked contacts",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser } = conText;
    const { convertLidToJid } = require("../gift/connection/serializer");

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    try {
      const blockedList = await Gifted.fetchBlocklist();

      if (blockedList.length === 0) {
        return reply("📭 No blocked contacts.");
      }

      const convertedList = blockedList.map(
        (jid) => convertLidToJid(jid) || jid,
      );

      let message = `🚫 *BLOCKED CONTACTS* (${convertedList.length})\n\n`;
      convertedList.forEach((jid, index) => {
        message += `${index + 1}. @${jid.split("@")[0]}\n`;
      });

      await react("✅");
      return reply(message, { mentions: convertedList });
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to fetch blocklist: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "forward",
    aliases: ["fwd"],
    react: "↪️",
    category: "owner",
    description:
      "Forward a quoted message to a number/group. Usage: .fwd <jid> [custom caption]",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isSuperUser,
      quotedMsg,
      args,
      mek,
      isGroup,
      groupName,
      botName,
      newsletterJid,
    } = conText;
    const { downloadMediaMessage } = require("../gift/connection/serializer");
    const { isJidGroup } = require("gifted-baileys");

    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!quotedMsg) return reply("❌ Please quote a message to forward!");
    if (!args[0])
      return reply(
        "❌ Please provide a number or group JID!\n\nUsage: .forward 254712345678 [caption]",
      );

    try {
      let targetJid = args[0];
      if (!targetJid.includes("@")) {
        if (targetJid.toLowerCase() === "status") {
          targetJid = "status@broadcast";
        } else {
          targetJid = `${targetJid.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
        }
      }

      let sourceName = botName || "𝐀𝐓𝐀𝐒𝐒𝐀-𝐌𝐃";
      if (isGroup && groupName) {
        sourceName = groupName;
      } else if (!isGroup) {
        sourceName = "Private Chat";
      }

      const forwardContextInfo = {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid || "120363403054496228@newsletter",
          newsletterName: sourceName,
          serverMessageId: -1,
        },
      };

      const customCaption = args.slice(1).join(" ") || null;
      const msgType = Object.keys(quotedMsg)[0];
      const { downloadContentFromMessage } = require("gifted-baileys");

      if (msgType === "conversation" || msgType === "extendedTextMessage") {
        const text =
          quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";
        await Gifted.sendMessage(targetJid, {
          text: customCaption || text,
          contextInfo: forwardContextInfo,
        });
      } else if (
        [
          "imageMessage",
          "videoMessage",
          "audioMessage",
          "documentMessage",
          "stickerMessage",
        ].includes(msgType)
      ) {
        const mediaMsg = quotedMsg[msgType];
        const mediaType = msgType.replace("Message", "");

        let buffer;
        try {
          const stream = await downloadContentFromMessage(mediaMsg, mediaType);
          const chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        } catch (dlErr) {
          const altDownload =
            require("../gift/connection/serializer").downloadMediaMessage;
          const fakeMsg = { key: { remoteJid: from }, message: quotedMsg };
          buffer = await altDownload(fakeMsg, Gifted);
        }

        if (!buffer || buffer.length === 0) {
          return reply("❌ Failed to download media!");
        }

        const originalCaption = mediaMsg?.caption || "";
        const caption =
          customCaption !== null ? customCaption : originalCaption;
        const mimetype = mediaMsg?.mimetype;
        const filename =
          mediaMsg?.fileName || `file.${mimetype?.split("/")[1] || "bin"}`;

        if (msgType === "imageMessage") {
          await Gifted.sendMessage(targetJid, {
            image: buffer,
            caption,
            contextInfo: forwardContextInfo,
          });
        } else if (msgType === "videoMessage") {
          await Gifted.sendMessage(targetJid, {
            video: buffer,
            caption,
            mimetype,
            contextInfo: forwardContextInfo,
          });
        } else if (msgType === "audioMessage") {
          await Gifted.sendMessage(targetJid, {
            audio: buffer,
            mimetype,
            ptt: mediaMsg?.ptt,
            contextInfo: forwardContextInfo,
          });
        } else if (msgType === "documentMessage") {
          await Gifted.sendMessage(targetJid, {
            document: buffer,
            mimetype,
            fileName: filename,
            caption,
            contextInfo: forwardContextInfo,
          });
        } else if (msgType === "stickerMessage") {
          await Gifted.sendMessage(targetJid, { sticker: buffer });
        }
      } else {
        return reply(`❌ Unsupported message type: ${msgType}`);
      }

      await react("✅");
      const targetName =
        targetJid === "status@broadcast" ? "status" : targetJid.split("@")[0];
      return reply(`✅ Message forwarded to ${targetName}!`);
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to forward: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "tostatus",
    aliases: ["tomystatus", "statusfwd", "fwdstatus"],
    react: "📢",
    category: "owner",
    description:
      "Forward quoted message to your WhatsApp status. Usage: .tostatus [custom caption]",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, quotedMsg, q, mek } = conText;
    const { downloadMediaMessage } = require("../gift/connection/serializer");

    if (!isSuperUser) return reply("❌ Owner Only Command!");
    if (!quotedMsg)
      return reply("❌ Please quote a message to post to status!");

    try {
      const statusJid = "status@broadcast";
      const customCaption = q?.trim() || null;
      const msgType = Object.keys(quotedMsg)[0];

      if (msgType === "conversation" || msgType === "extendedTextMessage") {
        const text =
          quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";
        const statusText = customCaption || text;
        await Gifted.sendMessage(
          statusJid,
          {
            text: statusText,
            backgroundColor: "#075e54",
            font: 1,
          },
          { statusJidList: await getStatusJidList(Gifted) },
        );
      } else if (["imageMessage", "videoMessage"].includes(msgType)) {
        const contextInfo =
          mek.message?.extendedTextMessage?.contextInfo ||
          mek.message?.imageMessage?.contextInfo ||
          mek.message?.videoMessage?.contextInfo ||
          {};

        const fakeMsg = {
          key: { remoteJid: from, id: contextInfo.stanzaId },
          message: quotedMsg,
        };

        const buffer = await downloadMediaMessage(fakeMsg, Gifted);
        if (!buffer) {
          return reply("❌ Failed to download media!");
        }

        const originalCaption = quotedMsg[msgType]?.caption || "";
        const caption =
          customCaption !== null ? customCaption : originalCaption;
        const statusJidList = await getStatusJidList(Gifted);

        if (msgType === "imageMessage") {
          await Gifted.sendMessage(
            statusJid,
            { image: buffer, caption },
            { statusJidList },
          );
        } else if (msgType === "videoMessage") {
          await Gifted.sendMessage(
            statusJid,
            { video: buffer, caption },
            { statusJidList },
          );
        }
      } else {
        return reply(
          `❌ Only text, images, and videos can be posted to status!`,
        );
      }

      await react("✅");
      return reply("✅ Posted to your status!");
    } catch (error) {
      await react("❌");
      return reply(`❌ Failed to post to status: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "join",
    aliases: ["joingc", "joingroup"],
    react: "🔗",
    category: "owner",
    description: "Join a group using invite link. Owner only.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, q, isSuperUser, mek, botName, newsletterJid } =
      conText;

    if (!isSuperUser) return reply("❌ Owner Only Command!");

    if (!q) {
      await react("❌");
      return reply(
        "❌ Please provide a group invite link.\nExample: .join https://chat.whatsapp.com/ABC123xyz",
      );
    }

    const linkMatch = q.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
    if (!linkMatch) {
      await react("❌");
      return reply(
        "❌ Invalid group invite link. Please provide a valid WhatsApp group link.",
      );
    }

    const inviteCode = linkMatch[1];

    try {
      const groupId = await Gifted.groupAcceptInvite(inviteCode);

      if (groupId) {
        await react("✅");
        await reply(`✅ Successfully joined group!\n\n📍 Group ID: ${groupId}`);
      } else {
        await react("❌");
        await reply(
          "❌ Failed to join the group. The invite link may be invalid or expired.",
        );
      }
    } catch (error) {
      await react("❌");
      const errMsg = error.message || String(error);

      if (errMsg.includes("conflict") || errMsg.includes("already")) {
        return reply("❌ Bot is already a member of this group.");
      } else if (errMsg.includes("gone") || errMsg.includes("expired")) {
        return reply("❌ This invite link has expired or been revoked.");
      } else if (errMsg.includes("forbidden")) {
        return reply("❌ Bot is not allowed to join this group.");
      }

      return reply(`❌ Failed to join group: ${errMsg}`);
    }
  },
);

async function getStatusJidList(Gifted) {
  try {
    const contacts = await Gifted.groupFetchAllParticipating();
    const jidList = [];
    for (const group of Object.values(contacts)) {
      if (group.participants) {
        for (const p of group.participants) {
          const jid = p.id || p.pn || p.phoneNumber;
          if (jid && jid.endsWith("@s.whatsapp.net")) {
            jidList.push(jid);
          }
        }
      }
    }
    return [...new Set(jidList)];
  } catch (e) {
    return [];
  }
}
