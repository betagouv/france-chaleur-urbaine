#!/bin/sh

if [ -z $IS_REVIEW_APP]; then
  echo 'Review app => no migration'
else 
  yarn db:migrate
fi