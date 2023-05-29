#!/usr/bin/env node
import Main from '../src/Main.js'
(async () => {
    process.exit(await Main.call(process.argv))
})()
