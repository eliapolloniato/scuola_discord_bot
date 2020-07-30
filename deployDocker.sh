docker build -t eliapolloniato/scuola_discord_bot .
docker run --name scuola_discord_bot --restart unless-stopped -d eliapolloniato/scuola_discord_bot