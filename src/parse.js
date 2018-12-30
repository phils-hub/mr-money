const fs = require('fs')
const os = require('os')

const csvParse = require('csv-parse/lib/sync')

const { attrHdr, attrBdy } = require('./attributes')

/**
 * @param {String} currencyDe
 * @returns {String} currencyEn
 */
function convertCurrencyDeToEn(currencyDe) {
  return currencyDe.replace(',','#').replace('.',',').replace('#','.')
}

const baseParseOptions = {
  auto_parse: false,
  auto_parse_date: false,
  delimiter: ';',
  skip_empty_lines: true,
  trim: true,
  quote: '"'    
}

function extractSections(input, boundary = 4) {
  let lines = input.split(os.EOL)
      .filter(line => line.length > 0)
      .map(line => line.substring(0, line.length-1))
  const linesAsString = _ => _.reduce((prev, curr) => prev + os.EOL + curr, "")
  return {
    header: linesAsString(lines.slice(0, boundary)),
    body: linesAsString(lines.slice(boundary))
  }
}

/**
 * @typedef {Object} Header
 * @property {String} account_nr
 * @property {String} report_start_date
 * @property {String} report_end_date
 * @property {Number} balance * 
 * 
 * @param {String} header
 * @returns {Header} header
 */
function parseHeader(header) {
  let options = Object.assign(baseParseOptions, {
    columns: ['key', 'value']
  })  

  let result = []
  try {
    result = csvParse(header, options)
  } catch (e) {
    console.error(`Header parse error occured with details: ${e}`)
  }

  const targetKeys = Object.values(attrHdr)
  let resultWithNewKeys = {}
  result.forEach((elem, idx) => {
    resultWithNewKeys[targetKeys[idx]] = idx !== 3 ? elem.value : convertCurrencyDeToEn(elem.value)
  })
  return resultWithNewKeys
}

function parseBody(body) {
  let options = Object.assign(baseParseOptions, {
    from: 2,
    columns: [
      attrBdy.bookingDate, false, attrBdy.bookingType, attrBdy.beneficiary, 
      attrBdy.purpose, attrBdy.accountNr, false, attrBdy.amount,
      false, false, false
    ],
    cast: function(value, context) {
      if(context.column == 'amount') {
        return Number.parseFloat(convertCurrencyDeToEn(value))
      } else if (context.column == 'booking_date') {
        return Date.parse(value.split('.').reverse().join('.'))
      } else {
        return value
      }
    }
  })
  
  let parsedBody = []
  try {
    parsedBody = csvParse(body, options)
  } catch (e) {
    console.error(`Body parse error  occured with details: ${e}`)
  }
  return parsedBody
}

/**
 * @typedef {Object} ParseResult
 * @property {Header} header
 * @property {Object} body
 * 
 * @param {String} data
 * @returns {ParseResult}
 */
function parse(data) {
  
  let {header, body} = extractSections(data)
      
  let parsedHeader = parseHeader(header)
    
  let parsedBody = parseBody(body)

  return {
    header: parsedHeader,
    body: parsedBody
  }  
}
module.exports.parse = parse

function parseFile(inputFilePath, encoding = 'utf-8') {
  let data = fs.readFileSync(inputFilePath, { encoding })  // western 1252
  return parse(data)
}
module.exports.parseFile = parseFile
