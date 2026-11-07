
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandVerification", function () {
  let landVerification;
  let admin;
  let registrar;
  let owner;
  let newOwner;
  let unauthorized;

  const property = {
    propertyId: "LAND-001",
    titleNumber: "TITLE-001",
    location: "Tawi-Tawi",
    propertyType: "Residential",
    landArea: 500,
    documentHash: ethers.keccak256(
      ethers.toUtf8Bytes("sample-document-content")
    ),
    ipfsCID: "bafybeigdyrzt-example-cid"
  };

  async function registerProperty(overrides = {}) {
    const data = { ...property, ...overrides };

    return landVerification.connect(registrar).registerProperty(
      data.propertyId,
      data.titleNumber,
      data.ownerAddress || owner.address,
      data.location,
      data.propertyType,
      data.landArea,
      data.documentHash,
      data.ipfsCID
    );
  }

  async function requestTransfer() {
    return landVerification
      .connect(owner)
      .requestOwnershipTransfer(property.propertyId, newOwner.address);
  }

  beforeEach(async function () {
    [admin, registrar, owner, newOwner, unauthorized] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory(
      "LandVerification",
      admin
    );

    landVerification = await Factory.deploy(admin.address);
    await landVerification.waitForDeployment();

    await landVerification.connect(admin).addRegistrar(registrar.address);
  });

  describe("Registrar permissions", function () {
    it("grants the administrator registrar permissions", async function () {
      const role = await landVerification.REGISTRAR_ROLE();

      expect(
        await landVerification.hasRole(role, admin.address)
      ).to.equal(true);
    });

    it("allows an authorized registrar to register a property", async function () {
      await expect(registerProperty())
        .to.emit(landVerification, "PropertyRegistered");
    });

    it("rejects registration by an unauthorized account", async function () {
      await expect(
        landVerification.connect(unauthorized).registerProperty(
          property.propertyId,
          property.titleNumber,
          owner.address,
          property.location,
          property.propertyType,
          property.landArea,
          property.documentHash,
          property.ipfsCID
        )
      ).to.be.reverted;
    });

    it("rejects duplicate property IDs", async function () {
      await registerProperty();

      await expect(registerProperty()).to.be.revertedWith(
        "Property ID already exists"
      );
    });
  });

  describe("Public verification", function () {
    it("allows a public account to verify a property", async function () {
      await registerProperty();

      const record = await landVerification
        .connect(unauthorized)
        .verifyProperty(property.propertyId);

      expect(record.propertyId).to.equal(property.propertyId);
      expect(record.currentOwner).to.equal(owner.address);
      expect(record.active).to.equal(true);
      expect(record.documentHash).to.equal(property.documentHash);
    });

    it("rejects an unregistered property ID", async function () {
      await expect(
        landVerification.verifyProperty("UNKNOWN-ID")
      ).to.be.revertedWith("Property not found");
    });
  });

  describe("Registrar-approved ownership transfers", function () {
    beforeEach(async function () {
      await registerProperty();
    });

    it("allows the current owner to request a transfer", async function () {
      await expect(requestTransfer())
        .to.emit(landVerification, "OwnershipTransferRequested")
        .withArgs(
          ethers.keccak256(ethers.toUtf8Bytes(property.propertyId)),
          owner.address,
          newOwner.address,
          (value) => value > 0
        );

      const request = await landVerification.getTransferRequest(
        property.propertyId
      );

      expect(request.requestedNewOwner).to.equal(newOwner.address);
      expect(request.pending).to.equal(true);
    });

    it("does not change ownership before registrar approval", async function () {
      await requestTransfer();

      const record = await landVerification.verifyProperty(
        property.propertyId
      );

      expect(record.currentOwner).to.equal(owner.address);

      const history = await landVerification.getOwnershipHistory(
        property.propertyId
      );

      expect(history).to.deep.equal([owner.address]);
    });

    it("allows a registrar to approve a pending transfer", async function () {
      await requestTransfer();

      await expect(
        landVerification
          .connect(registrar)
          .approveOwnershipTransfer(property.propertyId)
      )
        .to.emit(landVerification, "OwnershipTransferred")
        .withArgs(
          ethers.keccak256(ethers.toUtf8Bytes(property.propertyId)),
          owner.address,
          newOwner.address,
          registrar.address,
          (value) => value > 0
        );

      const record = await landVerification.verifyProperty(
        property.propertyId
      );

      expect(record.currentOwner).to.equal(newOwner.address);

      const history = await landVerification.getOwnershipHistory(
        property.propertyId
      );

      expect(history).to.deep.equal([owner.address, newOwner.address]);

      const request = await landVerification.getTransferRequest(
        property.propertyId
      );

      expect(request.pending).to.equal(false);
    });

    it("rejects approval by an unauthorized account", async function () {
      await requestTransfer();

      await expect(
        landVerification
          .connect(unauthorized)
          .approveOwnershipTransfer(property.propertyId)
      ).to.be.reverted;
    });

    it("rejects approval when no transfer is pending", async function () {
      await expect(
        landVerification
          .connect(registrar)
          .approveOwnershipTransfer(property.propertyId)
      ).to.be.revertedWith("No pending transfer");
    });

    it("rejects transfer requests from someone other than the current owner", async function () {
      await expect(
        landVerification
          .connect(unauthorized)
          .requestOwnershipTransfer(property.propertyId, newOwner.address)
      ).to.be.revertedWith("Not current owner");
    });

    it("prevents multiple pending transfer requests", async function () {
      await requestTransfer();

      await expect(
        landVerification
          .connect(owner)
          .requestOwnershipTransfer(property.propertyId, unauthorized.address)
      ).to.be.revertedWith("Transfer request already pending");
    });

    it("allows a registrar to reject a pending transfer", async function () {
      await requestTransfer();

      await expect(
        landVerification
          .connect(registrar)
          .rejectOwnershipTransfer(
            property.propertyId,
            "Supporting documents require further review"
          )
      ).to.emit(landVerification, "OwnershipTransferRejected");

      const record = await landVerification.verifyProperty(
        property.propertyId
      );

      expect(record.currentOwner).to.equal(owner.address);

      const request = await landVerification.getTransferRequest(
        property.propertyId
      );

      expect(request.pending).to.equal(false);
    });

    it("rejects transfer approval by the owner", async function () {
      await requestTransfer();

      await expect(
        landVerification
          .connect(owner)
          .approveOwnershipTransfer(property.propertyId)
      ).to.be.reverted;
    });
  });

  describe("Revocation", function () {
    it("allows a registrar to revoke a property", async function () {
      await registerProperty();

      await expect(
        landVerification
          .connect(registrar)
          .revokeProperty(property.propertyId, "Record requires review")
      ).to.emit(landVerification, "PropertyRevoked");

      const record = await landVerification.verifyProperty(
        property.propertyId
      );

      expect(record.exists).to.equal(true);
      expect(record.active).to.equal(false);
    });

    it("rejects transfer requests for a revoked property", async function () {
      await registerProperty();

      await landVerification
        .connect(registrar)
        .revokeProperty(property.propertyId, "Record requires review");

      await expect(
        landVerification
          .connect(owner)
          .requestOwnershipTransfer(property.propertyId, newOwner.address)
      ).to.be.revertedWith("Property is revoked");
    });

    it("cancels a pending request when the property is revoked", async function () {
      await registerProperty();
      await requestTransfer();

      await landVerification
        .connect(registrar)
        .revokeProperty(property.propertyId, "Record requires review");

      const request = await landVerification.getTransferRequest(
        property.propertyId
      );

      expect(request.pending).to.equal(false);
    });

    it("rejects revocation by an unauthorized account", async function () {
      await registerProperty();

      await expect(
        landVerification
          .connect(unauthorized)
          .revokeProperty(property.propertyId, "Unauthorized attempt")
      ).to.be.reverted;
    });
  });
});
