var EntrySubmission = artifacts.require("EntrySubmission");

contract('EntrySubmission', accounts => {

  const digest = "0x527a53913847f59716da788fa156e65f41c2320768181c0b1a8f88dcaa68183d"

  it("should write entry with exactly sufficient entry fee", () => {
    let fee = web3.toWei(10, "gwei")
    let account = accounts[0]
    let startingBalance = web3.eth.getBalance(EntrySubmission.address)
    return EntrySubmission.deployed().then(instance => {
      return instance.submitEntry(digest, 18, 32, 10, {from: account, value: fee}).then(result => {
        assert.equal(result.logs[0].args.entrant, account, "Account does not match event")
        return instance.entries.call(account)
      })
    }).then(entry => {
      assert.equal(entry[0], digest, "entryHash digest not saved")
      assert.equal(entry[1].toNumber(), 18, "entryHash algo not saved")
      assert.equal(entry[2].toNumber(), 32, "entryHash size not saved")
      assert.equal(entry[3].toNumber(), 10, "bracketCount not saved")
      let newBalance = web3.eth.getBalance(EntrySubmission.address)
      assert.deepEqual(startingBalance.plus(fee), newBalance)
    })
  })

  it("should write entry with too high entry fee", () => {
    let fee = web3.toWei(100, "gwei")
    let account = accounts[1]
    let startingBalance = web3.eth.getBalance(EntrySubmission.address)
    return EntrySubmission.deployed().then(instance => {
      return instance.submitEntry(digest, 18, 32, 10, {from: account, value: fee}).then(result => {
        assert.equal(result.logs[0].args.entrant, account, "Account does not match event")
        return instance.entries.call(account)
      })
    }).then(entry => {
      assert.equal(entry[0], digest, "entryHash digest not saved")
      assert.equal(entry[1].toNumber(), 18, "entryHash algo not saved")
      assert.equal(entry[2].toNumber(), 32, "entryHash size not saved")
      assert.equal(entry[3].toNumber(), 10, "bracketCount not saved")
      let newBalance = web3.eth.getBalance(EntrySubmission.address)
      assert.deepEqual(startingBalance.plus(fee), newBalance)
    })
  })

  it("should fail entry with too low entry fee", () => {
    let fee = web3.toWei(0.1, "gwei")
    let account = accounts[2]
    let startingBalance = web3.eth.getBalance(EntrySubmission.address)
    return EntrySubmission.deployed().then(instance => {
      return instance.submitEntry(digest, 18, 32, 10, {from: account, value: fee})
    }).catch(err => {
      assert.isNotNull(err, "Expected error but none was found")
    }).then(() => {
      let newBalance = web3.eth.getBalance(EntrySubmission.address)
      assert.deepEqual(startingBalance, newBalance)
    })
  })

  it("should fail entry if already exists", () => {
    let fee = web3.toWei(10, "gwei")
    let account = accounts[3]
    let startingBalance = web3.eth.getBalance(EntrySubmission.address)
    return EntrySubmission.deployed().then(instance => {
      return instance.submitEntry(digest, 18, 32, 10, {from: account, value: fee})
        .then(() => instance.submitEntry(digest, 18, 32, 10, {from: account, value: fee}))
    }).catch(err => {
      assert.isNotNull(err, "Expected error but none was found")
    }).then(() => {
      let newBalance = web3.eth.getBalance(EntrySubmission.address)
      assert.deepEqual(startingBalance.plus(fee), newBalance)
    })
  })

  it("should submit rewards", () => {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10000000], id: 0})

    let account = accounts[0]
    return EntrySubmission.deployed().then(instance => {
      return instance.submitRewards(accounts, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], {from: account})
        .then(result => instance.entries.call(account))
        .then(entry => {
          assert.equal(entry[4].toNumber(), 10, "reward not saved")
          return instance.entries.call(accounts[8])
        })
        .then(entry => {
          assert.equal(entry[4].toNumber(), 2, "reward not saved")
        })
    })
  })

  it("should not submit rewards on bad sender", () => {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10000000], id: 0})

    let account = accounts[1]
    return EntrySubmission.deployed().then(instance => {
      return instance.submitRewards(accounts, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], {from: accounts[0]})
        .then(() => instance.submitRewards(accounts, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], {from: account}))
        .catch(err => {
          assert.isNotNull(err, "Expected error but none was found")
        })
        .then(() => {
          return instance.entries.call(account)
            .then(entry => {
              assert.equal(entry[4].toNumber(), 0, "reward not equal to 0")
            })
        })
    })
  })

  it("should withdraw reward", () => {
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [10000000], id: 0})

    let account = accounts[4]
    let startingContractBalance = web3.eth.getBalance(EntrySubmission.address)
    let startingAccountBalance = web3.eth.getBalance(account)
    return EntrySubmission.deployed().then(instance => {
      return instance.submitRewards([account], [web3.toWei(100, "gwei")], {from: accounts[0]})
        .then(() => instance.withdrawReward({from: account, gasPrice: 0}))
    }).then(res => {
      let newContractBalance = web3.eth.getBalance(EntrySubmission.address)
      let newAccountBalance = web3.eth.getBalance(account)
      assert.deepEqual(startingContractBalance.minus(newContractBalance), newAccountBalance.minus(startingAccountBalance))
      assert.equal(web3.toWei(100, "gwei"), newAccountBalance.minus(startingAccountBalance).toString())
    })
  })

})
