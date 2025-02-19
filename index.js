
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN); // Ambil token dari Heroku Config Vars
const API_URL = 'https://www.laurine.site/api/downloader/igdl';

// Fungsi untuk validasi URL Instagram
const isValidInstagramUrl = (url) => {
    return /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//.test(url);
};

// Perintah /start
bot.start((ctx) => {
    ctx.reply('👋 Selamat datang di Instagram Downloader Bot!\n\nGunakan perintah:\n/ig <link_instagram>\n\nContoh: /ig https://www.instagram.com/p/...');
});

// Perintah /ig
bot.command('ig', async (ctx) => {
    try {
        // Ambil URL dari pesan
        const messageText = ctx.message.text.split(' ');
        if (messageText.length < 2) {
            return ctx.reply('❌ Harap sertakan URL Instagram setelah perintah!\n\nContoh: /ig https://www.instagram.com/p/...');
        }

        let url = messageText[1].trim();

        // Hapus query parameter tambahan (?igsh=...)
        url = url.split('?')[0];

        // Validasi URL
        if (!isValidInstagramUrl(url)) {
            return ctx.reply('❌ URL tidak valid! Harap masukkan URL postingan Instagram yang benar.');
        }

        ctx.reply('⏳ Sedang memproses, mohon tunggu...');

        // Debug: Cetak URL yang dikirim ke API
        console.log(`Fetching: ${API_URL}?url=${encodeURIComponent(url)}`);

        // Panggil API Instagram Downloader
        const response = await axios.get(`${API_URL}?url=${encodeURIComponent(url)}`, {
            headers: {
                'accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 10000 // Timeout 10 detik
        });

        // Debug: Cetak respons API
        console.log('API Response:', response.data);

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            return ctx.reply('❌ Gagal mendapatkan media. Pastikan URL benar atau coba lagi nanti.');
        }

        const mediaList = response.data;

        // Kirim setiap media ke Telegram
        for (const media of mediaList) {
            const fileUrl = media.url; // Link media langsung dari API

            try {
                // Kirim media berdasarkan jenis file
                if (fileUrl.endsWith('.jpg') || fileUrl.endsWith('.png')) {
                    await ctx.replyWithPhoto(fileUrl, { caption: '📷 Gambar berhasil diunduh!' });
                } else if (fileUrl.endsWith('.mp4')) {
                    await ctx.replyWithVideo(fileUrl, { caption: '🎥 Video berhasil diunduh!' });
                } else {
                    await ctx.reply(`📂 Media ditemukan:\n${fileUrl}`);
                }
            } catch (err) {
                console.error('Gagal mengirim media:', err.message);
                ctx.reply(`❌ Gagal mengirim media: ${fileUrl}`);
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

// Jalankan bot
bot.launch();
console.log('✅ Bot berjalan di Heroku...');
