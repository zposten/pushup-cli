const openUrl = require('open')
const inquirer = require('inquirer')
const chalk = require('chalk')
const {getConfig} = require('../../config')
const {error} = require('../../util')
const findTicketNumbers = require('./find-ticket-numbers')

async function open(firstTicketIdArg, options, commander) {
  const config = await getConfig(options, commander)
  const {ticketId: ticketIdOption, ticketUrl} = config

  const allTicketIds = [...commander.args, ticketIdOption].filter(x => x)

  if (!ticketUrl) {
    error(
      'No ticketUrl could be found.  Please supply it either in your config file or as a CLI option.',
    )
    process.exit(0)
  }
  if (!ticketUrl.includes('TICKET')) {
    error(
      'Your ticketUrl must include TICKET as a placeholder to insert the ticket number',
    )
    process.exit(0)
  }

  for (const ticketId of allTicketIds) {
    const ticketNumbers = await findTicketNumbers({
      ...config,
      ticketId: ticketIdOption ?? ticketId,
    })

    if (!ticketNumbers || !ticketNumbers.length) {
      error(`Could not determine ticket number for ${ticketId}`)
    }

    let ticketsToOpen = ticketNumbers

    if (ticketNumbers.length > 1) {
      const {choseTicketNumber} = await inquirer.prompt([
        {
          name: 'choseTicketNumber',
          type: 'list',
          message:
            'Multiple possible ticket numbers were found, which would you like to open?',
          choices: [...ticketNumbers, 'all'],
        },
      ])

      if (choseTicketNumber !== 'all') {
        ticketsToOpen = [choseTicketNumber]
      }
    }

    for (let ticketToOpen of ticketsToOpen) {
      console.log(chalk.gray(`Opening ticket ${ticketToOpen}`))
      const url = ticketUrl.replace('TICKET', ticketToOpen)
      openUrl(url)
    }
  }
}

module.exports = open
