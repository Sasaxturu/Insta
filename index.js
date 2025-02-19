const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

        const url = messageText[1];
        ctx.reply('⏳ Sedang memproses, mohon tunggu...');

        // Panggil API Instagram Downloader
        const response = await axios.get(API_URL, {
            params: { url },
            headers: {
                'accept': '*/*',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.data || !response.data.result || response.data.result.length === 0) {
            return ctx.reply('❌ Gagal mendapatkan media. Pastikan URL benar.');
        }

        const mediaList = response.data.result;

        // Loop untuk setiap media (bisa gambar atau video)
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

// Auto-respon link untuk pesan selain perintah /ig
bot.on('message', (ctx) => {
    ctx.reply('🔗 Untuk mengunduh media Instagram, gunakan perintah:\n\n/ig <link_instagram>\n\nContoh: /ig https://www.instagram.com/p/...');
});

bot.launch();
console.log('✅ Bot berjalan di Heroku...');
