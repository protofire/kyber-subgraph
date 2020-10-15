========
Overview
========

.. uml::

    @startuml
    class FullTrade {
    }

    class User {
        isPermissionless
        isRemoved
        isTradeEnabled
    }

    class Reserve {
    }

    class Order {
        isCancelled
        isRemoved
        isEthToToken
        srcAmount
        destAmount
    }

    class Network {
        isCurrentNetwork
        isEnabled
    }

    class ReserveTrade {
    }

    class TradingPair {
    }

    class Token {
    }

    class NetworkTradeVolume {
    }

    class ReserveTradeVolume {
    }

    class TotalTradeVolume {
    }

    User -- "*" FullTrade
    User -- "*" Order
    Reserve -- "*" Order
    Reserve -- "*" TradingPair
    Reserve -- "*" ReserveTrade
    FullTrade -- "2" Token
    Network -- "*" Reserve
    Network -- "*" NetworkTradeVolume
    ReserveTrade -- "2" Token
    TradingPair -- "2" Token
    Token -- "*" ReserveTradeVolume
    Token -- "*" TotalTradeVolume
    Token -- "*" NetworkTradeVolume
    @enduml
