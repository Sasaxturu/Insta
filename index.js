const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN); // Token diambil dari Heroku Config Vars
const API_URL = 'https://itzpire.com/download/instagram';

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

        const url = messageText[1];
        ctx.reply('⏳ Sedang memproses, mohon tunggu...');

        // Panggil API Instagram Downloader
        const response = await axios.get(API_URL, {
            params: { url },
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (response.data.status !== 'success') {
            return ctx.reply('❌ Gagal mendapatkan media. Pastikan URL benar.');
        }

        const mediaList = response.data.data.media;
        if (!mediaList || mediaList.length === 0) {
            return ctx.reply('❌ Tidak ada media yang ditemukan.');
        }

        // Loop untuk setiap media (bisa gambar atau video)
        for (const media of mediaList) {
            const fileUrl = media.downloadUrl;

            if (media.type === 'image') {
                const filePath = path.join(__dirname, 'downloaded.jpg');

                // Download gambar
                await downloadFile(fileUrl, filePath);

                // Kirim ke Telegram
                await ctx.replyWithPhoto({ source: filePath });

                // Hapus file setelah dikirim
                fs.unlinkSync(filePath);
            } else if (media.type === 'video') {
                const filePath = path.join(__dirname, 'downloaded.mp4');

                // Download video
                await downloadFile(fileUrl, filePath);

                // Kirim ke Telegram
                await ctx.replyWithVideo({ source: filePath });

                // Hapus file setelah dikirim
                fs.unlinkSync(filePath);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        ctx.reply('❌ Terjadi kesalahan, coba lagi nanti.');
    }
});

// Auto-respon link untuk pesan selain perintah /ig
bot.on('message', (ctx) => {
    ctx.reply('🔗 Untuk mengunduh media Instagram, gunakan perintah:\n\n/ig <link_instagram>\n\nContoh: /ig https://www.instagram.com/p/...');
});

// Fungsi untuk mengunduh file
async function downloadFile(url, filePath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

bot.launch();
console.log('✅ Bot berjalan di Heroku...');
