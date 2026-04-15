import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("TipPost", function () {
  let tipPost: any;
  let owner: any;
  let user1: any;
  let user2: any;
  const likeCost = ethers.utils.parseEther("0.0001");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const TipPost = await ethers.getContractFactory("TipPost");
    tipPost = await TipPost.deploy();
    await tipPost.deployed();
  });

  describe("createPost", function () {
    it("should create a post and emit PostCreated event", async function () {
      const tx = await tipPost.createPost("https://example.com/image.jpg", "Test caption");
      const receipt = await tx.wait();

      await expect(tx).to.emit(tipPost, "PostCreated");

      const postCount = await tipPost.postCount();
      expect(postCount).to.equal(1);

      const post = await tipPost.posts(1);
      expect(post.creator).to.equal(owner.address);
      expect(post.imageUrl).to.equal("https://example.com/image.jpg");
      expect(post.caption).to.equal("Test caption");
    });

    it("should revert with empty image URL", async function () {
      await expect(tipPost.createPost("", "caption")).to.be.revertedWithCustomError(tipPost, "EmptyImageUrl");
    });

    it("should revert with empty caption", async function () {
      await expect(tipPost.createPost("https://example.com/image.jpg", "")).to.be.revertedWithCustomError(tipPost, "EmptyCaption");
    });
  });

  describe("likePost", function () {
    beforeEach(async function () {
      await tipPost.createPost("https://example.com/image.jpg", "Test caption");
    });

    it("should allow user to like a post and transfer ETH to creator", async function () {
      const creatorBalanceBefore = await ethers.provider.getBalance(owner.address);

      await expect(tipPost.connect(user1).likePost(1, { value: likeCost }))
        .to.emit(tipPost, "PostLiked");

      const post = await tipPost.posts(1);
      expect(post.likes).to.equal(1);
      expect(post.totalEarned).to.equal(likeCost);

      const creatorBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore.add(likeCost));
    });

    it("should reject double likes from the same user", async function () {
      await tipPost.connect(user1).likePost(1, { value: likeCost });

      await expect(tipPost.connect(user1).likePost(1, { value: likeCost }))
        .to.be.revertedWithCustomError(tipPost, "AlreadyLiked");
    });

    it("should reject self-liking", async function () {
      await expect(tipPost.likePost(1, { value: likeCost }))
        .to.be.revertedWithCustomError(tipPost, "CannotLikeOwnPost");
    });

    it("should reject likes with insufficient ETH", async function () {
      await expect(tipPost.connect(user1).likePost(1, { value: likeCost.sub(1) }))
        .to.be.revertedWithCustomError(tipPost, "InsufficientEth");
    });

    it("should reject likes on non-existent posts", async function () {
      await expect(tipPost.connect(user1).likePost(999, { value: likeCost }))
        .to.be.revertedWithCustomError(tipPost, "PostDoesNotExist");
    });
  });

  describe("getAllPosts", function () {
    it("should return all posts as an array", async function () {
      await tipPost.createPost("https://example.com/image1.jpg", "Caption 1");
      await tipPost.createPost("https://example.com/image2.jpg", "Caption 2");

      const posts = await tipPost.getAllPosts();
      expect(posts.length).to.equal(2);
      expect(posts[0].imageUrl).to.equal("https://example.com/image1.jpg");
      expect(posts[1].imageUrl).to.equal("https://example.com/image2.jpg");
    });
  });

  describe("checkLiked", function () {
    beforeEach(async function () {
      await tipPost.createPost("https://example.com/image.jpg", "Test caption");
    });

    it("should return false for unliked post", async function () {
      const hasLiked = await tipPost.checkLiked(1, user1.address);
      expect(hasLiked).to.equal(false);
    });

    it("should return true after liking", async function () {
      await tipPost.connect(user1).likePost(1, { value: likeCost });
      const hasLiked = await tipPost.checkLiked(1, user1.address);
      expect(hasLiked).to.equal(true);
    });
  });
});