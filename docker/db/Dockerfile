FROM postgis/postgis:12-3.2-alpine

COPY dump.sql /docker-entrypoint-initdb.d/
COPY *.dat /docker-entrypoint-initdb.d/