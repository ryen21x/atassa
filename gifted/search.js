const { gmd, gmdSticker } = require("../gift"),
  acrcloud = require("acrcloud"),
  fs = require("fs").promises,
  axios = require("axios"),
  stream = require("stream"),
  { promisify } = require("util"),
  pipeline = promisify(stream.pipeline),
  {
    generateWAMessageContent,
    generateWAMessageFromContent,
  } = require("gifted-baileys"),
  { sendButtons } = require("gifted-btns"),
  { StickerTypes } = require("wa-sticker-formatter");

gmd(
  {
    pattern: "yts",
    aliases: ["yt-search"],
    category: "search",
    react: "🔍",
    description: "perform youtube search",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, sender, botFooter, gmdBuffer } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query");
    }

    try {
      const apiUrl = `https://yts.giftedtech.co.ke/?q=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 100000 });
      const results = res.data?.videos;

      if (!Array.isArray(results) || results.length === 0) return;

      const videos = results.slice(0, 5);
      const cards = await Promise.all(
        videos.map(async (vid, i) => ({
          header: {
            title: `🎬 *${vid.name}*`,
            hasMediaAttachment: true,
            imageMessage: (
              await generateWAMessageContent(
                { image: { url: vid.thumbnail } },
                {
                  upload: Gifted.waUploadToServer,
                },
              )
            ).imageMessage,
          },
          body: {
            text: `📺 Duration: ${vid.duration}\n👁️ Views: ${vid.views}${vid.published ? `\n📅 Published: ${vid.published}` : ""}`,
          },
          footer: { text: `> *${botFooter}*` },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy Link",
                  copy_code: vid.url,
                }),
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Watch on YouTube",
                  url: vid.url,
                }),
              },
            ],
          },
        })),
      );

      const message = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                body: { text: `🔍 YouTube Results for: *${q}*` },
                footer: {
                  text: `📂 Displaying first *${videos.length}* videos`,
                },
                carouselMessage: { cards },
              },
            },
          },
        },
        { quoted: mek },
      );

      await Gifted.relayMessage(from, message.message, {
        messageId: message.key.id,
      });

      await react("✅");
    } catch (error) {
      console.error("Error during search process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "shazam",
    aliases: ["whatmusic", "whatsong", "identify", "accr"],
    category: "search",
    react: "🙄",
    description: "Identify music from audio or video messages",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      botPic,
      quoted,
      quotedMsg,
      sender,
      botName,
      botFooter,
      newsletterJid,
    } = conText;

    if (!quotedMsg) {
      await react("❌");
      return reply(
        "Please reply to an audio or video message containing music",
      );
    }

    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage;

    if (!quotedAudio && !quotedVideo) {
      await react("❌");
      return reply("The quoted message doesn't contain any audio or video");
    }

    let tempFilePath;
    try {
      const acr = new acrcloud({
        host: "identify-us-west-2.acrcloud.com",
        access_key: "4ee38e62e85515a47158aeb3d26fb741",
        access_secret: "KZd3cUQoOYSmZQn1n5ACW5XSbqGlKLhg6G8S8EvJ",
      });

      tempFilePath = await Gifted.downloadAndSaveMediaMessage(
        quotedAudio || quotedVideo,
        "temp_media",
      );

      let buffer = await fs.readFile(tempFilePath);

      const MAX_SIZE = 1 * 1024 * 1024; // 1MB
      if (buffer.length > MAX_SIZE) {
        buffer = buffer.slice(0, MAX_SIZE);
      }

      const { status, metadata } = await acr.identify(buffer);

      if (status.code !== 0) {
        await react("❌");
        return reply(`Music identification failed: ${status.msg}`);
      }

      if (!metadata?.music?.[0]) {
        await react("❌");
        return reply("No music information found in the audio");
      }

      const { title, artists, album, genres, label, release_date } =
        metadata.music[0];

      let txt = `*${botName} 𝐒𝐇𝐀𝐙𝐀𝐌*\n\n`;
      txt += `*Title:* ${title || "Unknown"}\n`;
      if (artists?.length)
        txt += `*Artists:* ${artists.map((v) => v.name).join(", ")}\n`;
      if (album?.name) txt += `*Album:* ${album.name}\n`;
      if (genres?.length)
        txt += `*Genres:* ${genres.map((v) => v.name).join(", ")}\n`;
      if (label) txt += `*Label:* ${label}\n`;
      if (release_date) txt += `*Release Date:* ${release_date}\n`;
      txt += `\n> *${botFooter}*`;

      await Gifted.sendMessage(
        from,
        {
          image: { url: botPic },
          caption: txt,
          contextInfo: {
            mentionedJid: [sender],
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
    } catch (e) {
      console.error("Error in shazam command:", e);
      await react("❌");
      if (e.message.includes("empty media key")) {
        await reply(
          "The media keys have expired - please send a fresh audio/video message",
        );
      } else if (e.message.includes("too large")) {
        await reply(
          "The audio is too long. Please try with a shorter clip (10-20 seconds).",
        );
      } else {
        await reply(`❌ Error identifying music: ${e.message}`);
      }
    } finally {
      if (tempFilePath) {
        try {
          await fs.access(tempFilePath);
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          if (cleanupError.code !== "ENOENT") {
            console.error("Failed to clean up temp file:", cleanupError);
          }
        }
      }
    }
  },
);

gmd(
  {
    pattern: "google",
    aliases: ["ggle", "gglesearch", "googlesearch"],
    category: "search",
    react: "🔍",
    description: "Search Google and display first 5 results",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/google?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        !Array.isArray(res.data.results) ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No results found. Please try a different query.");
      }

      const results = res.data.results.slice(0, 5);

      const defaultImg =
        "https://files.giftedtech.co.ke/image/ZAwgoogle-images-1548419288.jpg";

      const cards = await Promise.all(
        results.map(async (result) => ({
          header: {
            title: `🔍 *${result.title}*`,
            hasMediaAttachment: true,
            imageMessage: (
              await generateWAMessageContent(
                { image: { url: defaultImg } },
                { upload: Gifted.waUploadToServer },
              )
            ).imageMessage,
          },
          body: {
            text: `📝 ${result.description || "No description"}`,
          },
          footer: { text: `> *${botFooter}*` },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy Link",
                  copy_code: result.link,
                }),
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Open Link",
                  url: result.link,
                }),
              },
            ],
          },
        })),
      );

      const message = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                body: { text: `🔍 Google Results for: *${q}*` },
                footer: {
                  text: `📂 Displaying first *${results.length}* results`,
                },
                carouselMessage: { cards },
              },
            },
          },
        },
        { quoted: mek },
      );

      await Gifted.relayMessage(from, message.message, {
        messageId: message.key.id,
      });
      await react("✅");
    } catch (error) {
      console.error("Google search error:", error);
      await react("❌");
      return reply("Failed to perform Google search. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "lyrics",
    aliases: ["songlyrics", "getlyrics"],
    category: "search",
    react: "🎵",
    description: "Get song lyrics with copy button",
  },
  async (from, Gifted, conText) => {
    const {
      q,
      mek,
      reply,
      react,
      botName,
      botFooter,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a song name");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/lyricsv2?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (!res.data?.success || !res.data?.result) {
        await react("❌");
        return reply("No lyrics found. Please try a different song.");
      }

      const { artist, title, lyrics } = res.data.result;

      let txt = `*${botName} 𝐋𝐘𝐑𝐈𝐂𝐒*\n\n`;
      txt += `🎤 *Artist:* ${artist || "Unknown"}\n`;
      txt += `🎵 *Title:* ${title || "Unknown"}\n\n`;
      txt += `${lyrics}\n\n`;

      await sendButtons(Gifted, from, {
        title: "",
        text: txt,
        footer: botFooter,
        buttons: [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Lyrics",
              copy_code: lyrics,
            }),
          },
        ],
      });

      await react("✅");
    } catch (error) {
      console.error("Lyrics search error:", error);
      await react("❌");
      return reply("Failed to get lyrics. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "happymod",
    aliases: ["modapks", "apkmod"],
    category: "search",
    react: "📱",
    description: "Search HappyMod for modded APKs",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide an app name to search");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/happymod?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (!res.data?.success || !res.data?.results?.data) {
        await react("❌");
        return reply("No results found. Please try a different query.");
      }

      const results = res.data.results.data.slice(0, 5);

      const cards = await Promise.all(
        results.map(async (app) => ({
          header: {
            title: `📱 *${app.name}*`,
            hasMediaAttachment: true,
            imageMessage: (
              await generateWAMessageContent(
                { image: { url: app.icon } },
                {
                  upload: Gifted.waUploadToServer,
                },
              )
            ).imageMessage,
          },
          body: {
            text: `📝 ${app.summary || "No description"}\n📦 Source: ${app.source || "Unknown"}`,
          },
          footer: { text: `> *${botFooter}*` },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Download",
                  url: app.url,
                }),
              },
            ],
          },
        })),
      );

      const message = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                body: { text: `📱 HappyMod Results for: *${q}*` },
                footer: {
                  text: `📂 Displaying first *${results.length}* apps`,
                },
                carouselMessage: { cards },
              },
            },
          },
        },
        { quoted: mek },
      );

      await Gifted.relayMessage(from, message.message, {
        messageId: message.key.id,
      });
      await react("✅");
    } catch (error) {
      console.error("HappyMod search error:", error);
      await react("❌");
      return reply("Failed to search HappyMod. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "apkmirror",
    aliases: ["apkmirrorsearch"],
    category: "search",
    react: "📦",
    description: "Search APK Mirror for apps",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide an app name to search");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/apkmirror?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (!res.data?.success || !res.data?.results?.data) {
        await react("❌");
        return reply("No results found. Please try a different query.");
      }

      const results = res.data.results.data.slice(0, 5);

      const cards = await Promise.all(
        results.map(async (app) => ({
          header: {
            title: `📦 *${app.name}*`,
            hasMediaAttachment: true,
            imageMessage: (
              await generateWAMessageContent(
                { image: { url: app.icon } },
                {
                  upload: Gifted.waUploadToServer,
                },
              )
            ).imageMessage,
          },
          body: {
            text: `📦 Source: ${app.source || "APK Mirror"}`,
          },
          footer: { text: `> *${botFooter}*` },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Download",
                  url: app.url,
                }),
              },
            ],
          },
        })),
      );

      const message = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                body: { text: `📦 APK Mirror Results for: *${q}*` },
                footer: {
                  text: `📂 Displaying first *${results.length}* apps`,
                },
                carouselMessage: { cards },
              },
            },
          },
        },
        { quoted: mek },
      );

      await Gifted.relayMessage(from, message.message, {
        messageId: message.key.id,
      });
      await react("✅");
    } catch (error) {
      console.error("APK Mirror search error:", error);
      await react("❌");
      return reply("Failed to search APK Mirror. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "stickersearch",
    aliases: ["searchsticker", "findsticker"],
    category: "search",
    react: "🎨",
    description: "Search and send stickers",
  },
  async (from, Gifted, conText) => {
    const {
      q,
      mek,
      reply,
      react,
      packName,
      packAuthor,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query for stickers");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/stickersearch?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No stickers found. Please try a different query.");
      }

      const stickers = res.data.results.slice(0, 10);

      await reply(`Found ${stickers.length} stickers for: *${q}*\nSending...`);

      for (const stickerUrl of stickers) {
        try {
          const response = await axios.get(stickerUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
          });
          const stickerBuffer = Buffer.from(response.data);

          const processedSticker = await gmdSticker(stickerBuffer, {
            pack: packName || "𝐀𝐓𝐀𝐒𝐒𝐀-𝐌𝐃",
            author: packAuthor || "GIFTED-TECH",
            type: StickerTypes.FULL,
            categories: ["🤩", "🎉"],
            quality: 75,
          });

          await Gifted.sendMessage(
            from,
            { sticker: processedSticker },
            { quoted: mek },
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (stickerErr) {
          console.error("Error sending sticker:", stickerErr.message);
        }
      }

      await react("✅");
    } catch (error) {
      console.error("Sticker search error:", error);
      await react("❌");
      return reply("Failed to search stickers. Please try again.");
    }
  },
);
