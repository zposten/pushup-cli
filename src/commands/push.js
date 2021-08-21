const execa = require('execa')
const {cosmiconfigSync} = require('cosmiconfig')
const chalk = require('chalk')

const {error, warn} = require('../util')

const defaultConfig = {
  ticketPrefix: '',
  divider: '-',
  gitRemote: 'origin',
  format: 'TICKET-BRANCH',
}

async function push(ticketId, options, commander) {
  const explorer = cosmiconfigSync('pushup')
  let {config} = explorer.search()

  config = {
    ...defaultConfig,
    ...config,
  }

  ticketId = options.ticket ?? ticketId
  const format = options.format ?? config.format
  const ticketPrefix = options.ticketPrefix ?? config.ticketPrefix
  const gitRemote = options.gitRemote ?? config.gitRemote

  // Commander.args contains positional arguments and
  // any unknown options because they're not interpreted
  // as options
  const unknownOptions = commander.args.filter(arg => arg.startsWith('-'))

  const ticketIdContainsPrefix = ticketId && ticketId.match(/^[a-zA-Z]/)
  if (!ticketIdContainsPrefix && !ticketPrefix) {
    warn('No ticket prefix was found, only the ticket ID will be used')
  }

  const ticketNumber = ticketIdContainsPrefix
    ? ticketId
    : ticketPrefix && ticketId
    ? `${ticketPrefix}${ticketId}`
    : ticketId
    ? ticketId
    : ''

  const {stdout: localBranchName} = await execa('git', [
    'branch',
    '--show-current',
  ])

  let remoteBranchName = format
    .replace('TICKET', ticketNumber || '')
    .replace('BRANCH', localBranchName || '')

  // In the case when the format expects information that has not been
  // provided(e.g. a ticket number), the branch name could end up with
  // a straggling dividing character at the beginning or end which
  // would always be undesirable.
  //
  // These conditionals strip off those extra characters if they exist.
  const branchStartsWithDivider = remoteBranchName.match(/^[^a-zA-Z0-9]/)
  const branchEndsWithDivider = remoteBranchName.match(/[^a-zA-Z0-9]$/)

  if (branchStartsWithDivider) {
    remoteBranchName = remoteBranchName.slice(1)
  }
  if (branchEndsWithDivider) {
    remoteBranchName = remoteBranchName.slice(0, -1)
  }

  try {
    const gitArgs = [
      'push',
      gitRemote,
      '-u',
      `${localBranchName}:${remoteBranchName}`,
      ...unknownOptions,
    ]

    console.log(chalk.gray(`$ git ${gitArgs.join(' ')}`))

    await execa('git', gitArgs, {stdio: 'inherit'})
  } catch (e) {
    // Do nothing here, git's error message will be displayed
  }
}

module.exports = push