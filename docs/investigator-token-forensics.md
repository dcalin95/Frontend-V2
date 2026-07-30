# Investigator Token Forensics

## Production contract

An address must be submitted with primary subject type `token` or `contract` to
activate token-forensics collection. The backend uses Etherscan V2 and stores a
versioned forensic snapshot owned by the authenticated Investigator user.

The bounded `token-forensics-1.0.0` adapter collects:

- contract creation and confirmed deployer;
- verified source metadata, constructor arguments, proxy and implementation;
- bounded normal transactions involving the contract;
- bounded ERC-20 transfer events for the token;
- provider provenance and explicit evidence IDs;
- a lifecycle matrix, control map, 21 automatic views, and investigation gaps.

Synthetic provider data is prohibited.

## Attribution rules

The deployer is labelled `confirmed_contract_deployer`. This does not establish
beneficial ownership, personal identity, criminal intent, or common control.
Relationships based on shared funding, timing, or behavior must remain probable
or possible until authoritative evidence exists.

## Proceeds ledger

The proceeds ledger contains only events classified as an extraction mechanism.
Unclassified transfers never contribute to extracted-value totals. The current
bounded adapter does not yet decode DEX pairs, router swaps, LP tokens, bridge
continuations, or exchange labels, so it returns an empty ledger and records
those capabilities as gaps.

## Loss claims

Reported losses are persisted as `Investigator-provided loss claim`. A claim is
not promoted to supported evidence solely because an amount, statement, or
document was supplied. Transaction-time valuation and purchase/sale evidence
are required before calculating realized or unrealized loss.

## SATX acceptance status

SATX acceptance is **not executed**. It requires the exact token contract,
chain, working production provider data, an authenticated case run, and manual
inspection. No acceptance item may be marked passed before those conditions are
met.
