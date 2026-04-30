export default [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "EnforcedPause",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ExpectedPause",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ReentrancyGuardReentrantCall",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum AITradingAccessControl.PermissionLevel",
				"name": "level",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxTradesPerHour",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxTradeAmount",
				"type": "uint256"
			}
		],
		"name": "BotAuthorized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum AITradingAccessControl.PermissionLevel",
				"name": "level",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxTradesPerHour",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxTradeAmount",
				"type": "uint256"
			}
		],
		"name": "BotPermissionsUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			}
		],
		"name": "BotRevoked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "executor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "allowed",
				"type": "bool"
			}
		],
		"name": "ExecutorUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			}
		],
		"name": "RateLimitReset",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "maxTradesPerHour",
				"type": "uint256"
			}
		],
		"name": "RateLimitUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalTradesExecuted",
				"type": "uint256"
			}
		],
		"name": "TradeExecuted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tradeId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalTradesExecuted",
				"type": "uint256"
			}
		],
		"name": "TradeRecorded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "DEFAULT_MAX_TRADES_PER_HOUR",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "HOUR",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			},
			{
				"internalType": "enum AITradingAccessControl.PermissionLevel",
				"name": "_level",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "_maxTradesPerHour",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_maxTradeAmount",
				"type": "uint256"
			}
		],
		"name": "authorizeBot",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "authorizedBots",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorizedExecutors",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "botPermissions",
		"outputs": [
			{
				"internalType": "address",
				"name": "botAddress",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isAuthorized",
				"type": "bool"
			},
			{
				"internalType": "enum AITradingAccessControl.PermissionLevel",
				"name": "level",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "maxTradesPerHour",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "tradesThisHour",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastResetTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxTradeAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalTradesExecuted",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tradeAmount",
				"type": "uint256"
			}
		],
		"name": "canExecuteTrade",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_bot",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tradeAmount",
				"type": "uint256"
			}
		],
		"name": "canExecuteTradeFromExecutor",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tradeAmount",
				"type": "uint256"
			}
		],
		"name": "canExecuteTradeView",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_bot",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tradeAmount",
				"type": "uint256"
			}
		],
		"name": "checkCanExecuteTradeFromExecutor",
		"outputs": [
			{
				"internalType": "bool",
				"name": "ok",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "reason",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAuthorizedBots",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			}
		],
		"name": "getBotPermissions",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "botAddress",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isAuthorized",
						"type": "bool"
					},
					{
						"internalType": "enum AITradingAccessControl.PermissionLevel",
						"name": "level",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "maxTradesPerHour",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "tradesThisHour",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "lastResetTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "maxTradeAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalTradesExecuted",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "isActive",
						"type": "bool"
					}
				],
				"internalType": "struct AITradingAccessControl.BotPermissions",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			}
		],
		"name": "getRateLimitStatus",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalAuthorizedBots",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			}
		],
		"name": "isAuthorizedBot",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_bot",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tradeAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_tradeId",
				"type": "uint256"
			}
		],
		"name": "recordTradeExecutionFromExecutor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			}
		],
		"name": "resetRateLimit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			}
		],
		"name": "revokeBot",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_executor",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "_allowed",
				"type": "bool"
			}
		],
		"name": "setExecutor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalAuthorizedBots",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			},
			{
				"internalType": "enum AITradingAccessControl.PermissionLevel",
				"name": "_level",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "_maxTradesPerHour",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_maxTradeAmount",
				"type": "uint256"
			}
		],
		"name": "updateBotPermissions",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_botAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_maxTradesPerHour",
				"type": "uint256"
			}
		],
		"name": "updateRateLimit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
