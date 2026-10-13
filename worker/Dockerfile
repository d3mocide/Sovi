# Build with the repository root as the context (see docker-compose.yml): the worker shares code with the API.
FROM python:3.12-slim

WORKDIR /app

RUN addgroup --system sovi && adduser --system --ingroup sovi sovi

COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker/ worker/
COPY api/ /api/
ENV PYTHONPATH=/app:/api

RUN chown -R sovi:sovi /app /api
USER sovi

CMD ["python", "-m", "arq", "worker.main.WorkerSettings"]
