
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract LandVerification is AccessControl, Pausable {
    bytes32 public constant REGISTRAR_ROLE =
        keccak256("REGISTRAR_ROLE");

    struct Property {
        string propertyId;
        string titleNumber;
        address currentOwner;
        string location;
        string propertyType;
        uint256 landArea;
        bytes32 documentHash;
        string ipfsCID;
        uint256 registeredAt;
        bool exists;
        bool active;
    }

    struct TransferRequest {
        address requestedNewOwner;
        uint256 requestedAt;
        bool pending;
    }

    mapping(bytes32 => Property) private properties;
    mapping(bytes32 => address[]) private ownershipHistory;
    mapping(bytes32 => TransferRequest) private transferRequests;

    event PropertyRegistered(
        bytes32 indexed propertyKey,
        string propertyId,
        string titleNumber,
        address indexed owner,
        bytes32 documentHash,
        string ipfsCID,
        uint256 registeredAt
    );

    event OwnershipTransferRequested(
        bytes32 indexed propertyKey,
        address indexed currentOwner,
        address indexed requestedNewOwner,
        uint256 requestedAt
    );

    event OwnershipTransferred(
        bytes32 indexed propertyKey,
        address indexed previousOwner,
        address indexed newOwner,
        address registrar,
        uint256 transferredAt
    );

    event OwnershipTransferRejected(
        bytes32 indexed propertyKey,
        address indexed requestedNewOwner,
        address indexed registrar,
        string reason,
        uint256 rejectedAt
    );

    event PropertyRevoked(
        bytes32 indexed propertyKey,
        address indexed registrar,
        string reason,
        uint256 revokedAt
    );

    event RegistrarAdded(address indexed account, address indexed admin);
    event RegistrarRemoved(address indexed account, address indexed admin);

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(REGISTRAR_ROLE, initialAdmin);
    }

    function addRegistrar(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(account != address(0), "Invalid registrar address");

        _grantRole(REGISTRAR_ROLE, account);
        emit RegistrarAdded(account, msg.sender);
    }

    function removeRegistrar(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _revokeRole(REGISTRAR_ROLE, account);
        emit RegistrarRemoved(account, msg.sender);
    }

    function registerProperty(
        string calldata propertyId,
        string calldata titleNumber,
        address initialOwner,
        string calldata location,
        string calldata propertyType,
        uint256 landArea,
        bytes32 documentHash,
        string calldata ipfsCID
    )
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
    {
        require(bytes(propertyId).length > 0, "Property ID required");
        require(bytes(titleNumber).length > 0, "Title number required");
        require(initialOwner != address(0), "Invalid owner address");
        require(bytes(location).length > 0, "Location required");
        require(bytes(propertyType).length > 0, "Property type required");
        require(landArea > 0, "Land area must be positive");
        require(documentHash != bytes32(0), "Document hash required");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");

        bytes32 propertyKey = keccak256(bytes(propertyId));

        require(!properties[propertyKey].exists, "Property ID already exists");

        properties[propertyKey] = Property({
            propertyId: propertyId,
            titleNumber: titleNumber,
            currentOwner: initialOwner,
            location: location,
            propertyType: propertyType,
            landArea: landArea,
            documentHash: documentHash,
            ipfsCID: ipfsCID,
            registeredAt: block.timestamp,
            exists: true,
            active: true
        });

        ownershipHistory[propertyKey].push(initialOwner);

        emit PropertyRegistered(
            propertyKey,
            propertyId,
            titleNumber,
            initialOwner,
            documentHash,
            ipfsCID,
            block.timestamp
        );
    }

    function verifyProperty(string calldata propertyId)
        external
        view
        returns (Property memory)
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        require(properties[propertyKey].exists, "Property not found");

        return properties[propertyKey];
    }

    function getOwnershipHistory(string calldata propertyId)
        external
        view
        returns (address[] memory)
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        require(properties[propertyKey].exists, "Property not found");

        return ownershipHistory[propertyKey];
    }

    function getTransferRequest(string calldata propertyId)
        external
        view
        returns (TransferRequest memory)
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        require(properties[propertyKey].exists, "Property not found");

        return transferRequests[propertyKey];
    }

    function requestOwnershipTransfer(
        string calldata propertyId,
        address newOwner
    )
        external
        whenNotPaused
    {
        require(newOwner != address(0), "Invalid new owner address");

        bytes32 propertyKey = keccak256(bytes(propertyId));
        Property storage property = properties[propertyKey];

        require(property.exists, "Property not found");
        require(property.active, "Property is revoked");
        require(
            msg.sender == property.currentOwner,
            "Not current owner"
        );
        require(
            newOwner != property.currentOwner,
            "Already the owner"
        );
        require(
            !transferRequests[propertyKey].pending,
            "Transfer request already pending"
        );

        transferRequests[propertyKey] = TransferRequest({
            requestedNewOwner: newOwner,
            requestedAt: block.timestamp,
            pending: true
        });

        emit OwnershipTransferRequested(
            propertyKey,
            property.currentOwner,
            newOwner,
            block.timestamp
        );
    }

    function approveOwnershipTransfer(string calldata propertyId)
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        Property storage property = properties[propertyKey];
        TransferRequest memory request = transferRequests[propertyKey];

        require(property.exists, "Property not found");
        require(property.active, "Property is revoked");
        require(request.pending, "No pending transfer");

        address previousOwner = property.currentOwner;
        address newOwner = request.requestedNewOwner;

        property.currentOwner = newOwner;
        ownershipHistory[propertyKey].push(newOwner);
        delete transferRequests[propertyKey];

        emit OwnershipTransferred(
            propertyKey,
            previousOwner,
            newOwner,
            msg.sender,
            block.timestamp
        );
    }

    function rejectOwnershipTransfer(
        string calldata propertyId,
        string calldata reason
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        Property storage property = properties[propertyKey];
        TransferRequest memory request = transferRequests[propertyKey];

        require(property.exists, "Property not found");
        require(request.pending, "No pending transfer");
        require(bytes(reason).length > 0, "Rejection reason required");

        delete transferRequests[propertyKey];

        emit OwnershipTransferRejected(
            propertyKey,
            request.requestedNewOwner,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    function revokeProperty(
        string calldata propertyId,
        string calldata reason
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        bytes32 propertyKey = keccak256(bytes(propertyId));
        Property storage property = properties[propertyKey];

        require(property.exists, "Property not found");
        require(property.active, "Property already revoked");
        require(bytes(reason).length > 0, "Revocation reason required");

        TransferRequest memory request = transferRequests[propertyKey];

        if (request.pending) {
            delete transferRequests[propertyKey];

            emit OwnershipTransferRejected(
                propertyKey,
                request.requestedNewOwner,
                msg.sender,
                "Property revoked",
                block.timestamp
            );
        }

        property.active = false;

        emit PropertyRevoked(
            propertyKey,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    function pause()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _pause();
    }

    function unpause()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _unpause();
    }
}
