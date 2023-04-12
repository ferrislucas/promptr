#!/usr/bin/env node
import MainService from '../main.js'
(async () => {
    process.exit(await MainService.call(process.argv))
})()
