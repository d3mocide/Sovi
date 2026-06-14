FROM python:3.12-slim

WORKDIR /app

RUN addgroup --system sovi && adduser --system --ingroup sovi sovi

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R sovi:sovi /app
USER sovi

CMD ["python", "-m", "arq", "main.WorkerSettings"]
