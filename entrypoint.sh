#!/bin/sh -l
set -ex

yarn run db:migrate

exec "$@"
