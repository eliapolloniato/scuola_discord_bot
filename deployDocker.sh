export NODE_ENV=production
docker build -t eliapolloniato/scuola_discord_bot .
docker run --name scuola_discord_bot --restart unless-stopped -d -v $(pwd)/database:/usr/src/app/database -e BOT_TOKEN eliapolloniato/scuola_discord_bot