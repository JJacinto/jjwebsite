.PHONY: start stop restart logs

# Start the website
start:
	docker compose up -d

# Stop the website
stop:
	docker compose down

# Restart after changes
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f web
