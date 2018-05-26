const Discord = require('discord.js');
var bot = new Discord.Client();
const safeJsonStringify = require('safe-json-stringify');
var crypto = require('crypto');
var moneroWallet = require('monero-nodejs');
var Big = require('big.js');
var config = require('./bot_config');


var Wallet = new moneroWallet(config.wallethostname, config.walletport);





var bot_token = config.bot_token;

bot.login(bot_token);


var MongoClient = require('mongodb').MongoClient;
var url = config.mongodburl;


Initialize();

var owner_id = config.owner_id;
var coin_name = config.coin_name;
var block_maturity_requirement = config.block_maturity_requirement;
var coin_total_units = config.coin_total_units;
var coin_display_units = config.coin_display_units;
var server_wallet_address = config.server_wallet_address;
var withdraw_tx_fees = config.withdraw_tx_fees;
var withdraw_min_amount = config.withdraw_min_amount;
var wait_time_for_withdraw_confirm = config.wait_time_for_withdraw_confirm; // default 20 seconds
var custom_message_limit = config.custom_message_length_limit; // 100 characters
var log1 = config.log_1; // log initial output
var log2 = config.log_2; // log transaction processing and output, logging
var log3 = config.log_3; // log - debug
var isBotListening = false; // Initial is false to wait for the database to connect first
var db;

function Initialize(){
	
	Wallet.balance().then(function(balance) {
    if(log1)console.log("Stats for admins - current balance: " + balance.balance + " "+ coin_name);
});
	
	
MongoClient.connect(url, function(err, dbobj) {
  if (err) throw err;
  console.log("Database created, or already exists!");
  var dbo = dbobj.db("deroTipBot");
  dbo.createCollection("users", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection users created or exists!");
  });
    dbo.createCollection("localtransactions", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection localtransactions successfully created or exists!");
  });
    dbo.createCollection("blockchaintransactions", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection blockchaintransactions successfully created or exists!");
  });
    dbo.createCollection("utility", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection utility successfully created or exists!");
  });
  dbo.createCollection("generallog", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection generallog successfully created or exists!");
  });
  dbo.createCollection("admins", function(err, res) {
    if (err) throw err;
    if(log1)console.log("Collection admins successfully created or exists!");
  });
  
   
  if(dbobj != null){
	  isBotListening = true;
	    db = dbobj;
		if(log3){console.log("Database connected sucessfuly. Bot started listening");}
  }
});

Wallet.height().then(function(data){
if(log3)console.log(data);
	if(log1)console.log("CURRENT WALLET HEIGHT: " + data.height);
	
});

}
function getWalletInfo(callback){
	try{
	Wallet.height().then(function(data){
		Wallet.balance().then(function(balance) {
		
		
				callback("Current wallet height is:" + data.height + " . Current wallet balance is: " + getReadableFloatBalanceFromWalletFormat(balance.balance).toFixed(coin_total_units) + " . Current unlocked balance is: " + getReadableFloatBalanceFromWalletFormat(balance.unlocked_balance).toFixed(coin_total_units));

		});
	
});
	}catch(error){ callback(error); }
}


bot.on('ready', function() {
  if(log1)console.log("DERO TipBot ready and loaded correctly! Hello, admin");
  bot.user.setActivity('READY');
});
function logBlockChainTransaction(incoming, authorId, paymentid ,destination_wallet_address, blockheight, amount){
  var dbo = db.db("deroTipBot");
  
if(incoming == true){ // log incoming transaction
	getUserObjectFromPaymentId(paymentid, function(userdata){
		var userid;
		if(userdata != null){userid = userdata.userid;} else {userid = "UNKNOWN";}
		var d = new Date(); // current date and time
			var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString(); 
		var Event = { Type: "incoming", From: userid, BlockHeight: blockheight, destination_wallet: server_wallet_address , Amount: amount, AddedDateTime: readableDateTimeObject };
   dbo.collection("blockchaintransactions").insertOne(Event, function(err, res) {
		
	});
		
		
	});
} else { // log outgoing transaction

var d = new Date(); // current date and time
			var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString(); 

	var Event = { Type: "outgoing", From: authorId, BlockHeight: "", destination_wallet: destination_wallet_address, Amount: amount, AddedDateTime: readableDateTimeObject };
   dbo.collection("blockchaintransactions").insertOne(Event, function(err, res) {
		
	});
	
}



}
function getCustomMessageFromTipCommand(arguments){
	if(arguments.length > 4){
		var custom_message = "";
		for(var i = 4; i < arguments.length; i++){
			custom_message += " " + arguments[i]; // concatenate message from arguments
		}
		
		return custom_message.substring(0, custom_message_limit + 1);
		
	} else {return "";}
	
}
function logLocalTransaction(from,to,fromname,toname,amount){

  var dbo = db.db("deroTipBot");
	var d = new Date(); // current date and time
			var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString(); 
			
			 var Event = { From: from, To: to, Fromname: fromname, Toname: toname, Amount: amount, DateTime: readableDateTimeObject };
   dbo.collection("localtransactions").insertOne(Event, function(err, res) {
    
	});
}
function isCallingBot(msg){
	if(msg.substring(0,8) == "!tipdero"){
		return true;
	}else {return false;}
	
}

function convertToSystemValue(value){
	var dbnumber = new Big(value).toFixed(coin_total_units);
	if(log3)console.log("Function convertToSystemValue() called - dbnumber:" + dbnumber + " . Original value: " + value.toString());
	return dbnumber;
}

function checkCommand(msg){
	if(isCallingBot(msg.content) == true){
		var arguments = msg.content.replace(/\s+/g,' ').trim().split(' ');  // removes additional spaces
		var command = arguments[1];
		
		if(isBotListening == false && msg.author.id == owner_id){
			if (command == "startlistening"){
				isBotListening = true;
				msg.author.send("Bot returned to life again");
			}
		}
		
		if(isBotListening == false) {return;}
		
		switch(command){
			case 'walletinfo':
				if(msg.author.id == owner_id){
					getWalletInfo(function(walletmessage){
						msg.author.send(walletmessage);
					});
				}
			break;
			case 'stoplistening':
			isAdmin(msg.author.id, function(result){
				if(result == true){
				isBotListening = false;
				msg.author.send("You switched listening of the bot off. The bot will not respond to anyone except owner now");
				}
			});
			break;
			case 'adminhelp':
			isAdmin(msg.author.id, function(result){
				if(result == true){
				msg.author.send("Hello! Welcome to the ADMIN HELP SECTION. \n To show user info, type \"!tipdero showuserinfo userid\" \n To add an admin, type \"!tipdero addadmin userid\" (only available for owner) \n To remove an admin, type \"!tipdero removeadmin userid\" (only available for owner) \n To disable tipping for a user, type \"!tipdero switchtipsend userid allow/disallow\" \n To disable receive of tips for a user, type \"!tipdero switchtipreceive userid allow/disallow\" \n To stop the bot from listening to commands, type \"!tipdero stoplistening\" \n To start bot listening to commands, type \"!tipdero startlistening\" (only available to bot owner) \n To display wallet info, type \"!tipdero walletinfo\" (only available to bot owner)");
				}
			});
			break;
			case 'help':
			msg.author.send("Hello! Welcome to Dero TipBot help section. \n To get your balance, type \"!tipdero mybalance\" \n For deposits, type \"!tipdero deposit\" \n For withdrawals, type \"!tipdero withdraw <walletaddress> <amount>\" (withdrawal fee is " + withdraw_tx_fees +  " " + coin_name + ".), minimum withdrawal amount is " + withdraw_min_amount + " " + coin_name + ". \n To tip someone, type \"!tipdero tip <user_mention> <amount> <Optional: small message>\" \n We are not responsible for any system abuse, please don't deposit/leave big amounts ");
			break;
			case 'mybalance':
				getBalance(msg.author.id, msg, function(data){
					msg.author.send("Hey! Your balance is " + formatDisplayBalance(data.balance) + " " + coin_name +"!");
					
				});
			break;
			case 'deposit':
			getBalance(msg.author.id, msg, function(data){
				msg.author.send("Hey! For deposit into the tip bot, use address: " + server_wallet_address + " WITH payment ID " + data.paymentid + " . If PaymentID is missing, your deposit will be lost");
			});
			break;
			case 'tip':
			var user = arguments[2];
			var amount = arguments[3];
			var custom_message = "";
			
			
			
			//checkCorrectArguments
			try{
				Big(amount);
			}catch(error){msg.reply("Oops! Invalid syntax"); return;}
			//
			if(user == null){msg.reply("Oops! Invalid syntax"); return;}
			if(amount == null){msg.reply("Oops! Invalid syntax");return;}
						
			
			try{user = msg.mentions.users.first().username;}catch(error){msg.reply("Oops! Invalid syntax");return;} /// check to avoid bot crash
			
			try{custom_message = getCustomMessageFromTipCommand(arguments);}catch(err){msg.reply("Oops! Something happened");return;}

			
			var tiptarget = msg.mentions.users.first().id;
			
			var myname = msg.author.username;
			if(tiptarget != null){
			TipSomebody(msg,msg.author.id, tiptarget, user, myname, amount, function(success, message){
				if(success == true){
				msg.channel.send("<@" + tiptarget + "> has been tipped " + formatDisplayBalance(amount) + " " + coin_name + " :moneybag: by " + msg.author + custom_message);
				} else {msg.channel.send(message);}
				
			});
			} else {
				msg.reply("User \"" + user + "\" not found :( . Check if the name is correct");
			}
			break;
			case 'withdraw':
			try{
				if(Big(arguments[3]) < Big(withdraw_min_amount)){
					msg.author.send("Withdrawal error : Withdrawal amount is below minimum withdrawal amount"); return;
				}
			} catch (error){msg.author.send("Syntax error"); return;}
		msg.author.send("You are going to withdraw " +arguments[3] + " " + coin_name + ". The blockchain transaction fee deducted from your withdrawal amount is " + withdraw_tx_fees + " . Type \"yes\" to confirm, or \"no\" to cance; the request ").then(() => {
  msg.channel.awaitMessages(response => response.guild === null && response.author.id == msg.author.id && (response.content === 'yes' || response.content === "no"), {
    max: 1,
    time: wait_time_for_withdraw_confirm,
    errors: ['time'],
  })
  .then((collected) => {
	  if(collected.first().content == "yes"){
		  withDraw(msg.author.id, arguments[2], arguments[3], function(success, txhash){
				if(success == true){
				msg.author.send("Your withdrawal request was successfuly executed and your funds are on the way :money_with_wings: . TxHash is " + txhash);
				} else {
					msg.author.send("An error has occured :scream: , error code is: " + txhash);
					
				}
				
			
			});
		  
	  } else if(collected.first().content == "no"){
      msg.author.send("Your withdrawal request has been canceled at your request :confused: ");
	  }
    })
    .catch(() => {
      msg.channel.send('The withdrawal request was cancelled because you did not confirm :thinking: ');
    });
});
break;
		case 'addadmin':
			var user = arguments[2];
			if(user != null && msg.author.id == owner_id){
				addAdmin(msg.author.id, user, function(callbackmsg){
					msg.reply(callbackmsg);
					
					
				});
			} else {
				msg.reply("You did not mention a user, or you are not an owner. Only owners can add admins");
			}
			break;
	
			case 'removeadmin':
			var user = arguments[2];
			if(user != null && msg.author.id == owner_id){
				removeAdmin(msg.author.id, user, function(callbackmsg){
					msg.reply(callbackmsg);
				});
			} else {
				msg.reply("You did not mention a user, or you are not an owner. Only owners can remove admins");
			}
			break;
			case 'showuserinfo':
			var user = arguments[2];
			if(user == null){msg.reply("Oops! Invalid syntax");return;}
			isAdmin(msg.author.id, function(condition){
				if(condition == true){
					showUserInfo(msg.author.id,user, function(success,data){
						if(success == true){
						msg.author.send("User " + data.userid + " info: \n Balance: " + data.balance + " " + coin_name + " \n Last blockchain deposit check height: " + data.lastdepositbh + " \n PaymentID: " + data.paymentid + " \n Can receive tips: " + (data.canreceivetip == 0 ? "false" : "true") + ". \n Can make tip: " + (data.cantip == 0 ? "false" : "true"));
						}else {
						msg.author.send("Error occured. Check User ID");
						}
					});
				}
				
			});
			break;
		
		case 'switchtipsend':
		var user = arguments[2];
		var decision = arguments[3];
		if(user == null){msg.reply("Invalid syntax");return;}if(decision == null){msg.reply("Invalid syntax");return;}
		isAdmin(msg.author.id, function(condition){
				if(condition == true){
					
					switchTipSend(msg.author.id, user, decision, function(result){
							msg.author.send(result);
					});
					
				}
				
			});
			break;
			case 'switchtipreceive':
		var user = arguments[2];
		var decision = arguments[3];
		isAdmin(msg.author.id, function(condition){
				if(condition == true){
					
					switchTipReceive(msg.author.id, user, decision, function(result){
						msg.author.send(result);
					});
					
				}
				
			});
			break;
		
		}
		
	}
	
	
}

function switchTipReceive(authorId, targetId, decision, callback){
  var dbo = db.db("deroTipBot");

  var newdecision;
  
  if(decision == "allow"){ newdecision = 1; } else if(decision == "disallow"){newdecision = 0;} else {callback("Error : Check the command syntax."); return;}
  
  var myquery = { userid: targetId };
  var newvalues = { $set: { canreceivetip: newdecision } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) throw err;
    if(log3)console.log("Switched tip receiving to " + decision + " for user " + targetId);
	callback("Switched tip receiving to " + decision + " for user " + targetId);
  });
addGeneralEvent("Tip receive " + decision + " for user " + targetId, authorId);
	
}
function switchTipSend(authorId, targetId, decision, callback){
  var dbo = db.db("deroTipBot");

  var newdecision;
  
  if(decision == "allow"){ newdecision = 1; } else if(decision == "disallow"){newdecision = 0;} else {callback("Error : Check the command syntax."); return;}
  
  var myquery = { userid: targetId };
  var newvalues = { $set: { cantip: newdecision } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) throw err;
    if(log3)console.log("Switched tip sending to " + decision + " for user " + targetId);
	callback("Switched tip sending to " + decision + " for user " + targetId);
  });
addGeneralEvent("Tip send " + decision + " for user " + targetId, authorId);
	
}
function addGeneralEvent(action_name, executed_By){
  var dbo = db.db("deroTipBot");
	var d = new Date(); // current date and time
			var readableDateTimeObject = d.toLocaleDateString() + " " + d.toLocaleTimeString(); 
			
			 var Event = { action: action_name, executedBy: executed_By, DateTime: readableDateTimeObject};
   dbo.collection("generallog").insertOne(Event, function(err, res) {
    
	});
}


function generateNewPaymentIdForUser(authorId, targetId, callback){

  var dbo = db.db("deroTipBot");
  
 dbo.collection("users").findOne({ userid: targetId }, function(err, result) {
    if (err) throw err;
	if(result == null){
	callback("That user is not in the database yet!");
	return;
	}
	
		var previouspid = result.paymentid;
	  var newpid = crypto.randomBytes(32).toString('hex');

	var query = { userid: targetId };
  var newvalues = { $set: {paymentid: newpid } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) {callback("Error happened");} else{ // failsafe, only do callback, when successful
	callback("New payment ID for the user " + targetId + " successfuly generated");
	}
	   addGeneralEvent("PaymentID update from " + previouspid + " to new for user " + targetId, authorId); // log the action

  });
  	
			
	
	
  });
  
 
}
function isAdmin(authorId, callback){
	if(authorId == owner_id){callback(true); return;}
	
  var dbo = db.db("deroTipBot");
  
 dbo.collection("admins").findOne({ userid: authorId }, function(err, result) {
    if (err) throw err;
	if(log3)console.log("isAdmin verification called. authorid : " + authorId + " err: " + err + " result: " + result); 
	if(result != null){
	callback(true);
	return;
	}else {callback(false);}

  });
  	  
  
}
function showUserInfo(authorId, targetId, callback){
	
	getUserObject(targetId, function(data){
		if(data != null){
			callback(true, data);
			addGeneralEvent("User info " + targetId + " viewed", authorId); // log the action
		} else {
			callback(false, data);
		}
	});
}
function addAdmin(authorId, targetId,callback){
  var dbo = db.db("deroTipBot");
  
 dbo.collection("admins").findOne({ userid: targetId}, function(err, result) {
    if (err) throw err;
	if(result != null){
	callback("Admin with that ID already exists!");
	return;
	}

  var adminObject = { userid: targetId };
  dbo.collection("admins").insertOne(adminObject, function(err, res) {
    if (err) {callback("Error happened");} else{ // failsafe, only do callback, when successful
	callback("Admin with user id " + targetId + " successfuly added!");
	}
	
   addGeneralEvent("addAdmin with user id " + targetId, authorId); // log the action

  });
  	
			
	
  });
  
  
  
  

}
function removeAdmin(authorId, targetId,callback){
	if(log3)console.log("removeAdmin function was called. Command issuer id: " + authorId + " . Target (id): " + targetId);
  var dbo = db.db("deroTipBot");

  var adminObject = { userid: targetId };
  dbo.collection("admins").deleteOne(adminObject, function(err, res) {
    if (err) {callback("Error happened");} else{ 
	callback("Admin with user id " + targetId + " successfuly removed or didn't exist!");
	}
	
   addGeneralEvent("Removed admin with user id " + targetId, authorId); // log the action

  });
  	

  
  
  
  

}

function getWalletFormatFromBigNumber(bignumber){ // method not required since convert function in wallet.js monero-nodejs. This must be modified in the wallet in order to be able to work correctly for currencies with less decimal places
	var numberformat = bignumber.toFixed(coin_total_units).replace(".",""); 
	return Number(numberformat);
}

function isBlockMatured(currentBlockHeight, paymentBlockHeight){
	if(log3)console.log("Function isBlockMatured called. Current block height : " + currentBlockHeight + " . Payment block height: " + paymentBlockHeight);
	if(currentBlockHeight - paymentBlockHeight >= block_maturity_requirement){return true;}else{return false;}
}
function withDraw(authorId, walletaddress, w_amount, callback){
	if(log3)console.log("Function withdraw called. AuthorId : " + authorId + " . Wallet address for withdraw: " + walletaddress + " . Withdraw amount: " + w_amount.toString()); 
	checkTargetExistsIfNotCreate(authorId, function(){
		getUserObject(authorId, function(data){
				
				var authorbalance = Big(data.balance);
				var wamount = Big(w_amount);
				var wamount_before_txfees = wamount;
				if(log3)console.log("Function withdraw: wamount: " + wamount.toString());
				if(log3)console.log("Function withdraw: authorbalance: " + authorbalance.toString());
				if(log3)console.log("Function withdraw: minus: " + authorbalance.minus(wamount).toString());
				var checkEnoughBalance = authorbalance.minus(wamount);
				var withdrawAmountTxFeesCheck = Big(wamount).minus(Big(withdraw_tx_fees));
				if(checkEnoughBalance >= 0 && withdrawAmountTxFeesCheck > 0){
					wamount = wamount.minus(Big(withdraw_tx_fees));
					if(log3)console.log("Function withdraw: withdraw amount (wamount) minus tx fees" + wamount.toString());
					// wamount = getWalletFormatFromBigNumber(wamount); not required since getWalletFormatFromBigNumber ^
					minusBalance(authorId, wamount_before_txfees, function(){
						if(log3)console.log("Function withdraw: wamount passed into transfer " +wamount);
					Wallet.transfer({ amount: wamount, address: walletaddress}).then(function(txh){
						if(txh.hasOwnProperty("tx_hash") == false){
							if(log3)console.log("Function withdraw: " + txh);
							if(txh.hasOwnProperty("code") == true){
								console.log("Function withdraw: Transaction failed. Reason: " + txh.message + " . Code: " + txh.code);
							callback(false , txh.code);
							}else{callback(false, "Unknown error");}
							return;
						};
						
						
						logBlockChainTransaction(false, authorId, null ,walletaddress, null, wamount.toString());
						console.log(txh);
						console.log("Withdraw in process " + txh.tx_hash);
						callback(true, txh.tx_hash); // return success, and txhash
						
					});
					});
					
				} else {
					callback(false, "You have not enough balance, or you're sending amount, which after tx fees would be negative, or 0.");
					
				}
				
				
			
		});
		
	});
	
}

function minusBalance(targetId, amount, callback){
if(log3)console.log("Function minusBalance called. target (id) : " + targetId + " . amount: " + amount.toString()); 
  var dbo = db.db("deroTipBot");
  
  getUserObject(targetId, function(data){

  var userbalance = Big(data.balance);
  var transactedamount = Big(amount);
  var newbalance = convertToSystemValue(userbalance.minus(transactedamount));
 
  var myquery = { userid: targetId };
  var newvalues = { $set: { balance: newbalance } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) {throw err;} else{ // failsafe, only do callback, when successful
	callback();
	}
	
  });
  
  });
	
}

function addBalance(targetId, amount, callback){
  var dbo = db.db("deroTipBot");
  
  getUserObject(targetId, function(data){

  var userbalance = Big(data.balance);
  var transactedamount = Big(amount);
  var newbalance = convertToSystemValue(userbalance.plus(transactedamount));
 
  var myquery = { userid: targetId };
  var newvalues = { $set: { balance: newbalance } };
  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
    if (err) {throw err;} else{ // failsafe, only do callback, when successful
	callback();
	}
	
  });
  
  });
	
	
}

function checkTargetExistsIfNotCreate(targetId, callback){
	getUserObject(targetId, function(result){
		if(result == null){
			createNewUser(targetId, function(){
				
				callback();
			});
			
		} else {
			callback();
			
		}
		
	});
}
function TipSomebody(msg,authorId, tipTarget, tiptargetname, tipperauthorname, transaction_amount,callback){
	var authorbalance;
	if(authorId == tipTarget){callback(false, "Sorry folk, but you can't tip yourself");return;}
	
	checkTargetExistsIfNotCreate(tipTarget, function(){ /// check if tipper target exists, if not , create it with balance 0
		
		checkTargetExistsIfNotCreate(authorId, function(){ /// check if tipper author exists, if not , create it with balance 0
	
	var transactionamount = new Big(Big(transaction_amount).toFixed(coin_total_units));
			if(transactionamount <= 0){callback(false, "Sorry but you can't tip negative balance");return;}
	getBalance(msg.author.id, msg, function(data){
		getUserObject(tipTarget, function(data2){
			if(data.cantip == 0){callback(false, "You aren't allowed to make a tip"); return;} // Check if the tipper is allowed to tip
			if(data2.canreceivetip == 0){callback(false, "You can't tip that person"); return;} // Check if the tip target can receive tip?
		authorbalance = new Big(data.balance);
		console.log(authorbalance);
				console.log(transactionamount);
				console.log(authorbalance >= transactionamount);
				if(authorbalance >= transactionamount){
			
							var dbo = db.db("deroTipBot");
							var myquery = { userid: authorId };
							console.log("Internal transaction processing,  amount : " + transactionamount);
							var authorNewBalance = Big(authorbalance.minus(transactionamount)).toFixed(coin_total_units);
							var newvalues = { $set: { balance: authorNewBalance } };
							  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
								  /// now we updated the user balance, so now I will log the transaction between these users
								  
								   /// get tip target balance
										getUserObject(tipTarget, function(tipperdata){
										
												/// finally update tip Target balance --
												var newtiptargetbalance = Big(tipperdata.balance).plus(transactionamount);
												var tipperQuery = { userid: tipTarget };
												
												console.log(tipTarget);
												console.log("Nazdaar " + newtiptargetbalance);
												
												
												var tipperNewValue = { $set: { balance: newtiptargetbalance.toFixed(coin_total_units) } };
							  dbo.collection("users").updateOne(tipperQuery, tipperNewValue, function(err, res) {
								  		if (err) throw err;
								 /// finally make callback with success
								 callback(true, "");
								logLocalTransaction(authorId, tipTarget, tipperauthorname, tiptargetname, transactionamount.toString()); /// Log this transaction
							  });
												
										});
								
								  
								  
								  
								  
								if (err) throw err;
								console.log("1 user updated");
							  });
					
					
					
					
					
					
				} else {
					msg.reply("You don't have enough balance for that :( ");
					callback(false);
					
				}
	
			
			
			});
		});
	
	});
	});
}


function formatDisplayBalance(balance){
	return(Big(balance).toFixed(coin_display_units));
	
}
function getReadableFloatBalanceFromWalletFormat(paymentamount){	
paymentamount = paymentamount.toString(); // crucial, if we're using paymentamount.length, if number passed, it would be undefined, which would result in wrong computation
	var array = paymentamount.toString().split("");
	
	if(array.length < coin_total_units){
			for(var i = 0; i <= coin_total_units-paymentamount.length; i++){ // how much zeroes to add, if balance in wallet format (eg. 800000) deposited < 12 characters
					array.splice(0,0,"0");
			}
		
	}	
	
	
	array.splice(array.length - coin_total_units, 0,".");
	
	return Big((Big(array.join(""))).toFixed(coin_total_units));
	
	
}

function UpdateBalanceForUser(g_userid,callback){
	console.log("UpdateBalanceForUser function called");
	var walletheight;
	Wallet.height().then(function(data){
	if(!data.hasOwnProperty("height")){
		console.log("Cannot get current wallet blockchain height! For security reasons, skipping the balance update");
		callback();
		return;
		
	}
		walletheight = data.height;
		console.log(walletheight);
  var dbo = db.db("deroTipBot");
		var query = { userid: g_userid };
  dbo.collection("users").findOne(query, function(err, result) {
    if (err) throw err;
    if(result == null){ callback(); return;}
	
	
	if(log3)console.log(result.paymentid); // CL
	
	
	Wallet.getBulkPayments([result.paymentid], result.lastdepositbh).then(function(bulkdata){
	if(bulkdata.hasOwnProperty("payments")){		
		getUserObject(g_userid, function(userobject){
		
		
		var lastcheckheight = 0;
		var addbalance = Big("0.0");
	for(var i = bulkdata.payments.length-1; i >= 0; i--){
				if(isBlockMatured(walletheight, bulkdata.payments[i].block_height) == true){
			
			if(log3)console.log("Block matured amount" + bulkdata.payments[i].amount);
			if(log3)console.log("Block deposit height" + bulkdata.payments[i].block_height);
			lastcheckheight = bulkdata.payments[i].block_height +1; // +1 because wallet getbulkpayments is from >= 

			logBlockChainTransaction(true, null, result.paymentid ,null,bulkdata.payments[i].block_height , bulkdata.payments[i].amount);
			
			
			//////////////////
			if(log3)console.log(getReadableFloatBalanceFromWalletFormat(bulkdata.payments[i].amount).toString());
			if(log3)console.log(bulkdata.payments[i].amount);
			if(log3)console.log(addbalance.toString());
			addbalance = addbalance.plus(Big(Big(getReadableFloatBalanceFromWalletFormat(bulkdata.payments[i].amount)).toFixed(coin_total_units)));
		} else {
			
		}
	}
	
	if(log3)console.log("AddToBalance " + addbalance.toString());
	
	var newbalance = (Big(userobject.balance).plus(addbalance)).toFixed(coin_total_units);

	if(log3)console.log("Previous user balance: " + userobject.balance);
	if(log3)console.log("New user balance after checking deposits: " + newbalance.toString());
		if(log3)console.log("Last user deposit check height: " + lastcheckheight);

	
							
							
							var myquery = { userid: g_userid };
							var newvalues = { $set: { balance: newbalance, lastdepositbh: lastcheckheight } };
							  dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
									
									callback();

							  });
		});
	} else {callback();}
	});
	
  });
	

	});
}


function createNewUser(targetId, callback){
  var dbo = db.db("deroTipBot");
  var initial_balance = 0;
  initial_balance = initial_balance.toFixed(coin_total_units);
  
  var pid = crypto.randomBytes(32).toString('hex');

  var newUser = { userid: targetId, balance: initial_balance, paymentid: pid , lastdepositbh: 0, canreceivetip: 1, cantip: 1};
  dbo.collection("users").insertOne(newUser, function(err, res) {
    if (err) throw err;
    console.log("User " + targetId + " added into DB");
    callback();
	
  });
	
}


function getUserObject(targetId, callback){
  var dbo = db.db("deroTipBot");
  var query = { userid: targetId };
  dbo.collection("users").findOne(query, function(err, result) {
    if (err) throw err;
    
	callback(result);
  });
	
}
function getUserObjectFromPaymentId(pid, callback){

  var dbo = db.db("deroTipBot");
  var query = { paymentid: pid };
  dbo.collection("users").findOne(query, function(err, result) {
    if (err) throw err;
    
	callback(result);
  });
}


function getBalance(authorId, msg,callback){
	if(log3)console.log("getBalance function called. Author (id) : " + authorId );
	UpdateBalanceForUser(authorId, function(){
			if(log3)console.log("getBalance function - UpdateBalanceForUser function passed succesfully");

	getUserObject(authorId, function(data){
					if(log3)console.log("getBalance function - User object of "+ authorId + " was got succesfully.");

		if (data == null){
			createNewUser(authorId, function(){
									if(log3)console.log("getBalance function - New user created successfully");
					getUserObject(authorId, function(data2){

					if(data2 == null){
						if(msg != null){msg.author.send("There was an error. Please try again later");}
						
					} else {
						
						callback(data2);
					}
					});
				
			});
		} else {
			
			callback(data);
		}
		
	});
	
	});
	
}






bot.on('message', msg => checkCommand(msg));





