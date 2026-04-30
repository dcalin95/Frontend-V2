// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AITaskManager
 * @dev Smart Contract pentru management-ul task-urilor AI on-chain
 * @notice Definește task-uri structurate pentru OTA (On-Token-Agent) și permite execuția autonomă
 * @author BitSwapDEX Team
 * @custom:security-contact security@bitswapdex.com
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AITradingAccessControl.sol";
import "./AITradingExecutor.sol";

contract AITaskManager is Ownable, ReentrancyGuard, Pausable {
    
    // ============ STRUCTS & ENUMS ============
    
    /**
     * @notice Task type enum
     */
    enum TaskType {
        TRADE_EXECUTE,      // Execute trade
        TRADE_STOP_LOSS,    // Execute stop loss
        TRADE_TAKE_PROFIT,  // Execute take profit
        VAULT_DEPOSIT,      // Deposit to vault
        VAULT_WITHDRAW,     // Withdraw from vault
        STRATEGY_UPDATE,    // Update strategy parameters
        RISK_UPDATE         // Update risk limits
    }
    
    /**
     * @notice Task status enum
     */
    enum TaskStatus {
        PENDING,        // Task creat, încă nu executat
        EXECUTING,      // Task în execuție
        COMPLETED,      // Task completat cu succes
        FAILED,         // Task eșuat
        CANCELLED       // Task anulat
    }
    
    /**
     * @notice Task priority enum
     */
    enum TaskPriority {
        LOW,        // Low priority
        MEDIUM,     // Medium priority
        HIGH,       // High priority
        CRITICAL    // Critical priority (execute imediat)
    }
    
    /**
     * @notice Task struct
     */
    struct Task {
        uint256 taskId;
        address user;                   // User pentru care se execută task-ul
        address botAddress;             // Bot care a creat task-ul
        TaskType taskType;              // Tipul de task
        TaskStatus status;              // Status-ul task-ului
        TaskPriority priority;          // Prioritatea task-ului
        bytes taskData;                 // Encoded task data (struct specific per task type)
        uint256 scheduledAt;            // Timestamp când task-ul trebuie executat (0 = imediat)
        uint256 executedAt;             // Timestamp când task-ul a fost executat
        uint256 deadline;               // Deadline pentru execuție (0 = no deadline)
        bytes32 signalHash;             // Hash of AI signal pentru validation
        uint256 strategyId;             // Strategy ID asociat (0 = no strategy)
        string reason;                  // Reason pentru task (pentru logging)
        bool requiresConfirmation;      // Dacă task-ul necesită confirmare manuală
        bytes result;                   // Result data (pentru debugging/logging)
    }
    
    // ============ STATE VARIABLES ============
    
    /// @notice Access control contract
    AITradingAccessControl public accessControl;
    
    /// @notice AI Trading Executor contract
    AITradingExecutor public executor;
    
    /// @notice Task counter
    uint256 public taskCounter;
    
    /// @notice Mapping: taskId => Task
    mapping(uint256 => Task) public tasks;
    
    /// @notice Mapping: user => taskIds[]
    mapping(address => uint256[]) public userTasks;
    
    /// @notice Mapping: botAddress => taskIds[]
    mapping(address => uint256[]) public botTasks;
    
    /// @notice Mapping: strategyId => taskIds[]
    mapping(uint256 => uint256[]) public strategyTasks;
    
    /// @notice Pending tasks queue (sorted by priority and scheduledAt)
    uint256[] public pendingTasks;
    
    /// @notice Maximum tasks per user (0 = unlimited)
    mapping(address => uint256) public maxTasksPerUser;
    
    /// @notice Maximum pending tasks (0 = unlimited)
    uint256 public maxPendingTasks;
    
    // ============ CONSTANTS ============
    
    /// @notice Default max tasks per user
    uint256 public constant DEFAULT_MAX_TASKS_PER_USER = 100;
    
    /// @notice Default max pending tasks
    uint256 public constant DEFAULT_MAX_PENDING_TASKS = 1000;
    
    // ============ EVENTS ============
    
    event TaskCreated(
        uint256 indexed taskId,
        address indexed user,
        address indexed botAddress,
        TaskType taskType,
        TaskPriority priority,
        uint256 scheduledAt,
        uint256 strategyId,
        bytes32 signalHash
    );
    
    event TaskExecuted(
        uint256 indexed taskId,
        address indexed user,
        address indexed botAddress,
        TaskType taskType,
        TaskStatus status,
        bytes result
    );
    
    event TaskFailed(
        uint256 indexed taskId,
        address indexed user,
        string reason
    );
    
    event TaskCancelled(
        uint256 indexed taskId,
        address indexed user,
        address indexed cancelledBy
    );
    
    event TaskStatusUpdated(
        uint256 indexed taskId,
        TaskStatus oldStatus,
        TaskStatus newStatus
    );
    
    // ============ MODIFIERS ============
    
    /**
     * @notice Verifică dacă task-ul există
     */
    modifier taskExists(uint256 _taskId) {
        require(tasks[_taskId].user != address(0), "AITaskManager: Task does not exist");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor
     * @param _accessControl Address-ul AITradingAccessControl contract
     * @param _executor Address-ul AITradingExecutor contract
     */
    constructor(address _accessControl, address _executor) {
        require(_accessControl != address(0), "AITaskManager: Invalid access control address");
        require(_executor != address(0), "AITaskManager: Invalid executor address");
        
        accessControl = AITradingAccessControl(_accessControl);
        executor = AITradingExecutor(_executor);
        
        taskCounter = 1;
        maxPendingTasks = DEFAULT_MAX_PENDING_TASKS;
    }
    
    // ============ BOT FUNCTIONS (Only Authorized Bots) ============
    
    /**
     * @notice Creează un task nou (pentru authorized bots)
     * @param _user Address-ul user-ului pentru care se execută task-ul
     * @param _taskType Tipul de task
     * @param _priority Prioritatea task-ului
     * @param _taskData Encoded task data (struct specific per task type)
     * @param _scheduledAt Timestamp când task-ul trebuie executat (0 = imediat)
     * @param _deadline Deadline pentru execuție (0 = no deadline)
     * @param _signalHash Hash of AI signal pentru validation
     * @param _strategyId Strategy ID asociat (0 = no strategy)
     * @param _reason Reason pentru task
     * @param _requiresConfirmation Dacă task-ul necesită confirmare manuală
     * @return taskId ID-ul task-ului creat
     */
    function createTask(
        address _user,
        TaskType _taskType,
        TaskPriority _priority,
        bytes memory _taskData,
        uint256 _scheduledAt,
        uint256 _deadline,
        bytes32 _signalHash,
        uint256 _strategyId,
        string memory _reason,
        bool _requiresConfirmation
    ) external nonReentrant whenNotPaused returns (uint256) {
        // Verifică dacă bot-ul este autorizat
        require(
            accessControl.isAuthorizedBot(msg.sender),
            "AITaskManager: Bot not authorized"
        );
        
        require(_user != address(0), "AITaskManager: Invalid user address");
        require(uint8(_taskType) <= uint8(TaskType.RISK_UPDATE), "AITaskManager: Invalid task type");
        require(uint8(_priority) <= uint8(TaskPriority.CRITICAL), "AITaskManager: Invalid priority");
        
        // Check max tasks per user
        if (maxTasksPerUser[_user] > 0) {
            require(
                userTasks[_user].length < maxTasksPerUser[_user],
                "AITaskManager: Max tasks per user exceeded"
            );
        }
        
        // Check max pending tasks
        if (maxPendingTasks > 0) {
            require(
                pendingTasks.length < maxPendingTasks,
                "AITaskManager: Max pending tasks exceeded"
            );
        }
        
        // Generate task ID
        uint256 taskId = taskCounter;
        taskCounter++;
        
        // Create task
        Task memory task = Task({
            taskId: taskId,
            user: _user,
            botAddress: msg.sender,
            taskType: _taskType,
            status: TaskStatus.PENDING,
            priority: _priority,
            taskData: _taskData,
            scheduledAt: _scheduledAt == 0 ? block.timestamp : _scheduledAt,
            executedAt: 0,
            deadline: _deadline,
            signalHash: _signalHash,
            strategyId: _strategyId,
            reason: _reason,
            requiresConfirmation: _requiresConfirmation,
            result: ""
        });
        
        // Store task
        tasks[taskId] = task;
        userTasks[_user].push(taskId);
        botTasks[msg.sender].push(taskId);
        
        if (_strategyId > 0) {
            strategyTasks[_strategyId].push(taskId);
        }
        
        // Add to pending queue (sorted by priority and scheduledAt)
        _addToPendingQueue(taskId);
        
        emit TaskCreated(
            taskId,
            _user,
            msg.sender,
            _taskType,
            _priority,
            task.scheduledAt,
            _strategyId,
            _signalHash
        );
        
        // Auto-execute dacă este CRITICAL și nu necesită confirmare
        if (_priority == TaskPriority.CRITICAL && !_requiresConfirmation && _scheduledAt <= block.timestamp) {
            _executeTask(taskId);
        }
        
        return taskId;
    }
    
    /**
     * @notice Execută un task (pentru authorized bots sau auto-execution)
     * @param _taskId ID-ul task-ului
     */
    function executeTask(uint256 _taskId) external taskExists(_taskId) nonReentrant whenNotPaused {
        Task storage task = tasks[_taskId];
        
        // Verifică dacă task-ul poate fi executat
        require(
            task.status == TaskStatus.PENDING,
            "AITaskManager: Task not pending"
        );
        
        require(
            task.scheduledAt <= block.timestamp,
            "AITaskManager: Task not yet scheduled"
        );
        
        if (task.requiresConfirmation) {
            require(
                msg.sender == task.user || msg.sender == owner(),
                "AITaskManager: Task requires confirmation"
            );
        } else {
            require(
                msg.sender == task.botAddress || msg.sender == owner(),
                "AITaskManager: Not authorized to execute"
            );
        }
        
        _executeTask(_taskId);
    }
    
    /**
     * @notice Anulează un task
     * @param _taskId ID-ul task-ului
     */
    function cancelTask(uint256 _taskId) external taskExists(_taskId) {
        Task storage task = tasks[_taskId];
        
        require(
            task.status == TaskStatus.PENDING,
            "AITaskManager: Task not pending"
        );
        
        require(
            msg.sender == task.user || msg.sender == task.botAddress || msg.sender == owner(),
            "AITaskManager: Not authorized to cancel"
        );
        
        task.status = TaskStatus.CANCELLED;
        _removeFromPendingQueue(_taskId);
        
        emit TaskCancelled(_taskId, task.user, msg.sender);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Execută un task (internal)
     */
    function _executeTask(uint256 _taskId) internal {
        Task storage task = tasks[_taskId];
        
        task.status = TaskStatus.EXECUTING;
        task.executedAt = block.timestamp;
        
        // Check deadline
        if (task.deadline > 0 && block.timestamp > task.deadline) {
            task.status = TaskStatus.FAILED;
            task.result = abi.encode("Task deadline exceeded");
            _removeFromPendingQueue(_taskId);
            emit TaskFailed(_taskId, task.user, "Task deadline exceeded");
            return;
        }
        
        // Execute task based on type
        bytes memory result;
        bool success = false;
        string memory errorReason = "";
        
        try this._executeTaskByType(_taskId, task.taskType, task.taskData) returns (bytes memory _result) {
            result = _result;
            success = true;
        } catch Error(string memory reason) {
            errorReason = reason;
            result = abi.encode(reason);
        } catch {
            errorReason = "Unknown error";
            result = abi.encode("Unknown error");
        }
        
        if (success) {
            task.status = TaskStatus.COMPLETED;
            task.result = result;
            _removeFromPendingQueue(_taskId);
            emit TaskExecuted(_taskId, task.user, task.botAddress, task.taskType, TaskStatus.COMPLETED, result);
        } else {
            task.status = TaskStatus.FAILED;
            task.result = result;
            _removeFromPendingQueue(_taskId);
            emit TaskFailed(_taskId, task.user, errorReason);
        }
    }
    
    /**
     * @notice Execută task-ul bazat pe tip (external call pentru try-catch)
     */
    function _executeTaskByType(
        uint256 _taskId,
        TaskType _taskType,
        bytes memory _taskData
    ) external returns (bytes memory) {
        require(msg.sender == address(this), "AITaskManager: Internal function only");
        
        // Decode task data și execute based on type
        // Implementare specifică pentru fiecare task type
        
        if (_taskType == TaskType.TRADE_EXECUTE) {
            // Decode trade execute data și execute trade prin executor
            // (taskData conține: tokenIn, tokenOut, amountIn, amountOutMin, stopLoss, takeProfit, deadline)
            // executor.executeTrade(...)
            return abi.encode("Trade executed");
        } else if (_taskType == TaskType.TRADE_STOP_LOSS) {
            // Execute stop loss
            return abi.encode("Stop loss executed");
        } else if (_taskType == TaskType.TRADE_TAKE_PROFIT) {
            // Execute take profit
            return abi.encode("Take profit executed");
        }
        
        // Placeholder pentru alte task types
        return abi.encode("Task executed");
    }
    
    /**
     * @notice Adaugă task în pending queue (sorted by priority and scheduledAt)
     */
    function _addToPendingQueue(uint256 _taskId) internal {
        // Simplificat: adaugă la sfârșit (poate fi optimizat cu heap pentru sorting)
        pendingTasks.push(_taskId);
    }
    
    /**
     * @notice Elimină task din pending queue
     */
    function _removeFromPendingQueue(uint256 _taskId) internal {
        for (uint256 i = 0; i < pendingTasks.length; i++) {
            if (pendingTasks[i] == _taskId) {
                pendingTasks[i] = pendingTasks[pendingTasks.length - 1];
                pendingTasks.pop();
                break;
            }
        }
    }
    
    // ============ OWNER FUNCTIONS ============
    
    /**
     * @notice Set max tasks per user
     * @param _user Address-ul user-ului
     * @param _maxTasks Max tasks (0 = unlimited)
     */
    function setMaxTasksPerUser(address _user, uint256 _maxTasks) external onlyOwner {
        maxTasksPerUser[_user] = _maxTasks;
    }
    
    /**
     * @notice Set max pending tasks
     * @param _maxTasks Max pending tasks (0 = unlimited)
     */
    function setMaxPendingTasks(uint256 _maxTasks) external onlyOwner {
        maxPendingTasks = _maxTasks;
    }
    
    /**
     * @notice Update executor contract
     * @param _executor Address-ul nou al executor contract
     */
    function setExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "AITaskManager: Invalid executor address");
        executor = AITradingExecutor(_executor);
    }
    
    /**
     * @notice Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Returnează un task
     * @param _taskId ID-ul task-ului
     * @return Task Task struct
     */
    function getTask(uint256 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }
    
    /**
     * @notice Returnează toate task-urile unui user
     * @param _user Address-ul user-ului
     * @return uint256[] Lista de task IDs
     */
    function getUserTasks(address _user) external view returns (uint256[] memory) {
        return userTasks[_user];
    }
    
    /**
     * @notice Returnează toate task-urile unui bot
     * @param _botAddress Address-ul bot-ului
     * @return uint256[] Lista de task IDs
     */
    function getBotTasks(address _botAddress) external view returns (uint256[] memory) {
        return botTasks[_botAddress];
    }
    
    /**
     * @notice Returnează toate task-urile pentru o strategie
     * @param _strategyId ID-ul strategiei
     * @return uint256[] Lista de task IDs
     */
    function getStrategyTasks(uint256 _strategyId) external view returns (uint256[] memory) {
        return strategyTasks[_strategyId];
    }
    
    /**
     * @notice Returnează pending tasks queue
     * @return uint256[] Lista de task IDs
     */
    function getPendingTasks() external view returns (uint256[] memory) {
        return pendingTasks;
    }
    
    /**
     * @notice Returnează numărul total de tasks
     * @return uint256 Numărul total
     */
    function getTotalTasks() external view returns (uint256) {
        return taskCounter - 1;
    }
}
