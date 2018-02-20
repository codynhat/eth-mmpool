pragma solidity ^0.4.17;

contract EntrySubmission {
  uint constant entryFee = 10*1000000000 wei; // 10 Gwei
  address constant trustedScorer = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
  uint constant entryStopEpoch = 1521126000; // Valid entry submission time. before March 15, 2018 8:00AM PST
  uint constant rewardStartEpoch = 1522738800; // Valid reward submission time. after April 3, 2018 12:00AM PST

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

    require(now < entryStopEpoch);

    entries[msg.sender] = Entry(entryHash, bracketCount, 0, true);
    EntrySubmitted(msg.sender);
  }

  function submitRewards(address[] entrants, uint[] rewards) public {
    // Predetermined multi-sig wallet
    require(msg.sender == trustedScorer);

    require(now > rewardStartEpoch);

    require(entrants.length == rewards.length);

    for (uint i = 0; i < entrants.length; i++) {
      address entrant = entrants[i];
      uint reward = rewards[i];
      entries[entrant].reward = reward;
    }
  }

  function withdrawReward() public {
    uint reward = entries[msg.sender].reward;
    entries[msg.sender].reward = 0;
    msg.sender.transfer(reward);
  }
}
