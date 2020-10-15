===============
Domain entities
===============

Reserve
=======
Reserves are the liquidity providers of Kyber.
When a FullTrade is initiated by a user, the user's tokens are sent to a reserve of that token which trades sends ETH to a second reserve in exchange for the destination tokens.

.. uml::
    :caption: lines here represent flow of money, not contract calls

    @startuml
    Actor User
    Participant KyberNetwork
    Participant SourceReserve
    Participant DestinationReserve

    User -> KyberNetwork: sourceTokens
    KyberNetwork -> SourceReserve: sourceTokens
    SourceReserve --> KyberNetwork: ETH
    KyberNetwork -> DestinationReserve: ETH
    DestinationReserve --> KyberNetwork: destinationTokens
    KyberNetwork --> User: destinationTokens
    @enduml

The KyberNetwork contract is responsible for choosing the best reserves to
tw

FullTrade
=========
Created from ExecuteTrade and KyberTrade (v1 and v2)

.. note:: TODO: check if an order can go through several reserves, AFAIK in Bancor it's possible
