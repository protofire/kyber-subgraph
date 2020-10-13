==============
Kyber subgraph
==============

.. toctree::
    :maxdepth: 2

    overview.rst
    contracts.rst
    domain-entities.rst

Improvement proposals
=====================

- FullTrades are created from three separate events and there's a lot of duplicate code, perhaps we could modularize it all in a single function which can receive all the event types
- Something similar happens with AddReserveToNetwork and RemoveReserveFromNetwork, but the duplication is smaller
- Research if we should return when handling ListReservePairs and the network is null, or we should instead exit with an error (``assert(reserve!=null)``)
- Link a FullTrade with the ReserveTrades for the same transaction, if possible
