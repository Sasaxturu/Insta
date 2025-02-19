
const axios = require('axios');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN); // Ambil token dari Heroku Config Vars

bot.start((ctx) => ctx.reply('Kirim link Instagram untuk diunduh!'));

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    if (!userMessage.includes('instagram.com')) {
        return ctx.reply('⚠️ Silakan kirimkan tautan Instagram yang valid.');
    }

    try {
        ctx.reply('🔄 Sedang memproses, harap tunggu...');

        // Panggil API terbaru
        const apiURL = `https://www.laurine.site/api/downloader/igdl?url=${encodeURIComponent(userMessage)}`;
        const response = await axios.get(apiURL, { headers: { 'accept': '*/*' } });
        const data = response.data;

        // Cek apakah API mengembalikan hasil
        if (!data || !data.result || data.result.length === 0) {
            return ctx.reply('❌ Gagal mengambil video. Coba lagi nanti.');
        }

        const downloadURL = data.result[0].url;
        const thumbnail = data.result[0].thumbnail || 'https://www.instagram.com/static/images/ico/favicon-200.png';

        // Kirim thumbnail terlebih dahulu
        await ctx.replyWithPhoto(thumbnail, {
            caption: '✅ Video berhasil diunduh! Mengirim video...',
            parse_mode: 'Markdown'
        });

        // Kirim video langsung ke chat
        await ctx.replyWithVideo(downloadURL, {
            caption: '🎥 Berikut videonya!',
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error('Error:', error);
        ctx.reply('❌ Terjadi kesalahan saat memproses permintaan.');
    }
});

bot.launch();
