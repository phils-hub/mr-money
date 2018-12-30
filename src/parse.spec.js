const path = require('path')

const { parseFile } = require('./parse')

/**
 * Manual test case
 */

let filePath = path.resolve(__dirname, "../data/input/some-file.csv")

let result = parseFile(filePath)

console.log(JSON.stringify(result))
