pragma solidity ^0.4.17;

contract EntrySubmission {
  uint constant entryFee = 10*1000000000 wei; // 10 Gwei

  struct Entry {
    uint entryHash;
    uint bracketCount;
    bool exists;
  }

  mapping (address => Entry) public entries;

  function submitEntry(uint entryHash, uint bracketCount) public payable {
    // Is entry fee sufficient?
    require(msg.value >= (entryFee * bracketCount));

    // Fail to overwrite entry
    require(entries[msg.sender].exists == false);

    // Valid submission time. March 15, 2018 8:00AM PST
    require(now < 1521126000);

    entries[msg.sender] = Entry(entryHash, bracketCount, true);
  }
}
