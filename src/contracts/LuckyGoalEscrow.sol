// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LuckyGoalEscrow {
    struct TournamentData {
        address host;
        uint256 prize;
        bool claimed;
    }

    mapping(bytes32 => TournamentData) public tournaments;

    event TournamentCreated(string code, address indexed host, uint256 prize);
    event PrizeClaimed(string code, address indexed winner, uint256 prize);

    modifier onlyHost(string calldata code) {
        bytes32 key = keccak256(abi.encodePacked(code));
        require(tournaments[key].host == msg.sender, "Not the host");
        _;
    }

    /// @notice Host creates a tournament and deposits AVAX as the prize
    /// @param code The unique tournament code (e.g. "AB12")
    function createTournament(string calldata code) external payable {
        bytes32 key = keccak256(abi.encodePacked(code));
        require(tournaments[key].host == address(0), "Tournament already exists");
        require(msg.value > 0, "Must deposit prize");

        tournaments[key] = TournamentData({
            host: msg.sender,
            prize: msg.value,
            claimed: false
        });

        emit TournamentCreated(code, msg.sender, msg.value);
    }

    /// @notice Host sends the prize to the winner
    /// @param code The tournament code
    /// @param winner The winner's wallet address
    function claimPrize(string calldata code, address payable winner) external onlyHost(code) {
        bytes32 key = keccak256(abi.encodePacked(code));
        TournamentData storage t = tournaments[key];

        require(!t.claimed, "Already claimed");
        require(winner != address(0), "Invalid winner address");

        t.claimed = true;
        uint256 amount = t.prize;

        (bool sent, ) = winner.call{value: amount}("");
        require(sent, "Transfer failed");

        emit PrizeClaimed(code, winner, amount);
    }

    /// @notice View tournament info by code
    function getTournament(string calldata code)
        external
        view
        returns (address host, uint256 prize, bool claimed)
    {
        bytes32 key = keccak256(abi.encodePacked(code));
        TournamentData storage t = tournaments[key];
        return (t.host, t.prize, t.claimed);
    }
}
