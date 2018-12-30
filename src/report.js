const fs = require('fs')
const Handlebars = require('handlebars')
const _ = require('lodash')

const { attrBdy } = require('./attributes')

const template = fs.readFileSync('./templates/report.hbs', {encoding: 'utf-8'})
const compiledTemplate = Handlebars.compile(
  template, { strict: true, noEscape: true }
)

/**
 * @typedef {Object} Tepc
 * @property {String} categoryId
 * @property {Number} totalExpenses
 * 
 * @param {Object} transactions 
 * @returns {Array.<Tepc>} tepc
 */
function calculateTotalExpensePerCategory(transactions) {
  let groupedTransactions = _.groupBy(transactions, value => value.classification)
  let classifiers = _.keys(groupedTransactions)
  let sums = classifiers.map(classifier => {
    let sumOfClassifier = groupedTransactions[classifier]
      .map(e => e[attrBdy.amount])
      .reduce((prev, curr) => prev + curr, 0)
    return { 
      categoryId: classifier,
      totalExpenses: sumOfClassifier 
    }
  })
  console.log("Sums: " + JSON.stringify(sums)) 
  return sums
}

/**
 * @param {Header} overview 
 * @param {*} transactions 
 */
function generateReport(overview, transactions) {
  let context = {
    reportStartDate: overview.report_start_date,
    reportEndDate: overview.report_end_date
  }
  
  let tepc = calculateTotalExpensePerCategory(transactions)
  const tepcContext = {    
    categorySums: JSON.stringify(tepc.map(e => e.totalExpenses)),
    categoryLabels: JSON.stringify(tepc.map(e => e.categoryId))
  }
  context.tepc = tepcContext

  const html = compiledTemplate(context)
  fs.writeFileSync('./data/output/report.html', html)  
}
module.exports.generateReport = generateReport

