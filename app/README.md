# Кабинет продаж М-Групп

Внутреннее приложение: таблица клиентов, статусы, комментарии, заглушка шаблонов писем.

## Запуск на сервере

Команды Timeweb Apps: сборка `docker-compose build`, запуск `docker-compose up -d`.

Из корня репозитория (так же деплоится Timeweb):

```bash
docker compose up -d --build
```

Либо только эта папка:

```bash
cd app
docker compose up -d --build
```

Открыть `http://IP:80` или `http://127.0.0.1:8080`

- логин: `maxAkerman`
- пароль: `maxAkerman`

HTTPS и домен не требуются. База Postgres внутри compose, наружу не публикуется.

При первом старте импортируются ~150 карточек из `backend/data/leads.json`. Повторный старт базу не затирает.

Сменить пароль: переменные `AUTH_USER` / `AUTH_PASSWORD` / `JWT_SECRET` в `docker-compose.yml`.
