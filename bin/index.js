#!/usr/bin/env node
import Main from '../src/main.js'
(async () => {
    process.exit(await Main.call(process.argv))
})()
