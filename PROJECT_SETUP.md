# BuildFlow CRM Setup

## 1. Backend Environment

```powershell
cd "E:\CRM project\backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

If `python` is not found, use the full Python path installed on your machine.

## 2. PostgreSQL Setup

Install PostgreSQL from https://www.postgresql.org/download/windows/.

Open `psql` as the `postgres` user and run:

```sql
CREATE DATABASE buildflow_crm;
CREATE USER buildflow_user WITH PASSWORD 'your_password';
ALTER ROLE buildflow_user SET client_encoding TO 'utf8';
ALTER ROLE buildflow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE buildflow_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE buildflow_crm TO buildflow_user;
```

Then update `backend\.env`:

```env
DB_NAME=buildflow_crm
DB_USER=buildflow_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## 3. Database Migrations And Demo Data

```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Demo users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@buildflow.test | BuildFlow@123 |
| Manager | manager@buildflow.test | BuildFlow@123 |
| Sales Executive | sales@buildflow.test | BuildFlow@123 |
| Viewer | viewer@buildflow.test | BuildFlow@123 |

## 4. Gemini And Email

The project is safe by default:

```env
AI_MODE=mock
EMAIL_MODE=mock
```

To use Gemini:

```env
AI_MODE=gemini
GEMINI_API_KEY=your_key
```

To use Gmail SMTP:

```env
EMAIL_MODE=smtp
EMAIL_HOST_USER=your_gmail@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
DEFAULT_FROM_EMAIL=your_gmail@gmail.com
```

Use a Gmail app password, not your normal Gmail password.

## 5. Frontend

```powershell
cd "E:\CRM project\frontend"
npm install
npm run dev
```

Frontend API base URL lives in `frontend\.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

