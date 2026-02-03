/**
 * Instagram Follower Graph Builder and Renderer
 * Builds relationship graphs from follower/following data and renders them using 3d-force-graph
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'relations-graph:data:v1';

  /**
   * Build graph data structure from followers and following arrays
   * @param {string[]} followers - Array of follower usernames
   * @param {string[]} following - Array of following usernames
   * @param {string} profileUsername - The profile username (center node)
   * @returns {Object} Graph data with nodes and links
   */
  function buildGraphFromFollowers(followers, following, profileUsername) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Ensure profile username exists
    const profileUser = profileUsername || 'profile_user';
    
    // Add profile user as center node
    nodes.push({
      id: profileUser,
      label: profileUser,
      type: 'instagram_user',
      isProfile: true
    });
    nodeMap.set(profileUser, nodes[0]);

    // Add follower nodes and links
    followers.forEach(function(username) {
      if (!username || username === profileUser) return;
      
      if (!nodeMap.has(username)) {
        const node = {
          id: username,
          label: username,
          type: 'instagram_user',
          isProfile: false
        };
        nodes.push(node);
        nodeMap.set(username, node);
      }

      // Link: follower follows profile user
      links.push({
        source: username,
        target: profileUser,
        relation: 'follows'
      });
    });

    // Find mutual connections first (users in both followers and following)
    const followersSet = new Set(followers);
    const mutuals = following.filter(function(username) {
      return followersSet.has(username) && username !== profileUser;
    });
    const mutualSet = new Set(mutuals);

    // Add following nodes and links
    following.forEach(function(username) {
      if (!username || username === profileUser) return;
      
      if (!nodeMap.has(username)) {
        const node = {
          id: username,
          label: username,
          type: 'instagram_user',
          isProfile: false
        };
        nodes.push(node);
        nodeMap.set(username, node);
      }

      // For mutual connections, use 'mutual' relation instead of 'following'
      const relation = mutualSet.has(username) ? 'mutual' : 'following';
      links.push({
        source: profileUser,
        target: username,
        relation: relation
      });
    });

    return {
      nodes: nodes,
      links: links,
      stats: {
        followers: followers.length,
        following: following.length,
        mutuals: mutuals.length
      },
      mutuals: mutuals
    };
  }

  /**
   * Compute node colors based on type and highlight state
   */
  function computeNodeColor(node, highlighted) {
    if (node.isProfile) {
      return highlighted ? '#ffd166' : '#7c6cf6'; // Profile user: purple/yellow
    }
    if (node.isMutual) {
      return highlighted ? '#4ade80' : '#80e27e'; // Mutual: green
    }
    return highlighted ? '#ff738a' : '#9bb0c9'; // Regular: blue/gray
  }

  /**
   * Compute link dynamic properties (incoming/outgoing counts)
   */
  function computeLinkDynamicProperties(data) {
    // Reset counts
    data.nodes.forEach(function(node) {
      node.incoming = 0;
      node.outgoing = 0;
    });

    // Count links
    data.links.forEach(function(link) {
      const source = data.nodes.find(function(n) { return n.id === link.source; });
      const target = data.nodes.find(function(n) { return n.id === link.target; });
      if (source) source.outgoing += 1;
      if (target) target.incoming += 1;
    });

    // Mark mutual nodes
    const mutualSet = new Set(data.mutuals || []);
    data.nodes.forEach(function(node) {
      node.isMutual = mutualSet.has(node.id);
    });
  }

  /**
   * Render 3D graph using 3d-force-graph library
   * @param {HTMLElement} container - Container element for the graph
   * @param {Object} graphData - Graph data with nodes and links
   * @param {Object} options - Rendering options
   * @returns {Object} Graph instance
   */
  function renderGraph(container, graphData, options) {
    if (!window.ForceGraph3D) {
      throw new Error('3d-force-graph library not loaded. Please include the script.');
    }

    const ForceGraph3D = window.ForceGraph3D;
    const highlightNodes = new Set();
    const highlightLinks = new Set();
    let hoverNode = null;
    let clickedNode = null;

    computeLinkDynamicProperties(graphData);

    // Cross-link node objects for neighbor access
    graphData.links.forEach(function(link) {
      const source = graphData.nodes.find(function(n) { return n.id === link.source; });
      const target = graphData.nodes.find(function(n) { return n.id === link.target; });
      
      if (source && target) {
        if (!source.neighbors) source.neighbors = [];
        if (!target.neighbors) target.neighbors = [];
        source.neighbors.push(target);
        target.neighbors.push(source);

        if (!source.links) source.links = [];
        if (!target.links) target.links = [];
        source.links.push(link);
        target.links.push(link);
      }
    });

    function updateHighlight() {
      Graph
        .nodeColor(Graph.nodeColor())
        .nodeThreeObject(Graph.nodeThreeObject())
        .linkWidth(Graph.linkWidth())
        .linkDirectionalParticles(Graph.linkDirectionalParticles());
    }

    function getNodeSize(node) {
      const inc = Number(node.incoming || 0);
      const out = Number(node.outgoing || 0);
      const size = inc + out;
      return size > 0 ? size * 2 : (node.isProfile ? 8 : 4);
    }

    const Graph = ForceGraph3D()(container)
      .graphData(graphData)
      .backgroundColor('#0b0f14')
      .nodeLabel(function(n) {
        return (n.label || n.id) + (n.isProfile ? '\n(Profile)' : '') + (n.isMutual ? '\n(Mutual)' : '');
      })
      .nodeColor(function(n) {
        const isHighlighted = highlightNodes.size > 0 && highlightNodes.has(n);
        return computeNodeColor(n, isHighlighted);
      })
      .nodeOpacity(1)
      .nodeVal(getNodeSize)
      .nodeRelSize(4)
      .nodeThreeObjectExtend(true)
      .nodeThreeObject(function(n) {
        if (!clickedNode || n !== clickedNode) return undefined;
        const THREE = window.THREE || window.THREEJS || window.THREE$1;
        if (!THREE) return undefined;
        
        const group = new THREE.Group();
        const baseRadius = getNodeSize(n) * 4;
        const borderRadius = baseRadius * 1.12;
        const geometry = new THREE.SphereGeometry(borderRadius, 24, 16);
        const material = new THREE.MeshBasicMaterial({
          color: 0xffd166,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
          depthWrite: false
        });
        const border = new THREE.Mesh(geometry, material);
        group.add(border);
        return group;
      })
      .linkColor(function(l) {
        if (highlightLinks.has(l)) return '#ffd166';
        if (l.relation === 'mutual') return '#80e27e';
        if (l.relation === 'follows') return '#4b87ff';
        return '#385271';
      })
      .linkOpacity(0.8)
      .linkDirectionalParticles(function(l) {
        return highlightLinks.has(l) ? 4 : 0;
      })
      .linkDirectionalParticleWidth(1.5)
      .linkWidth(function(l) {
        return highlightLinks.has(l) ? 2 : (l.relation === 'mutual' ? 1.5 : 1);
      })
      .linkLabel(function(l) {
        return l.relation || '';
      })
      .linkDirectionalArrowLength(function(l) {
        return highlightLinks.has(l) ? 4 : 5;
      })
      .linkDirectionalArrowRelPos(1)
      .onNodeHover(function(node) {
        if ((!node && highlightNodes.size === 0) || (node && hoverNode === node)) return;

        highlightNodes.clear();
        highlightLinks.clear();
        
        if (node) {
          highlightNodes.add(node);
          if (node.neighbors) {
            node.neighbors.forEach(function(neighbor) {
              highlightNodes.add(neighbor);
            });
          }
          if (node.links) {
            node.links.forEach(function(link) {
              highlightLinks.add(link);
            });
          }
        }

        hoverNode = node || null;
        updateHighlight();
      })
      .onLinkHover(function(link) {
        highlightNodes.clear();
        highlightLinks.clear();

        if (link) {
          highlightLinks.add(link);
          const source = graphData.nodes.find(function(n) { return n.id === link.source; });
          const target = graphData.nodes.find(function(n) { return n.id === link.target; });
          if (source) highlightNodes.add(source);
          if (target) highlightNodes.add(target);
        }

        updateHighlight();
      })
      .onNodeClick(function(node) {
        clickedNode = node;
        const distance = 220;
        const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
        const lateral = 120;
        Graph.cameraPosition(
          { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
          { x: (node.x || 0) - lateral, y: node.y || 0, z: node.z || 0 },
          2000
        );
      });

    // Configure forces
    Graph.d3Force('charge').strength(-180);
    Graph.d3Force('link').distance(function() {
      return options.linkDistance || 100;
    });

    return Graph;
  }

  /**
   * Save graph data to localStorage for relations-graph compatibility
   * @param {Object} graphData - Graph data to save
   * @param {boolean} merge - Whether to merge with existing data
   */
  function saveToRelationsGraph(graphData, merge) {
    if (merge) {
      try {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
          const existingData = JSON.parse(existing);
          // Merge nodes (update if exists, add if new)
          const nodeMap = new Map();
          existingData.nodes.forEach(function(n) {
            nodeMap.set(n.id, n);
          });
          graphData.nodes.forEach(function(n) {
            nodeMap.set(n.id, n);
          });
          existingData.nodes = Array.from(nodeMap.values());

          // Merge links (avoid duplicates)
          const linkSet = new Set();
          existingData.links.forEach(function(l) {
            const key = l.source + '|' + l.target + '|' + (l.relation || '');
            linkSet.add(key);
          });
          graphData.links.forEach(function(l) {
            const key = l.source + '|' + l.target + '|' + (l.relation || '');
            if (!linkSet.has(key)) {
              existingData.links.push(l);
              linkSet.add(key);
            }
          });

          localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
          return;
        }
      } catch (e) {
        console.warn('Failed to merge with existing data:', e);
      }
    }

    // Save new data
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nodes: graphData.nodes,
      links: graphData.links
    }));
  }

  global.InstagramGraph = {
    buildGraphFromFollowers,
    renderGraph,
    saveToRelationsGraph,
    computeLinkDynamicProperties
  };
})(typeof window !== 'undefined' ? window : this);
