#!/bin/bash

if [ "$STORYBOOK" = "true" ] ; then
  echo ">> Build Storybook"
  exec yarn build-storybook
else
  echo ">> Build WebApp (Next.JS)"
  exec yarn build
fi