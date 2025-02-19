const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Menggunakan variabel lingkungan di Heroku
const API_URL = 'https://itzpire.com/download/instagram';
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Selamat datang! Kirimkan link Instagram yang ingin Anda unduh.');
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const url = msg.text;

    if (!url.startsWith('http')) return;

    try {
        const response = await axios.get(`${API_URL}?url=${encodeURIComponent(url)}`);

        if (response.data && response.data.data && response.data.data.media) {
            const mediaList = response.data.data.media;

            if (mediaList.length > 1) {
                bot.sendMessage(chatId, `Media ini memiliki ${mediaList.length} item. Mengunduh semuanya...`);
            }

            for (let i = 0; i < mediaList.length; i++) {
                const media = mediaList[i];
                const mediaUrl = media.downloadUrl || media.url;
                const fileType = media.type === 'video' ? 'mp4' : 'jpg';
                const fileName = `media_${i + 1}.${fileType}`;

                const filePath = path.join(__dirname, fileName);
                await downloadFile(mediaUrl, filePath);

                if (media.type === 'video') {
                    bot.sendVideo(chatId, fs.createReadStream(filePath), { caption: `Video ${i + 1}` });
                } else {
                    bot.sendPhoto(chatId, fs.createReadStream(filePath), { caption: `Foto ${i + 1}` });
                }

                fs.unlinkSync(filePath); // Hapus file setelah dikirim
            }
        } else {
            bot.sendMessage(chatId, 'Gagal mengambil media. Pastikan link valid.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat mengakses API atau mengunduh media.');
    }
});

async function downloadFile(url, filePath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
