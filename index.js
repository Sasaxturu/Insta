const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN); // Token diambil dari Heroku Config Vars
const API_URL = 'https://www.laurine.site/api/downloader/igdl';

// Perintah /start
bot.start((ctx) => {
    ctx.reply('👋 Selamat datang di Instagram Downloader Bot! Gunakan perintah:\n\n/ig <link_instagram>\n\nContoh: /ig https://www.instagram.com/p/...');
});

// Perintah /ig
bot.command('ig', async (ctx) => {
    try {
        // Ambil URL dari pesan
        const messageText = ctx.message.text.split(' ');
        if (messageText.length < 2) {
            return ctx.reply('❌ Harap sertakan URL Instagram setelah perintah! Contoh: /ig https://www.instagram.com/p/...');
        }

        let url = messageText[1];

        // Hapus query parameter tambahan (?igsh=...)
        url = url.split('?')[0];

        ctx.reply('⏳ Sedang memproses, mohon tunggu...');

        // Debug: Cetak URL yang dikirim ke API
        console.log(`Fetching: ${API_URL}?url=${encodeURIComponent(url)}`);

        // Panggil API Instagram Downloader
        const response = await axios.get(`${API_URL}?url=${encodeURIComponent(url)}`, {
            headers: {
                'accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Debug: Cetak respons API
        console.log('API Response:', response.data);

        if (!response.data || !response.data.media || response.data.media.length === 0) {
            return ctx.reply('❌ Gagal mendapatkan media. Pastikan URL benar.');
        }

        const mediaList = response.data.media;

        // Kirim setiap media ke Telegram
        for (const media of mediaList) {
            const fileUrl = media.url;
            const type = media.type; // 'image' atau 'video'

            if (type === 'image') {
                await ctx.replyWithPhoto(fileUrl);
            } else if (type === 'video') {
                await ctx.replyWithVideo(fileUrl);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
});

// Auto-respon untuk pesan selain perintah /ig
bot.on('message', (ctx) => {
    ctx.reply('🔗 Untuk mengunduh media Instagram, gunakan perintah:\n\n/ig <link_instagram>\n\nContoh: /ig https://www.instagram.com/p/...');
});

bot.launch();
console.log('✅ Bot berjalan di Heroku...');
