const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing Stream Payment Flow\n");
  console.log("=".repeat(60));

  // Get accounts
  const [sender] = await ethers.getSigners();
  console.log("\n👤 Test Accounts:");
  console.log("  Sender:", sender.address);
  
  // Create a recipient address (for testing, we'll use a different address)
  const recipient = "0x742d35cc595f0beb595f0beb595f0beb595f0beb"; // Test address
  const recipientChecksummed = ethers.getAddress(recipient);
  console.log("  Recipient:", recipientChecksummed);

  // Load deployment info
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const files = fs.readdirSync(deploymentsDir);
  const sepoliaFile = files.find(f => f.startsWith("sepolia-"));
  
  if (!sepoliaFile) {
    console.log("❌ No Sepolia deployment found");
    return;
  }

  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, sepoliaFile), "utf8")
  );

  console.log("\n📋 Contract Addresses:");
  console.log("  MockUSDC:", deployment.contracts.mockUSDC);
  console.log("  StreamPayment:", deployment.contracts.streamPayment);

  // Get contract instances
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(deployment.contracts.mockUSDC);
  
  const StreamPayment = await ethers.getContractFactory("StreamPayment");
  const streamPayment = StreamPayment.attach(deployment.contracts.streamPayment);

  // Check initial balances
  console.log("\n💰 Initial Balances:");
  const senderBalance = await usdc.balanceOf(sender.address);
  console.log("  Sender USDC:", ethers.formatUnits(senderBalance, 6), "USDC");

  // Test parameters
  const streamAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  const duration = 3600; // 1 hour
  const streamName = "Test Payment Stream";

  console.log("\n🌊 Creating Stream:");
  console.log("  Amount:", ethers.formatUnits(streamAmount, 6), "USDC");
  console.log("  Duration:", duration, "seconds (1 hour)");
  console.log("  Name:", streamName);

  // Step 1: Approve USDC
  console.log("\n⏳ Step 1: Approving USDC...");
  try {
    const approveTx = await usdc.approve(streamPayment.target, streamAmount);
    console.log("  Transaction:", approveTx.hash);
    await approveTx.wait();
    console.log("  ✅ Approval confirmed");
  } catch (error) {
    console.log("  ❌ Approval failed:", error.message);
    return;
  }

  // Step 2: Create stream
  console.log("\n⏳ Step 2: Creating stream...");
  try {
    const createTx = await streamPayment.createStream(
      recipientChecksummed,
      usdc.target,
      streamAmount,
      duration,
      streamName
    );
    console.log("  Transaction:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("  ✅ Stream created!");
    
    // Get stream ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = streamPayment.interface.parseLog(log);
        return parsed && parsed.name === "StreamCreated";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = streamPayment.interface.parseLog(event);
      const streamId = parsed.args.streamId;
      console.log("  Stream ID:", streamId.toString());
      
      // Get stream details
      console.log("\n📊 Stream Details:");
      const stream = await streamPayment.getStream(streamId);
      console.log("  Sender:", stream.sender);
      console.log("  Recipient:", stream.recipient);
      console.log("  Token:", stream.token);
      console.log("  Total Amount:", ethers.formatUnits(stream.totalAmount, 6), "USDC");
      console.log("  Start Time:", new Date(Number(stream.startTime) * 1000).toLocaleString());
      console.log("  End Time:", new Date(Number(stream.endTime) * 1000).toLocaleString());
      console.log("  Status:", stream.isActive ? "Active" : "Inactive");
      
      // Calculate available balance
      const available = await streamPayment.balanceOf(streamId, recipientChecksummed);
      console.log("  Available Now:", ethers.formatUnits(available, 6), "USDC");
    }
  } catch (error) {
    console.log("  ❌ Stream creation failed:", error.message);
    if (error.data) {
      console.log("  Error data:", error.data);
    }
    return;
  }

  // Check final balances
  console.log("\n💰 Final Balances:");
  const finalBalance = await usdc.balanceOf(sender.address);
  console.log("  Sender USDC:", ethers.formatUnits(finalBalance, 6), "USDC");
  const contractBalance = await usdc.balanceOf(streamPayment.target);
  console.log("  Contract USDC:", ethers.formatUnits(contractBalance, 6), "USDC");

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("  1. Open the frontend at https://protocolbanks.com");
  console.log("  2. Connect your MetaMask wallet");
  console.log("  3. Switch to Sepolia network");
  console.log("  4. Try creating a stream from the UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
