FROM postgis/postgis:14-3.4-alpine

COPY dump.sql /docker-entrypoint-initdb.d/
COPY *.dat /docker-entrypoint-initdb.d/