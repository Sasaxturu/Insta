import telebot
import requests
import os

TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
bot = telebot.TeleBot(TOKEN)

API_URL = "https://itzpire.com/download/instagram"

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, "Selamat datang! Kirimkan link Instagram yang ingin Anda unduh.")

@bot.message_handler(func=lambda message: message.text.startswith("http"))
def download_instagram_media(message):
    url = message.text.split('?')[0].strip()
    
    response = requests.get(f"{API_URL}?url={url}")
    
    if response.status_code == 200:
        data = response.json()
        
        if "data" in data and "media" in data["data"]:
            media_list = data["data"]["media"]
            
            if len(media_list) > 1:
                bot.send_message(message.chat.id, f"Media ini memiliki {len(media_list)} item. Mengunduh semuanya...")

            for index, media in enumerate(media_list, start=1):
                media_url = media.get("downloadUrl", media.get("url"))  # Ambil link download

                if media["type"] == "video":
                    file_path = f"video_{index}.mp4"
                else:
                    file_path = f"image_{index}.jpg"
                
                # Download file
                if download_file(media_url, file_path):
                    with open(file_path, "rb") as file:
                        if media["type"] == "video":
                            bot.send_video(message.chat.id, file, caption=f"Video {index}")
                        else:
                            bot.send_photo(message.chat.id, file, caption=f"Foto {index}")
                    
                    os.remove(file_path)  # Hapus file setelah dikirim
                else:
                    bot.reply_to(message, f"Gagal mengunduh media {index}. Coba lagi nanti.")
        else:
            bot.reply_to(message, "Gagal mengambil media. Pastikan link valid.")
    else:
        bot.reply_to(message, "Terjadi kesalahan saat mengakses API.")

def download_file(url, file_path):
    """Fungsi untuk mengunduh file dari URL dan menyimpannya ke server."""
    try:
        response = requests.get(url, stream=True, timeout=10)
        
        if response.status_code == 200:
            with open(file_path, "wb") as file:
                for chunk in response.iter_content(chunk_size=1024):
                    file.write(chunk)
            return os.path.exists(file_path) and os.path.getsize(file_path) > 0
        else:
            return False
    except Exception as e:
        print(f"Error download file: {e}")
        return False

bot.polling()
