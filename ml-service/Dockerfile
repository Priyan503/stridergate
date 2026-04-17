FROM python:3.10-slim

WORKDIR /app

COPY ml-service/requirements.txt ./
# We add --no-cache-dir to keep the image small
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/ .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
