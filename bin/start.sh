#!/bin/bash

if [ "$STORYBOOK" = "true" ] ; then
  echo ">> Start Storybook"
  # exec yarn run storybook
  # exec npx http-server storybook-static
  exec yarn start-storybook
else
  echo ">> Start WebApp (Next.JS)"
  exec yarn start
fi