#!/usr/bin/env node
import MainService from '../main.js'
(async () => {
    await MainService.call(process.argv);
})();
