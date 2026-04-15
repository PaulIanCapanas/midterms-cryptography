import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import type { Post, TransactionStatus } from './types';
import TIPPOST_ABI from './abi/TipPost.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const LIKE_COST_ETH = '0.0001';
const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeListener: (event: string, listener: (...args: any[]) => void) => void;
    };
  }
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [myEarnings, setMyEarnings] = useState<bigint>(BigInt(0));
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const contractRef = useRef(contract);
  const accountRef = useRef(account);
  contractRef.current = contract;
  accountRef.current = account;

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DECIMAL) {
        setIsWrongNetwork(true);
      } else {
        setIsWrongNetwork(false);
      }

      const tipPostContract = new ethers.Contract(CONTRACT_ADDRESS, TIPPOST_ABI, signer);
      setContract(tipPostContract);
      setAccount(address);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  }, []);

  const switchToSepolia = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      connectWallet();
    } catch (err: any) {
      if (err.code === 4902) {
        setError('Please add Sepolia network manually');
      } else {
        setError(err.message);
      }
    }
  };

  const loadPosts = useCallback(async () => {
    if (!contractRef.current || !accountRef.current) return;

    try {
      const allPosts = await contractRef.current.getAllPosts();
      const mappedPosts = allPosts.map((post: any) => ({
        id: Number(post.id),
        creator: post.creator,
        imageUrl: post.imageUrl,
        caption: post.caption,
        likes: Number(post.likes),
        totalEarned: post.totalEarned,
        timestamp: Number(post.timestamp),
      }));
      setPosts(mappedPosts);

      const liked = new Set<number>();
      for (const post of mappedPosts) {
        const hasLiked = await contractRef.current.checkLiked(post.id, accountRef.current);
        if (hasLiked) liked.add(post.id);
      }
      setLikedPosts(liked);

      const earnings = await contractRef.current.totalEarnedByUser(accountRef.current);
      setMyEarnings(earnings);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    }
  }, []);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newImageUrl.trim() || !newCaption.trim()) return;

    setStatus('loading');
    setStatusMessage('Creating post...');
    setError(null);

    try {
      const tx = await contract.createPost(newImageUrl, newCaption);
      await tx.wait();
      setStatus('success');
      setStatusMessage('Post created successfully!');
      setNewImageUrl('');
      setNewCaption('');
      loadPosts();
    } catch (err: any) {
      setStatus('error');
      setError(err.reason || err.message || 'Failed to create post');
    }
  };

  const likePost = async (postId: number) => {
    if (!contract || likedPosts.has(postId)) return;

    setStatus('loading');
    setStatusMessage('Sending like with tip...');
    setError(null);

    try {
      const tx = await contract.likePost(postId, {
        value: ethers.parseEther(LIKE_COST_ETH),
      });
      await tx.wait();
      setStatus('success');
      setStatusMessage('Like sent with tip!');
      loadPosts();
    } catch (err: any) {
      setStatus('error');
      if (err.reason?.includes('AlreadyLiked')) {
        setError('You have already liked this post');
      } else if (err.reason?.includes('CannotLikeOwnPost')) {
        setError('You cannot like your own post');
      } else if (err.reason?.includes('InsufficientEth')) {
        setError('Insufficient ETH sent');
      } else {
        setError(err.reason || err.message || 'Failed to like post');
      }
    }
  };

  useEffect(() => {
    connectWallet();
  }, [connectWallet]);

  useEffect(() => {
    if (contract) {
      loadPosts();

      const handlePostCreated = () => loadPosts();
      const handlePostLiked = () => loadPosts();

      contract.on('PostCreated', handlePostCreated);
      contract.on('PostLiked', handlePostLiked);

      return () => {
        contract.off('PostCreated', handlePostCreated);
        contract.off('PostLiked', handlePostLiked);
      };
    }
  }, [contract, loadPosts]);

  useEffect(() => {
    if (!window.ethereum) return () => {};

    const handleAccountsChanged = () => window.location.reload();
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatEth = (amount: bigint) => ethers.formatEther(amount);
  const isOwnPost = (creator: string) => account && creator.toLowerCase() === account.toLowerCase();

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">TipPost</h1>
        {account ? (
          <span className="connected-address">{formatAddress(account)}</span>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </header>

      {isWrongNetwork && (
        <div className="network-warning">
          <p>You are connected to the wrong network. Please switch to Sepolia.</p>
          <button className="submit-btn" onClick={switchToSepolia} style={{ marginTop: '8px' }}>
            Switch to Sepolia
          </button>
        </div>
      )}

      {account && !isWrongNetwork && (
        <>
          <div className="earnings-display">
            <div className="earnings-label">Your Total Earnings</div>
            <div className="earnings-amount">{formatEth(myEarnings)} ETH</div>
          </div>

          <form className="create-post-form" onSubmit={createPost}>
            <h2 className="form-title">Create Post</h2>
            <input
              type="url"
              className="form-input"
              placeholder="Image URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              required
            />
            <input
              type="text"
              className="form-input"
              placeholder="Caption"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn" disabled={status === 'loading'}>
              Create Post
            </button>
            {status !== 'idle' && (
              <div className={`status-message ${status}`}>{statusMessage}</div>
            )}
            {error && <div className="error-message">{error}</div>}
          </form>

          <div className="post-feed">
            {posts.length === 0 ? (
              <div className="empty-feed">No posts yet. Be the first to create one!</div>
            ) : (
              [...posts].reverse().map((post) => (
                <div key={post.id} className="post-card">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="post-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="%2321262d" width="300" height="300"/><text fill="%238b949e" x="150" y="150" text-anchor="middle" dy=".3em">Image not available</text></svg>';
                    }}
                  />
                  <div className="post-content">
                    <div className="post-creator">{formatAddress(post.creator)}</div>
                    <div className="post-caption">{post.caption}</div>
                    <div className="post-stats">
                      <span className="like-count">{post.likes} likes</span>
                      {post.totalEarned > 0n && (
                        <span className="total-earned">Earned {formatEth(post.totalEarned)} ETH</span>
                      )}
                      <button
                        className={`like-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                        onClick={() => likePost(post.id)}
                        disabled={status === 'loading' || isOwnPost(post.creator) || likedPosts.has(post.id)}
                      >
                        {likedPosts.has(post.id) ? '❤️' : '🤍'} {LIKE_COST_ETH} ETH
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!account && <div className="empty-feed">Connect your wallet to start using TipPost</div>}
    </div>
  );
}

export default App;