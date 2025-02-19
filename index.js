const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Selamat datang! Kirimkan tautan Instagram untuk diunduh.'));

bot.on('text', async (ctx) => {
    const url = ctx.message.text;

    if (!url.includes('instagram.com')) {
        return ctx.reply('Kirimkan tautan Instagram yang valid.');
    }

    try {
        const response = await axios.get('https://itzpire.com/download/instagram', {
            params: { url }
        });

        if (response.data.status !== 'success') {
            return ctx.reply('Gagal mengunduh media. Pastikan tautan benar.');
        }

        const media = response.data.data.media;
        const caption = response.data.data.postInfo.caption;
        const sourceUrl = response.data.data.metadata.originalUrl;
        const fullCaption = `${caption}\n\n🔗 Source: ${sourceUrl}`;

        if (media.length === 0) {
            return ctx.reply('Tidak ada media yang ditemukan di tautan ini.');
        }

        for (const item of media) {
            try {
                // Cek apakah URL bisa diakses dengan HEAD request
                await axios.head(item.downloadUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Referer': 'https://www.instagram.com/',
                    }
                });

                // Kirim media ke Telegram
                if (item.type === 'video') {
                    await ctx.sendVideo(item.downloadUrl, { caption: fullCaption });
                } else if (item.type === 'image') {
                    await ctx.sendPhoto(item.downloadUrl, { caption: fullCaption });
                }
            } catch (headError) {
                console.error("HEAD Request Failed:", headError.message);
                ctx.reply('Terjadi kesalahan saat mengunduh media. Coba lagi nanti.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        ctx.reply('Terjadi kesalahan saat mengunduh media.');
    }
});

bot.launch();
console.log('Bot berjalan...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
