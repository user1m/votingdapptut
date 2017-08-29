var solc = require("solc"); // import the solidity compiler
var Web3 = require("web3"); // import web3
var fs = require("fs"); //import the file system module
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); //initialize the web3 object to listen on the port testrpc is running on - so we can communicate with the blockchain
//query all the accounts in the blockchain
console.log("\n------------ LOGGING ACCOUNTS -------------\n");
console.log(web3.eth.accounts);
//compile the contract - load the code from Voting.sol in to a string variable and compile it.
var code = fs.readFileSync("Voting.sol").toString();
var compiledCode = solc.compile(code);

console.log("\n------------ LOGGING COMPILED CODE -------------\n");
console.log(compiledCode);
//grab the bytecode from Voting.sol compiled - This is the code which will be deployed to the blockchain.
var byteCode = compiledCode.contracts[":Voting"].bytecode;
console.log("\n------------ LOGGING BYTECODE -------------\n");
console.log(byteCode);
//grab the contract interface, called the Application Binary Interface (ABI), which tells the user what methods are available in the contract.
var abi = compiledCode.contracts[":Voting"].interface;
console.log(
  "\n------------ LOGGING Application Binary Interface (ABI) -------------\n"
);
console.log(abi);
//parse the abi string into a JS object
var abiDefinition = JSON.parse(abi);

//deploy the contract:

//1. You first create a contract object which is used to deploy and initiate contracts in the blockchain.
var VotingContract = web3.eth.contract(abiDefinition);

var contractInstance;
//2. VotingContract.new below deploys the contract to the blockchain.

//The first parameter is contract constructor parameters. We pass in our 3 candidates (an array of bytes32 as defined in our contract constructor
//Note: if our contract tool more parameters, they be listed in order following the first parameter

//The next parameter is the info needed to actually deploy the contract:
//data: This is the compiled bytecode that we deploy to the blockchain
//from: The blockchain has to keep track of who deployed the contract. In this case, we are just picking the first account. In the live blockchain, you can not just use any account. You have to own that account and unlock it before transacting. You are asked for a passphrase while creating an account and that is what you use to prove your ownership of that account. Testrpc by default unlocks all the 10 accounts for convenience.
//gas: It costs money to interact with the blockchain. This money goes to miners who do all the work to include your code in the blockchain. You have to specify how much money you are willing to pay to get your code included in the blockchain and you do that by setting the value of ‘gas’. The ether balance in your ‘from’ account will be used to buy gas. The price of gas is set by the network. The amount of gas it takes to execute a transaction or deployment is calculated by the operations in the contract / function being executed.

//The final parameter is a callback function. After the contract is deployed this function will be called with either an error or our contract instance

var deployedContract = VotingContract.new(
  ["Rama", "Nick", "Claudius"],
  {
    data: byteCode,
    from: web3.eth.accounts[0],
    gas: 4700000
  },
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        console.log(
          "\n------------ Contract waiting to be mined -------------\n"
        );
        console.log(
          "Contract transaction send: TransactionHash: " +
            contract.transactionHash +
            " waiting to be mined...\n"
        );
      } else {
        console.log("Contract mined! Address: " + contract.address);
        console.log(
          "\n------------ LOGGING Deployed Contract  -------------\n"
        );
        //NOTE: When you have to interact with your contract, you will need this deployed address and abi definition (More below)
        console.log(contract);
        console.log("\n------------ LOGGING Contract Address -------------\n");
        console.log(contract.address);
        //get the instance of the contract at this address
        contractInstance = VotingContract.at(contract.address);
        //execute contract functions on the blockchain
        console.log(
          "\n------------ LOGGING Executing contract calls -------------\n"
        );
        console.log("Votes for Rama before: ");
        //totalVotesFor() is a function in our contract
        console.log(contractInstance.totalVotesFor.call("Rama").valueOf());

        //execute a transaction. The transaction id (output) is the proof that this transaction occurred and you can refer back to this at any time in the future. This transaction is immutable.
        console.log(
          contractInstance.voteForCandidate("Rama", {
            from: web3.eth.accounts[0]
          })
        );

        //votes for Rama should go up by 1
        console.log("Votes for Rama after: ");
        console.log(contractInstance.totalVotesFor.call("Rama").valueOf());
        //write the contract address and abi to file for client side JS to use to interact with contract
        fs.writeFile(
          "./contract.json",
          JSON.stringify(
            {
              address: contract.address,
              abi: JSON.stringify(abiDefinition, null, 2)
            },
            null,
            2
          ),
          "utf-8",
          function(err) {
            if (err) {
              console.log("ERROR: ");
              console.log(err);
            } else {
              console.log(`The file ./contract.json was saved!`);
            }
          }
        );
      }
    } else {
      console.log(e);
    }
  }
);
