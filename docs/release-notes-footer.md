## Run this release

Download `docker-compose.release.yml` and `env.example` from the assets below, then:

```bash
mkdir -p secrets
openssl rand -hex 32 > secrets/master_key.txt
openssl rand -hex 24 > secrets/db_password.txt
chmod 700 secrets && chmod 644 secrets/*.txt
mv env.example .env      # set SECRET_KEY, and SOVI_VERSION to this release without the leading v
docker compose -f docker-compose.release.yml up -d
```

The images are `ghcr.io/d3mocide/sovi-api`, `sovi-worker` and `sovi-frontend`, built from this tag. See the README for HTTPS, backups and connecting Sure.
