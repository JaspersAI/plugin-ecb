# European Central Bank for Jaspers Terminal

Euro reference rates and the deposit facility rate. No key.

Sources: `ecb/fx`, `ecb/policy-rate`.

## Install

In Jaspers Terminal: **Settings > Plugins > Add a plugin**, and paste this repository's link. Or
clone this folder into `~/Jaspers/plugins/ecb` and the app builds it on the next save.

## What it needs

No key and no account. The data is public and this asks for it directly, saying who it is in its
`User-Agent`.

## Working on it

```sh
npm install
npm run typecheck
npm test
```

MIT.
