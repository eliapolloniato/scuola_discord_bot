echo "Building LiotardoBot..."
docker buildx build --platform linux/arm64 --tag scuola_discord_bot .

echo "Updating image..."
docker tag $(docker images --filter=reference=scuola_discord_bot --format "{{.ID}}") 192.168.0.8:32768/scuola_discord_bot:latest

echo "Pushing image..."
docker push 192.168.0.8:32768/scuola_discord_bot:latest