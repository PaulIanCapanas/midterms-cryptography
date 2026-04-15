// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TipPost {
    struct Post {
        uint256 id;
        address creator;
        string imageUrl;
        string caption;
        uint256 likes;
        uint256 totalEarned;
        uint256 timestamp;
    }

    uint256 public postCount;
    uint256 public constant likeCost = 0.0001 ether;

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256) public totalEarnedByUser;

    event PostCreated(uint256 indexed id, address indexed creator, string imageUrl, string caption, uint256 timestamp);
    event PostLiked(uint256 indexed id, address indexed liker, address indexed creator, uint256 likes, uint256 amount);

    error EmptyImageUrl();
    error EmptyCaption();
    error PostDoesNotExist(uint256 id);
    error InsufficientEth();
    error AlreadyLiked(uint256 id, address user);
    error CannotLikeOwnPost(uint256 id);

    function createPost(string calldata imageUrl, string calldata caption) external {
        if (bytes(imageUrl).length == 0) revert EmptyImageUrl();
        if (bytes(caption).length == 0) revert EmptyCaption();

        postCount++;
        uint256 newId = postCount;

        posts[newId] = Post({
            id: newId,
            creator: msg.sender,
            imageUrl: imageUrl,
            caption: caption,
            likes: 0,
            totalEarned: 0,
            timestamp: block.timestamp
        });

        emit PostCreated(newId, msg.sender, imageUrl, caption, block.timestamp);
    }

    function likePost(uint256 postId) external payable {
        Post storage post = posts[postId];

        if (post.id == 0) revert PostDoesNotExist(postId);
        if (msg.value < likeCost) revert InsufficientEth();
        if (hasLiked[postId][msg.sender]) revert AlreadyLiked(postId, msg.sender);
        if (post.creator == msg.sender) revert CannotLikeOwnPost(postId);

        hasLiked[postId][msg.sender] = true;
        post.likes++;
        post.totalEarned += likeCost;
        totalEarnedByUser[post.creator] += likeCost;

        (bool success, ) = post.creator.call{value: likeCost}("");
        require(success, "Transfer to creator failed");

        emit PostLiked(postId, msg.sender, post.creator, post.likes, likeCost);
    }

    function getAllPosts() external view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postCount);
        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i - 1] = posts[i];
        }
        return allPosts;
    }

    function checkLiked(uint256 postId, address user) external view returns (bool) {
        return hasLiked[postId][user];
    }
}