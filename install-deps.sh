#!/bin/bash
yarn install --immutable --immutable-cache --check-cache
yarn add -P --no-lockfile `node -e "Object.keys(JSON.parse(require('fs').readFileSync('package.json')).peerDependencies || {}).forEach(dep=>console.log(dep))"`
