# zhuzhyk-web
Web application for Zhuzhyk online store coursework

## Запуск

Потрібен Node.js 22 або новіший (вимога `better-sqlite3`).

```bash
cd backend
npm install
npm start        # http://localhost:3000
npm test         # юніт-тести service/
```

Змінні оточення (необов'язково): `PORT` (за замовчуванням 3000), `DB_PATH` (за замовчуванням `backend/items.db`).

Швидка перевірка:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/items
curl -X POST http://localhost:3000/items -H "Content-Type: application/json" \
     -d '{"name":"Молоко","price":42.5,"stock":20}'
curl -X PATCH http://localhost:3000/items/1 -H "Content-Type: application/json" -d '{"price":45}'
curl -X DELETE http://localhost:3000/items/1
```

## Архітектура

Модульний моноліт із шарами `api/ → service/ → domain/` (+ `repository/` для SQLite). Рішення зафіксовані в [`docs/adr/`](docs/adr/):

- [0001 — стиль архітектури](docs/adr/0001-architecture-style.md)
- [0002 — шарова структура](docs/adr/0002-layered-architecture.md)
- [0003 — стиль API та модель помилок](docs/adr/0003-api-style-and-error-model.md)

## API документація

Контракт API: [`docs/api/openapi.yaml`](docs/api/openapi.yaml) (перевірено в [Swagger Editor](https://editor.swagger.io/)).

![Swagger Editor](docs/api/swagger_screenshot.png)
