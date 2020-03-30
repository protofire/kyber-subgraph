## Kyber subgraph

This subgraph is intended to be able to access Kyber Network data in an easier way.

We index NetworkProxy, Networks, Reserves, Trades, Orders and some metadata from transactions so that it's easier to access Kyber data to be used on any app that may require it!

[Here's the link to the deployed subgraph](https://thegraph.com/explorer/subgraph/protofire/kyber?selected=playground)

### Volume of trade

We keep some aggregated data of the total volume of trade in different levels, a reserve-wide level, a network-wide level (network as in network contract), and a total level. We do this so that it's possible to calculate not only the whole volume of trade of any token, but also in which reserves those trades are mostly happening.

Also with the total aggregated volume of trade and a cool feature of the Graph v0.17 called "time travel queries", it's possible to calculate volume of trade for any interval of time. [Here's an article](https://blocklytics.org/blog/ethereum-blocks-subgraph-made-for-time-travel/) that better explains this concept and how to use it.
