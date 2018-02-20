pragma solidity ^0.4.17;

contract EntrySubmission {
  uint constant entryFee = 10*1000000000 wei; // 10 Gwei
  address constant trustedScorer = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;

  struct Entry {
    uint entryHash;
    uint bracketCount;
    uint reward;
    bool exists;
  }

  event EntrySubmitted(address entrant);

  mapping (address => Entry) public entries;

  function submitEntry(uint entryHash, uint bracketCount) public payable {
    // Is entry fee sufficient?
    require(msg.value >= (entryFee * bracketCount));

    // Fail to overwrite entry
    require(entries[msg.sender].exists == false);

    // Valid submission time. March 15, 2018 8:00AM PST
    require(now < 1521126000);

    entries[msg.sender] = Entry(entryHash, bracketCount, 0, true);
    EntrySubmitted(msg.sender);
  }

  function submitRewards(address[] entrants, uint[] rewards) public {
    // Predetermined multi-sig wallet
    require(msg.sender == trustedScorer);

    require(entrants.length == rewards.length);

    for (uint i = 0; i < entrants.length; i++) {
      address entrant = entrants[i];
      uint reward = rewards[i];
      entries[entrant].reward = reward;
    }
  }
}
