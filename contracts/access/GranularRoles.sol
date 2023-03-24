// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract GranularRoles is AccessControl {

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPDATE_CONTRACT_ROLE = keccak256("UPDATE_CONTRACT_ROLE");
    bytes32 public constant UPDATE_TOKEN_ROLE = keccak256("UPDATE_TOKEN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // keeps track of roles and addresses along with their status
    struct RoleAddresses {
        bytes32 role;
        address[] addresses;
        bool frozen;
    }

    address internal _owner;


    mapping(bytes32 => address[]) internal _roleAddressesIndexed;
    mapping(bytes32 => bool) internal _rolesFrozen; // This roles can not be changed after updating

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function transferOwnership(address newOwner) public {
        require(newOwner != _owner, "Already the owner");
        require(_msgSender() == _owner, "Only owner can transfer ownership");

        _revokeRole(ADMIN_ROLE, _owner);
        address previousOwner = _owner;
        _owner = newOwner;

        // Assign this role - officially to new owner using access control
        _grantRole(ADMIN_ROLE, _owner);

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function hasRole(bytes32 role, address account)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            super.hasRole(ADMIN_ROLE, account) || super.hasRole(role, account);
    }

    constructor(address owner_) { 
        _grantRole(ADMIN_ROLE, owner_);
    } 

    function _initRoles(RoleAddresses[] memory roleAddresses)
        internal
    {

        for (
            uint256 roleIndex = 0;
            roleIndex < roleAddresses.length;
            roleIndex++
        ) {
            bytes32 role = roleAddresses[roleIndex].role;

            // Check if role exists
            require(
                _regularRoleValid(role),
                "GranularRoles: Invalid roleAddresses"
            );
            for (
                uint256 addressIndex = 0;
                addressIndex < roleAddresses[roleIndex].addresses.length;
                addressIndex++
            ) {
                // Take role from assigned role for address and grant it
                _grantRole(
                    role,
                    roleAddresses[roleIndex].addresses[addressIndex]
                );
                // Update role address index for gas optimization
                _roleAddressesIndexed[role].push(
                    roleAddresses[roleIndex].addresses[addressIndex]
                );

                // TODO: What about frozen roles
                if (roleAddresses[roleIndex].frozen) {
                    _rolesFrozen[role] = true;
                }
            }
        }
    }

    function _updateRoles(RoleAddresses[] memory roleAddresses) internal {
        if (roleAddresses.length > 0) {
            require(
                hasRole(ADMIN_ROLE, _msgSender()),
                "Granular roles: only ADMIN_ROLE can change permissions"
            );
            for (
                uint256 roleIndex = 0;
                roleIndex < roleAddresses.length;
                roleIndex++
            ) {
                bytes32 role = roleAddresses[roleIndex].role;
                require(
                    _regularRoleValid(role),
                    string(
                        abi.encodePacked(
                            "GranularRoles: invalid role",
                            Strings.toHexString(uint256(role), 32)
                        )
                    )
                );

                require(
                    !_rolesFrozen[role],
                    string(
                        abi.encodePacked(
                            "GranularRoles: role",
                            Strings.toHexString(uint256(role), 32),
                            " is frozen"
                        )
                    )
                );

                for (
                    uint256 addressIndex = 0;
                    addressIndex < _roleAddressesIndexed[role].length;
                    addressIndex++
                ) {
                    _revokeRole(
                        role,
                        _roleAddressesIndexed[role][addressIndex]
                    );
                }

                delete _roleAddressesIndexed[role];

                for (
                    uint256 addressIndex = 0;
                    addressIndex < roleAddresses[roleIndex].addresses.length;
                    addressIndex++
                ) {
                    _grantRole(
                        role,
                        roleAddresses[roleIndex].addresses[addressIndex]
                    );
                    _roleAddressesIndexed[role].push(
                        roleAddresses[roleIndex].addresses[addressIndex]
                    );
                }

                // Check if frozen
                if (roleAddresses[roleIndex].frozen) {
                    _rolesFrozen[role] = true;
                }
            }
        }
    }

    // This should have other roles also
    function _regularRoleValid(bytes32 role) internal pure returns (bool) {
        return
            role == UPDATE_CONTRACT_ROLE ||
            role == OPERATOR_ROLE;
    }

    function grantAdminRole(address _receiver) internal {
        require(
            _msgSender() == _owner,
            "GranularRoles: Only owner can provide admin access"
        );

        _grantRole(ADMIN_ROLE, _receiver);
    }
}