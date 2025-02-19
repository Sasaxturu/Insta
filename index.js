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
            for media in data["data"]["media"]:
                media_url = media.get("downloadUrl", media.get("url"))  # Ambil link download

                if media["type"] == "video":
                    file_path = "downloaded_video.mp4"
                else:
                    file_path = "downloaded_image.jpg"
                
                # Download file
                if download_file(media_url, file_path):
                    with open(file_path, "rb") as file:
                        if media["type"] == "video":
                            bot.send_video(message.chat.id, file)
                        else:
                            bot.send_photo(message.chat.id, file)
                    
                    os.remove(file_path)  # Hapus file setelah dikirim
                else:
                    bot.reply_to(message, "Gagal mengunduh media. Coba lagi nanti.")
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
