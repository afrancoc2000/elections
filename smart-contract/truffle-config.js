require('dotenv').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

console.log(process.env.MNEMONIC);

module.exports = {
  networks: {
    xdai: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          "https://rpc.gnosischain.com"
        );
      },
      network_id: 100,
      gas: 500000,
      gasPrice: 1000000000,
    },
    zokol: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [process.env.PRIVATE_KEY_1],
          providerOrUrl: "https://sokol.poa.network/"
        });
      },
      network_id: 77,
    },
    ganache: {
      host: "localhost", 
      port: 7545, 
      gas: 5000000,
      network_id: "*",
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.16", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "sqlite",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
};
