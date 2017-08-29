//after the script tags are loaded (web3 & jquery) run this function
window.onload = function() {
  //initialize web3
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  var contractInstance;

  //load the json file we wrote to earlier
  $.getJSON("./contract.json", function(contract) {
    // console.log(contract);

    //get the instance of our contract using the address and abi as discussed earlier - will always need these 2 to interact with a deployed contract instance
    contractInstance = web3.eth
      .contract(JSON.parse(contract.abi))
      .at(contract.address);

    //on the vote button click, execute this function on the contract.
    //sign the transaction by using the first account
    window.voteForCandidate = function() {
      candidateName = $("#candidate").val();
      contractInstance.voteForCandidate(
        candidateName,
        { from: web3.eth.accounts[0] },
        function() {
          let div_id = candidates[candidateName];
          $("#" + div_id).html(
            contractInstance.totalVotesFor.call(candidateName).toString()
          );
        }
      );
    };

    //after we have an instance of the contract update the canidate votes
    for (var i = 0; i < candidateNames.length; i++) {
      let name = candidateNames[i];
      let val = contractInstance.totalVotesFor.call(name).toString();
      $("#" + candidates[name]).html(val);
    }
  });

  var candidates = {
    Rama: "candidate-1",
    Nick: "candidate-2",
    Claudius: "candidate-3"
  };

  var candidateNames = Object.keys(candidates);

  //initialize canidate votes to 0 until we have an instance of the contract instance
  $(document).ready(function(event) {
    for (var i = 0; i < candidateNames.length; i++) {
      let name = candidateNames[i];
      $("#" + candidates[name]).html(0);
    }
  });
};
