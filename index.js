const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_URL = 'https://www.laurine.site/api/downloader/igdl';

bot.command('ig', async (ctx) => {
    try {
        const messageText = ctx.message.text.split(' ');
        if (messageText.length < 2) {
            return ctx.reply('❌ Harap sertakan URL Instagram setelah perintah!\n\nContoh: /ig https://www.instagram.com/p/...');
        }

        let url = messageText[1].trim().split('?')[0];

        ctx.reply('⏳ Sedang memproses, mohon tunggu...');

        console.log(`Fetching: ${API_URL}?url=${encodeURIComponent(url)}`);

        const response = await axios.get(`${API_URL}?url=${encodeURIComponent(url)}`, {
            headers: {
                'accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 10000
        });

        console.log('API Response:', JSON.stringify(response.data, null, 2));

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            return ctx.reply('❌ Gagal mendapatkan media. Pastikan URL benar atau coba lagi nanti.');
        }

        const mediaList = response.data;

        let sentSomething = false;

        for (const media of mediaList) {
            if (!media.url) {
                console.log('Media tidak memiliki properti URL:', media);
                continue;
            }

            try {
                if (media.url.endsWith('.jpg') || media.url.endsWith('.png')) {
                    await ctx.replyWithPhoto(media.url, { caption: '📷 Gambar berhasil diunduh!' });
                    sentSomething = true;
                } else if (media.url.endsWith('.mp4')) {
                    await ctx.replyWithVideo(media.url, { caption: '🎥 Video berhasil diunduh!' });
                    sentSomething = true;
                } else {
                    await ctx.reply(`📂 Media ditemukan:\n${media.url}`);
                    sentSomething = true;
                }
            } catch (err) {
                console.error('Gagal mengirim media:', err.message);
            }
        }

        if (!sentSomething) {
            ctx.reply('⚠ Tidak ada media yang dapat dikirim.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
});

bot.launch();
console.log('✅ Bot berjalan di Heroku...');
