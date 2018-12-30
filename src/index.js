require('dotenv/config')

const path = require('path')
const _ = require('lodash')
const natural = require('natural')

const { parseFile } = require('./parse')
const { attrBdy } = require('./attributes')
const { generateReport } = require('./report')

const classifier = new natural.BayesClassifier()

const inputFilePath = path.resolve(process.env.PWD, process.env.INPUT_PATH)
const trainingFilePath = path.resolve(process.env.PWD, process.env.TRAINING_PATH)
const classifierFilePath = path.resolve(process.env.PWD, process.env.CLASSIFIER_PATH)

process.argv[2] === 'train' ? train() : run()

function train() {
  console.log('Training classifier...')
  const trainingData = parseFile(trainingFilePath)
  trainingData.body.forEach(e => classifier.addDocument(
    [
      e[attrBdy.beneficiary],
      e[attrBdy.purpose],
      e[attrBdy.accountNr]
    ],
    e.classification
  ))
  //console.log(classifier)
  classifier.train()
  classifier.save(classifierFilePath, (err, classifier) => {
    if (err) {
      console.log(err)
    }  
  })
}

function run() {
  console.log('Generating report...')
  const data = parseFile(inputFilePath)
  let transactions = data.body
  let transactionsPromise = classify(transactions)
  transactionsPromise.then(classifiedTransactions => {
    generateReport(data.header, classifiedTransactions)

  }).catch(reason => console.error(`Classification error with reason ${reason}`))
}

function classify(transactions) {
  console.log('Classifying...')
  return new Promise((resolve, reject) => {
    natural.BayesClassifier.load(classifierFilePath, null, (err, classifier) => {
      if (err) {
        reject(err)
      }
      let classifiedTransactions = transactions.map(e => {
        let classification = classifier.classify([
          e[attrBdy.beneficiary],
          e[attrBdy.purpose],
          e[attrBdy.accountNr]
        ])
        e['classification'] = classification
        return e
      })
      resolve(classifiedTransactions)
    })  
  })  
}