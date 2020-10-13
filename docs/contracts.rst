================
Static contracts
================

KyberNetwork
============
A static KyberNetwork contract is initalized for the first known implementation. Further KyberNetwork contracts are created as templates.

KyberNetworkProxy
=================
Only the KyberNetworkSet event is handled, which is used to create a new KyberNetwork and set the it as the current one.

=========
Templates
=========

MergedKyberReserve
==================

KyberNetwork
============
Both the template and the hardcoded static network have handlers for the events:

- AddReserveToNetwork (version 1 and 2)
- RemoveReserveFromNetwork
- ListReservePairs (version 1 and 2)
- KyberNetworkSetEnable

exclusive for the first version:

- ExecuteTrade 

Exclusive for the template version:

- KyberTrade (version 1 and 2)
