// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;  // QSP-13: Lock Solidity version

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";  // QSP-9: Add emergency pause
import "../interfaces/IStreamPayment.sol";

/**
 * @title StreamPayment
 * @dev Protocol Bank streaming payment implementation
 * @notice Enables continuous token streaming from sender to recipient over time
 * @notice Uses high-precision arithmetic to prevent rounding errors
 * @author EverestAn
 */
contract StreamPayment is IStreamPayment, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // QSP-1: Precision factor for rate calculations (prevents rounding errors)
    uint256 private constant PRECISION = 1e18;

    // Stream counter for generating unique IDs
    uint256 private _streamIdCounter;

    // Mapping from stream ID to Stream struct
    mapping(uint256 => Stream) private _streams;

    // Mapping from sender address to their stream IDs
    mapping(address => uint256[]) private _streamsBySender;

    // Mapping from recipient address to their stream IDs
    mapping(address => uint256[]) private _streamsByRecipient;

    // Platform fee in basis points (e.g., 50 = 0.5%)
    uint256 public platformFeeBps = 0;

    // Platform fee recipient
    address public feeRecipient;

    // QSP-8: Minimum stream duration increased to 1 hour (prevents spam and precision loss)
    uint256 public constant MIN_DURATION = 3600; // 1 hour

    // QSP-7: Maximum stream name length (prevents gas griefing)
    uint256 public constant MAX_NAME_LENGTH = 100;

    /**
     * @dev Constructor sets the initial fee recipient to the contract deployer
     */
    constructor() Ownable(msg.sender) Pausable() {
        feeRecipient = msg.sender;
    }

    /**
     * @dev Create a new streaming payment
     * @param recipient The address that will receive the stream
     * @param token The ERC20 token address to be streamed
     * @param totalAmount The total amount of tokens to be streamed
     * @param duration The duration of the stream in seconds
     * @param streamName A human-readable name for the stream
     * @return streamId The unique identifier of the created stream
     * @notice Requires approval for the contract to transfer tokens
     * @notice Uses high-precision arithmetic to prevent rounding errors
     */
    function createStream(
        address recipient,
        address token,
        uint256 totalAmount,
        uint256 duration,
        string calldata streamName  // QSP-12: Use calldata instead of memory
    ) external override nonReentrant whenNotPaused returns (uint256 streamId) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot stream to self");
        require(token != address(0), "Invalid token");
        require(totalAmount > 0, "Amount must be positive");
        require(duration >= MIN_DURATION, "Duration too short");
        require(bytes(streamName).length <= MAX_NAME_LENGTH, "Stream name too long");  // QSP-7

        // QSP-1: Use high-precision calculation to prevent rounding errors
        uint256 ratePerSecond = (totalAmount * PRECISION) / duration;
        require(ratePerSecond > 0, "Rate too low");

        // Transfer tokens from sender to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);

        // QSP-12: Use unchecked for counter increment (safe from overflow)
        unchecked {
            streamId = _streamIdCounter++;
        }

        // Create stream
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        _streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            totalAmount: totalAmount,
            amountStreamed: 0,
            amountWithdrawn: 0,
            ratePerSecond: ratePerSecond,
            startTime: startTime,
            endTime: endTime,
            lastWithdrawTime: startTime,
            pauseTime: 0,  // QSP-2: Add pauseTime field
            status: StreamStatus.ACTIVE,
            streamName: streamName
        });

        // Add to sender and recipient mappings
        _streamsBySender[msg.sender].push(streamId);
        _streamsByRecipient[recipient].push(streamId);

        emit StreamCreated(
            streamId,
            msg.sender,
            recipient,
            token,
            totalAmount,
            ratePerSecond,
            startTime,
            endTime,
            streamName
        );

        return streamId;
    }

    /**
     * @dev Withdraw available funds from a stream
     * @param streamId The unique identifier of the stream
     * @notice Only the recipient can withdraw funds
     * @notice Platform fees are deducted if configured
     */
    function withdrawFromStream(uint256 streamId) external override nonReentrant whenNotPaused {
        Stream storage stream = _streams[streamId];
        require(stream.sender != address(0), "Stream does not exist");
        require(msg.sender == stream.recipient, "Only recipient can withdraw");
        require(
            stream.status == StreamStatus.ACTIVE || stream.status == StreamStatus.COMPLETED,
            "Stream not active"
        );

        uint256 availableBalance = _calculateAvailableBalance(stream);
        require(availableBalance > 0, "No funds available");

        // QSP-3: Implement platform fee logic
        uint256 platformFee = (availableBalance * platformFeeBps) / 10000;
        uint256 recipientAmount = availableBalance - platformFee;

        // Update stream state
        stream.amountWithdrawn += availableBalance;
        stream.lastWithdrawTime = block.timestamp;

        // Check if stream is completed
        if (block.timestamp >= stream.endTime && stream.amountWithdrawn >= stream.totalAmount) {
            stream.status = StreamStatus.COMPLETED;
            emit StreamCompleted(streamId, block.timestamp);
        }

        // QSP-12: Cache token address to save gas
        address tokenAddress = stream.token;

        // Transfer platform fee if applicable
        if (platformFee > 0) {
            IERC20(tokenAddress).safeTransfer(feeRecipient, platformFee);
        }

        // Transfer tokens to recipient
        IERC20(tokenAddress).safeTransfer(stream.recipient, recipientAmount);

        emit StreamWithdrawn(streamId, stream.recipient, recipientAmount, block.timestamp);
    }

    /**
     * @dev Pause an active stream
     * @param streamId The unique identifier of the stream
     * @notice Only the sender can pause their stream
     * @notice Records the pause timestamp for accurate resume calculation
     */
    function pauseStream(uint256 streamId) external override {
        Stream storage stream = _streams[streamId];
        require(stream.sender != address(0), "Stream does not exist");
        require(msg.sender == stream.sender, "Only sender can pause");
        require(stream.status == StreamStatus.ACTIVE, "Stream not active");

        // Update streamed amount before pausing
        uint256 streamedSoFar = _calculateStreamedAmount(stream);
        stream.amountStreamed = streamedSoFar;
        stream.pauseTime = block.timestamp;  // QSP-2: Record pause time
        stream.status = StreamStatus.PAUSED;

        emit StreamPaused(streamId, block.timestamp);
    }

    /**
     * @dev Resume a paused stream
     * @param streamId The unique identifier of the stream
     * @notice Only the sender can resume their stream
     * @notice Extends the end time by the paused duration
     */
    function resumeStream(uint256 streamId) external override {
        Stream storage stream = _streams[streamId];
        require(stream.sender != address(0), "Stream does not exist");
        require(msg.sender == stream.sender, "Only sender can resume");
        require(stream.status == StreamStatus.PAUSED, "Stream not paused");

        // QSP-2: Use pauseTime to calculate paused duration accurately
        uint256 pausedDuration = block.timestamp - stream.pauseTime;
        stream.endTime += pausedDuration;
        stream.status = StreamStatus.ACTIVE;

        emit StreamResumed(streamId, block.timestamp);
    }

    /**
     * @dev Cancel a stream and refund remaining balance
     * @param streamId The unique identifier of the stream
     * @notice Can be called by sender or recipient
     * @notice QSP-5: Only allows cancellation when stream is ACTIVE
     */
    function cancelStream(uint256 streamId) external override nonReentrant {
        Stream storage stream = _streams[streamId];
        require(stream.sender != address(0), "Stream does not exist");
        require(msg.sender == stream.sender || msg.sender == stream.recipient, "Not authorized");
        
        // QSP-5: Only allow cancellation when stream is active (prevents ambiguity)
        require(stream.status == StreamStatus.ACTIVE, "Stream must be active to cancel");

        // Calculate amounts
        uint256 streamedAmount = _calculateStreamedAmount(stream);
        uint256 recipientAmount = streamedAmount - stream.amountWithdrawn;
        uint256 refundAmount = stream.totalAmount - streamedAmount;

        // Update stream state
        stream.status = StreamStatus.CANCELLED;
        stream.amountStreamed = streamedAmount;

        // QSP-12: Cache addresses to save gas
        address tokenAddress = stream.token;
        address recipientAddress = stream.recipient;
        address senderAddress = stream.sender;

        // Transfer remaining funds to recipient if any
        if (recipientAmount > 0) {
            IERC20(tokenAddress).safeTransfer(recipientAddress, recipientAmount);
            stream.amountWithdrawn += recipientAmount;
        }

        // Refund unstreamed amount to sender
        if (refundAmount > 0) {
            IERC20(tokenAddress).safeTransfer(senderAddress, refundAmount);
        }

        emit StreamCancelled(streamId, refundAmount, block.timestamp);
    }

    /**
     * @dev Get stream information
     * @param streamId The unique identifier of the stream
     * @return Stream struct with all stream details
     */
    function getStream(uint256 streamId) external view override returns (Stream memory) {
        require(_streams[streamId].sender != address(0), "Stream does not exist");
        return _streams[streamId];
    }

    /**
     * @dev Calculate available balance for withdrawal
     * @param streamId The unique identifier of the stream
     * @return Available amount that can be withdrawn
     */
    function balanceOf(uint256 streamId) external view override returns (uint256) {
        Stream storage stream = _streams[streamId];
        require(stream.sender != address(0), "Stream does not exist");
        return _calculateAvailableBalance(stream);
    }

    /**
     * @dev Get all stream IDs for a sender
     * @param sender Address of the sender
     * @return Array of stream IDs
     */
    function getStreamsBySender(address sender) external view override returns (uint256[] memory) {
        return _streamsBySender[sender];
    }

    /**
     * @dev Get all stream IDs for a recipient
     * @param recipient Address of the recipient
     * @return Array of stream IDs
     */
    function getStreamsByRecipient(address recipient) external view override returns (uint256[] memory) {
        return _streamsByRecipient[recipient];
    }

    /**
     * @dev Calculate total streamed amount up to current time
     * @param stream The stream to calculate for
     * @return The total streamed amount
     * @notice Uses high-precision arithmetic to prevent rounding errors
     */
    function _calculateStreamedAmount(Stream storage stream) private view returns (uint256) {
        if (stream.status == StreamStatus.PAUSED) {
            return stream.amountStreamed;
        }

        if (block.timestamp >= stream.endTime) {
            return stream.totalAmount;
        }

        uint256 elapsedTime = block.timestamp - stream.startTime;
        
        // QSP-1: Use high-precision calculation
        uint256 streamedAmount = (elapsedTime * stream.ratePerSecond) / PRECISION;

        return streamedAmount > stream.totalAmount ? stream.totalAmount : streamedAmount;
    }

    /**
     * @dev Calculate available balance for withdrawal
     * @param stream The stream to calculate for
     * @return The available balance
     */
    function _calculateAvailableBalance(Stream storage stream) private view returns (uint256) {
        uint256 streamedAmount = _calculateStreamedAmount(stream);
        return streamedAmount - stream.amountWithdrawn;
    }

    /**
     * @dev Set platform fee (only owner)
     * @param feeBps Fee in basis points (e.g., 50 = 0.5%)
     * @notice Maximum fee is 10% (1000 basis points)
     */
    function setPlatformFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = feeBps;
    }

    /**
     * @dev Set fee recipient (only owner)
     * @param newRecipient Address of the new fee recipient
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Get total number of streams created
     * @return Total number of streams
     */
    function getTotalStreams() external view returns (uint256) {
        return _streamIdCounter;
    }

    /**
     * @dev Struct to hold parameters for batch stream creation
     */
    struct StreamParams {
        address recipient;
        address token;
        uint256 totalAmount;
        uint256 duration;
        string streamName;
    }

    /**
     * @dev Create multiple streaming payments in a single transaction
     * @param params Array of StreamParams containing parameters for each stream
     * @return streamIds Array of unique identifiers for the created streams
     * @notice Requires approval for the contract to transfer all tokens
     * @notice Saves gas by batching multiple stream creations
     * @notice If any stream creation fails, the entire transaction reverts
     */
    function createStreamBatch(
        StreamParams[] calldata params
    ) external nonReentrant whenNotPaused returns (uint256[] memory streamIds) {
        require(params.length > 0, "Empty batch");
        require(params.length <= 100, "Batch too large");
        
        streamIds = new uint256[](params.length);
        
        for (uint256 i = 0; i < params.length; ) {
            StreamParams calldata param = params[i];
            
            // Validate parameters
            require(param.recipient != address(0), "Invalid recipient");
            require(param.recipient != msg.sender, "Cannot stream to self");
            require(param.token != address(0), "Invalid token");
            require(param.totalAmount > 0, "Amount must be positive");
            require(param.duration >= MIN_DURATION, "Duration too short");
            require(bytes(param.streamName).length <= MAX_NAME_LENGTH, "Stream name too long");
            
            // Calculate rate
            uint256 ratePerSecond = (param.totalAmount * PRECISION) / param.duration;
            require(ratePerSecond > 0, "Rate too low");
            
            // Transfer tokens
            IERC20(param.token).safeTransferFrom(msg.sender, address(this), param.totalAmount);
            
            // Create stream ID
            uint256 streamId;
            unchecked {
                streamId = _streamIdCounter++;
            }
            streamIds[i] = streamId;
            
            // Create stream
            uint256 startTime = block.timestamp;
            uint256 endTime = startTime + param.duration;
            
            _streams[streamId] = Stream({
                sender: msg.sender,
                recipient: param.recipient,
                token: param.token,
                totalAmount: param.totalAmount,
                amountStreamed: 0,
                amountWithdrawn: 0,
                ratePerSecond: ratePerSecond,
                startTime: startTime,
                endTime: endTime,
                lastWithdrawTime: startTime,
                pauseTime: 0,
                status: StreamStatus.ACTIVE,
                streamName: param.streamName
            });
            
            // Update mappings
            _streamsBySender[msg.sender].push(streamId);
            _streamsByRecipient[param.recipient].push(streamId);
            
            // Emit event
            emit StreamCreated(
                streamId,
                msg.sender,
                param.recipient,
                param.token,
                param.totalAmount,
                ratePerSecond,
                startTime,
                endTime,
                param.streamName
            );
            
            unchecked {
                ++i;
            }
        }
        
        return streamIds;
    }

    // QSP-9: Emergency pause functionality
    /**
     * @dev Pause all contract operations (only owner)
     * @notice Use in case of emergency or critical bug discovery
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause all contract operations (only owner)
     * @notice Resume normal operations after emergency is resolved
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

