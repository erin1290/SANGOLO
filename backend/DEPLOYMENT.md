## Dockerfile (backend)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "sangolo.asgi:application"]

## ---------------------------------------------------------------
## docker-compose.yml (backend + PostgreSQL + Redis)
## ---------------------------------------------------------------
#
# version: "3.9"
# services:
#   db:
#     image: postgres:16
#     environment:
#       POSTGRES_DB: sangolo
#       POSTGRES_USER: sangolo
#       POSTGRES_PASSWORD: ${DB_PASSWORD}
#     volumes:
#       - sangolo_db_data:/var/lib/postgresql/data
#     healthcheck:
#       test: ["CMD-SHELL", "pg_isready -U sangolo"]
#       interval: 5s
#       timeout: 5s
#       retries: 5
#
#   redis:
#     image: redis:7-alpine
#
#   web:
#     build: .
#     command: daphne -b 0.0.0.0 -p 8000 sangolo.asgi:application
#     env_file: .env
#     depends_on:
#       db:
#         condition: service_healthy
#       redis:
#         condition: service_started
#     ports:
#       - "8000:8000"
#     volumes:
#       - media_data:/app/media
#
# volumes:
#   sangolo_db_data:
#   media_data:
