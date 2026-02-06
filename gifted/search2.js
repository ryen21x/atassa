const { gmd } = require("../gift"),
  axios = require("axios"),
  {
    generateWAMessageContent,
    generateWAMessageFromContent,
  } = require("gifted-baileys"),
  { sendButtons } = require("gifted-btns");


gmd(
  {
    pattern: "ggleimage",
    aliases: ["googleimage", "gimage", "ggleimagesearch", "googleimagesearch"],
    category: "search",
    react: "🖼️",
    description: "Search Google Images and send first 10 images",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query for images");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/googleimage?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No images found. Please try a different query.");
      }

      const images = res.data.results.slice(0, 10);

      await reply(`Found ${images.length} images for: *${q}*\nSending...`);

      for (let i = 0; i < images.length; i++) {
        try {
          await Gifted.sendMessage(
            from,
            {
              image: { url: images[i] },
              caption: `🖼️ Image ${i + 1}/${images.length}\n\n> *${botFooter}*`,
            },
            { quoted: mek },
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (imgErr) {
          console.error("Error sending image:", imgErr.message);
        }
      }

      await react("✅");
    } catch (error) {
      console.error("Google image search error:", error);
      await react("❌");
      return reply("Failed to search images. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "unsplash",
    aliases: ["unsplashphotos", "unsplashsearch"],
    category: "search",
    react: "📷",
    description: "Search Unsplash and send first 10 photos",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query for photos");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/unsplash?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No photos found. Please try a different query.");
      }

      const photos = res.data.results.slice(0, 10);

      await reply(
        `Found ${photos.length} Unsplash photos for: *${q}*\nSending...`,
      );

      for (let i = 0; i < photos.length; i++) {
        try {
          await Gifted.sendMessage(
            from,
            {
              image: { url: photos[i] },
              caption: `📷 Unsplash Photo ${i + 1}/${photos.length}\n\n> *${botFooter}*`,
            },
            { quoted: mek },
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (imgErr) {
          console.error("Error sending Unsplash photo:", imgErr.message);
        }
      }

      await react("✅");
    } catch (error) {
      console.error("Unsplash search error:", error);
      await react("❌");
      return reply("Failed to search Unsplash. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "wallpapers",
    aliases: [
      "wallpaper",
      "hdwallpaper",
      "hdwallpapers",
      "getwallpapers",
      "randomwallpapers",
    ],
    category: "search",
    react: "🖼️",
    description: "Search HD wallpapers by category",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a wallpaper category or search query");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/wallpaper?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No wallpapers found. Please try a different query.");
      }

      const wallpapers = res.data.results.slice(0, 10);

      await reply(
        `Found ${wallpapers.length} wallpapers for: *${q}*\nSending...`,
      );

      for (let i = 0; i < wallpapers.length; i++) {
        try {
          const wp = wallpapers[i];
          const imageUrl = Array.isArray(wp.image) ? wp.image[0] : wp.image;

          await Gifted.sendMessage(
            from,
            {
              image: { url: imageUrl },
              caption: `🖼️ *Wallpaper ${i + 1}/${wallpapers.length}*\n📂 Category: ${wp.type || "Unknown"}\n\n> *${botFooter}*`,
            },
            { quoted: mek },
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (wpErr) {
          console.error("Error sending wallpaper:", wpErr.message);
        }
      }

      await react("✅");
    } catch (error) {
      console.error("Wallpaper search error:", error);
      await react("❌");
      return reply("Failed to search wallpapers. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "weather",
    aliases: ["getweather", "clima"],
    category: "search",
    react: "🌤️",
    description: "Get weather information for a location",
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
      return reply("Please provide a location name");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/weather?apikey=${GiftedApiKey}&location=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (!res.data?.success || !res.data?.result) {
        await react("❌");
        return reply(
          "Could not get weather for that location. Please try a different location.",
        );
      }

      const w = res.data.result;
      const weatherIcons = {
        Clear: "☀️",
        Clouds: "☁️",
        Rain: "🌧️",
        Drizzle: "🌦️",
        Thunderstorm: "⛈️",
        Snow: "❄️",
        Mist: "🌫️",
        Fog: "🌫️",
        Haze: "🌫️",
      };

      const icon = weatherIcons[w.weather?.main] || "🌡️";

      let txt = `*${botName} 𝐖𝐄𝐀𝐓𝐇𝐄𝐑*\n\n`;
      txt += `${icon} *Location:* ${w.location}, ${w.sys?.country || ""}\n\n`;
      txt += `🌡️ *Temperature:* ${w.main?.temp}°C\n`;
      txt += `🤒 *Feels Like:* ${w.main?.feels_like}°C\n`;
      txt += `📉 *Min Temp:* ${w.main?.temp_min}°C\n`;
      txt += `📈 *Max Temp:* ${w.main?.temp_max}°C\n\n`;
      txt += `☁️ *Weather:* ${w.weather?.main} (${w.weather?.description})\n`;
      txt += `💧 *Humidity:* ${w.main?.humidity}%\n`;
      txt += `🌬️ *Wind Speed:* ${w.wind?.speed} m/s\n`;
      txt += `👁️ *Visibility:* ${w.visibility / 1000} km\n`;
      txt += `🔘 *Pressure:* ${w.main?.pressure} hPa\n\n`;
      txt += `> *${botFooter}*`;

      await reply(txt);
      await react("✅");
    } catch (error) {
      console.error("Weather search error:", error);
      await react("❌");
      return reply("Failed to get weather data. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "npm",
    aliases: ["npmsearch", "npmpack", "npmpackage"],
    category: "search",
    react: "📦",
    description: "Search NPM packages",
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
      return reply("Please provide a package name");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/npmsearch?apikey=${GiftedApiKey}&packagename=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (!res.data?.success || !res.data?.result) {
        await react("❌");
        return reply("Package not found. Please check the package name.");
      }

      const pkg = res.data.result;

      let txt = `*${botName} 𝐍𝐏𝐌 𝐏𝐀𝐂𝐊𝐀𝐆𝐄*\n\n`;
      txt += `📦 *Name:* ${pkg.name}\n`;
      txt += `📝 *Description:* ${pkg.description || "No description"}\n`;
      txt += `🏷️ *Version:* ${pkg.version}\n`;
      txt += `📜 *License:* ${pkg.license || "N/A"}\n`;
      txt += `👤 *Owner:* ${pkg.owner || "N/A"}\n`;
      txt += `📅 *Published:* ${pkg.publishedDate || "N/A"}\n`;
      txt += `📅 *Created:* ${pkg.createdDate || "N/A"}\n`;
      txt += `🔗 *Package:* ${pkg.packageLink}\n`;
      if (pkg.homepage) txt += `🏠 *Homepage:* ${pkg.homepage}\n`;
      txt += `\n> *${botFooter}*`;

      if (pkg.downloadLink) {
        const dateNow = Date.now();
        await sendButtons(Gifted, from, {
          title: "",
          text: txt,
          footer: botFooter,
          buttons: [
            {
              id: `npm_dl_${dateNow}`,
              text: "📥 Download Package",
            },
          ],
        });

        const handleResponse = async (event) => {
          const messageData = event.messages[0];
          if (!messageData?.message) return;

          const templateButtonReply =
            messageData.message?.templateButtonReplyMessage;
          if (!templateButtonReply) return;

          const selectedButtonId = templateButtonReply.selectedId;
          if (!selectedButtonId?.includes(`npm_dl_${dateNow}`)) return;

          const isFromSameChat = messageData.key?.remoteJid === from;
          if (!isFromSameChat) return;

          try {
            await Gifted.sendMessage(
              from,
              {
                document: { url: pkg.downloadLink },
                fileName: `${pkg.name}-${pkg.version}.tgz`,
                mimetype: "application/gzip",
              },
              { quoted: messageData },
            );
            await react("✅");
          } catch (dlErr) {
            await reply("Failed to download package: " + dlErr.message);
          }

          Gifted.ev.off("messages.upsert", handleResponse);
        };

        Gifted.ev.on("messages.upsert", handleResponse);
        setTimeout(
          () => Gifted.ev.off("messages.upsert", handleResponse),
          120000,
        );
      } else {
        await reply(txt);
      }

      await react("✅");
    } catch (error) {
      console.error("NPM search error:", error);
      await react("❌");
      return reply("Failed to search NPM. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "wattpad",
    aliases: ["watt", "wattsearch", "wattpadsearch"],
    category: "search",
    react: "📚",
    description: "Search Wattpad stories",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, botFooter, GiftedTechApi, GiftedApiKey } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a search query");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/wattpad?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        res.data.results.length === 0
      ) {
        await react("❌");
        return reply("No stories found. Please try a different query.");
      }

      const stories = res.data.results.slice(0, 5);

      const cards = await Promise.all(
        stories.map(async (story) => ({
          header: {
            title: `📚 *${story.tittle}*`,
            hasMediaAttachment: true,
            imageMessage: (
              await generateWAMessageContent(
                { image: { url: story.thumbnail } },
                {
                  upload: Gifted.waUploadToServer,
                },
              )
            ).imageMessage,
          },
          body: {
            text: `👁️ Reads: ${story.reads}\n❤️ Likes: ${story.likes}`,
          },
          footer: { text: `> *${botFooter}*` },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Read Story",
                  url: story.link,
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
                body: { text: `📚 Wattpad Results for: *${q}*` },
                footer: {
                  text: `📂 Displaying first *${stories.length}* stories`,
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
      console.error("Wattpad search error:", error);
      await react("❌");
      return reply("Failed to search Wattpad. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "spotifysearch",
    aliases: ["spotisearch"],
    category: "search",
    react: "🎵",
    description: "Search Spotify for tracks",
  },
  async (from, Gifted, conText) => {
    const {
      q,
      mek,
      reply,
      react,
      botName,
      botFooter,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a song or artist name to search");
    }

    try {
      const apiUrl = `${GiftedTechApi}/api/search/spotifysearch?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 60000 });

      if (
        !res.data?.success ||
        !res.data?.results ||
        !Array.isArray(res.data.results) ||
        res.data.results.length === 0
      ) {
        await react("❌");
        const errorMsg =
          res.data?.results?.msg ||
          "No tracks found. Please try a different query.";
        return reply(errorMsg);
      }

      const tracks = res.data.results.slice(0, 5);
      const dateNow = Date.now();

      let txt = `*${botName} 𝐒𝐏𝐎𝐓𝐈𝐅𝐘 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n`;
      txt += `🔍 *Query:* ${q}\n\n`;

      tracks.forEach((track, i) => {
        txt += `*${i + 1}. ${track.title}*\n`;
        txt += `🎤 Artist: ${track.artist}\n`;
        txt += `⏱️ Duration: ${track.duration}\n\n`;
      });

      const buttons = tracks.map((track, i) => ({
        id: `${botPrefix}spotify ${track.url}`,
        text: `${i + 1}. ${track.title.substring(0, 30)}`,
      }));

      await sendButtons(Gifted, from, {
        title: "",
        text: txt,
        footer: botFooter,
        buttons: buttons,
      });

      const handleResponse = async (event) => {
        const messageData = event.messages[0];
        if (!messageData?.message) return;

        const templateButtonReply =
          messageData.message?.templateButtonReplyMessage;
        if (!templateButtonReply) return;

        const selectedButtonId = templateButtonReply.selectedId;
        if (!selectedButtonId?.includes(`spotify_dl_${dateNow}`)) return;

        const isFromSameChat = messageData.key?.remoteJid === from;
        if (!isFromSameChat) return;

        const trackIndex = parseInt(selectedButtonId.split("_").pop());
        const selectedTrack = tracks[trackIndex];

        if (selectedTrack) {
          await Gifted.sendMessage(
            from,
            { text: `${botPrefix}spotify ${selectedTrack.url}` },
            { quoted: messageData },
          );
        }
        Gifted.ev.off("messages.upsert", handleResponse);
      };

      Gifted.ev.on("messages.upsert", handleResponse);
      setTimeout(
        () => Gifted.ev.off("messages.upsert", handleResponse),
        300000,
      );
      await react("✅");
    } catch (error) {
      console.error("Spotify search error:", error);
      await react("❌");
      return reply("Failed to search Spotify. Please try again.");
    }
  },
);
