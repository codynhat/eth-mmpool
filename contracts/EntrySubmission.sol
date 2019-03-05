pragma solidity ^0.4.17;

contract EntrySubmission {
  uint constant entryFee = 1000000000 wei; // 1 Gwei per bracket
  address constant trustedScorer = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
  uint constant entryStopEpoch = 1553180400; // Valid entry submission time. before March 21, 2019 8:00AM PST
  uint constant rewardStartEpoch = 1554793200; // Valid reward submission time. after April 9, 2019 12:00AM PST

  struct Entry {
    bytes32 multihash_digest;
    uint8 multihash_hashFunction;
    uint8 multihash_size;
    uint bracketCount;
    uint reward;
    bool exists;
  }

  event EntrySubmitted(address entrant);

  mapping (address => Entry) public entries;

  function submitEntry(bytes32 _digest, uint8 _hashFunction, uint8 _size, uint bracketCount) public payable {
    // Is entry fee sufficient?
    require(msg.value >= (entryFee * bracketCount));

    require(now < entryStopEpoch);

    entries[msg.sender] = Entry(_digest, _hashFunction, _size, bracketCount, 0, true);
    emit EntrySubmitted(msg.sender);
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
