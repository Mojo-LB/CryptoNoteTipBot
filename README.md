# DeroTipBot

## This Should work with Monero, and any fork that uses 12-decimals

If you like to adjust to other forks that don't use 12-decimals, please change decimal value in 


--- Standard Requirements : 
----------------------------------------------------------------------------
Mongodb version 3.6.4 (compatible), other version use is not recommended, but it can work
```sudo apt install mongodb```

Node.js version 8.11.2 (compatible), other version is not recommended, but it can work

Navigate to bot directory
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install 8.11.2
```
----------------------------------------------------------------------------
--- Commands for plugin requirements (if plugins are not included)
----------------------------------------------------------------------------
npm install discord.js
npm install safe-json-stringify
npm install monero-nodejs
npm install big.js
----------------------------------------------------------------------------
--- Instructions for bot_config.js
wallethostname - your wallet RPC server hostname, default is already included
walletport - your wallet RPC server port, default is already included
bot_token - get your token from https://discordapp.com/developers/applications/me (as of 22.05.2018). generate user for the bot, and click to reveal the Token
mongodburl - whole url, on which mongoDB is listening on. Find it in your mongodb config

owner_id - your discord user id
coin_name - The coin used for the display replies
block_maturity_requirement - !IMPORTANT, if not set correctly, the user may tip balance before it gets fully confirmed
coin_total_units - total decimal units used by the coin
coin_display_units - total units displayed by the output
server_wallet_address - wallet address on which deposits are sent to and on which RPC server is running
withdraw_tx_fees - fee in string, it will be taken from the withdrawal amount
withdraw_min_amount - the minimum amount in string, required for withdrawal to pass
wait_time_for_withdraw_confirm - waiting time until user confirms his withdrawal (in milliseconds), default is 20000
log_1 - log initial output in the console (true, false)
log_2 - log some actions in that are running in the bot eg. transactions (true, false)
log_3 - log (debug). Logging everything possible, every function called, and arguments passed (true, false)
