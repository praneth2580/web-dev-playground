const STORAGE_KEY = "relations-graph:data:v1";
const NODE_SIZE_CONNECTION_WISE_MAP = (incoming, outgoing) => {
  const inc = Number(incoming || 0);
  const out = Number(outgoing || 0);
  const size = inc + out;
  return size > 0 ? size * 2 : 1;
};

function getDefaultData() {
  return {
    nodes: [
      { id: "alice", label: "Alice", type: "person" },
      { id: "bob", label: "Bob", type: "person" },
      { id: "server-01", label: "Server 01", type: "computer" },
      { id: "acme", label: "ACME Inc.", type: "org" }
    ],
    links: [
      { source: "alice", target: "server-01", relation: "uses" },
      { source: "bob", target: "server-01", relation: "uses" },
      { source: "alice", target: "bob", relation: "knows" },
      { source: "alice", target: "acme", relation: "employee_of" }
    ]
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    if (!parsed.nodes || !parsed.links) return getDefaultData();
    return parsed;
  } catch {
    return getDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function upsertNode(data, node) {
  const idx = data.nodes.findIndex(n => n.id === node.id);
  if (idx >= 0) {
    data.nodes[idx] = { ...data.nodes[idx], ...node };
  } else {
    data.nodes.push(node);
  }
}

function addLink(data, link) {
  // ensure nodes exist
  if (!data.nodes.some(n => n.id === link.source)) {
    data.nodes.push({ id: link.source, label: link.source });
  }
  if (!data.nodes.some(n => n.id === link.target)) {
    data.nodes.push({ id: link.target, label: link.target });
  }
  data.links.push(link);
}

function computeNodeColor(type, highlighted = false) {
  if (!type) return "#9bb0c9";
  const map = {
    person: { normal: "#4b87ff", highlight: "#9d08c2" },
    computer: { normal: "#5dd8a6", highlight: "#d9d916" },
    org: { normal: "#ffc857", highlight: "#00cf1f" }
  };
  return highlighted ? (map[type]?.highlight || "#21a6db") : (map[type]?.normal || "#c38bff");
}

function computeLinkDynamicProperties(data) {
  // Reset counts for all nodes first
  for (const node of data.nodes) {
    node.incoming = 0;
    node.outgoing = 0;
  }
  // Count links
  for (const link of data.links) {
    const source = data.nodes.find(n => n.id === link.source);
    const target = data.nodes.find(n => n.id === link.target);
    if (source) source.outgoing += 1;
    if (target) target.incoming += 1;
  }
}

function renderGraph(graphEl, data, options) {
  const ForceGraph3D = window.ForceGraph3D;
  const highlightNodes = new Set();
  const highlightLinks = new Set();
  let hoverNode = null;
  let clickedNode = null;

  function updateHighlight() {
    // trigger update of highlighted objects in scene
    Graph
      .nodeColor(Graph.nodeColor())
      .nodeThreeObject(Graph.nodeThreeObject())
      .linkWidth(Graph.linkWidth())
      .linkDirectionalParticles(Graph.linkDirectionalParticles());
  }

  computeLinkDynamicProperties(data);

  // cross-link node objects
  data.links.forEach(link => {
    const a = data.nodes.find(n => n.id === link.source);;
    const b = data.nodes.find(n => n.id === link.target);;
    !a.neighbors && (a.neighbors = []);
    !b.neighbors && (b.neighbors = []);
    a.neighbors.push(b);
    b.neighbors.push(a);

    !a.links && (a.links = []);
    !b.links && (b.links = []);
    a.links.push(link);
    b.links.push(link);
  });

  const Graph = ForceGraph3D()(graphEl)
    .graphData(data)
    .backgroundColor("#0b0f14")
    .nodeLabel(n => `${n.label || n.id}${n.type ? `\n(${n.type})` : ""}`)
    .nodeColor(n => {
      const isHighlighted = highlightNodes.size && highlightNodes.has(n);
      return computeNodeColor(n.type, isHighlighted);
    })
    .nodeOpacity(1)// 0.9)
    .nodeVal(n => {
      return NODE_SIZE_CONNECTION_WISE_MAP(n.incoming, n.outgoing);
    })
    .nodeRelSize(4)
    .nodeThreeObjectExtend(true)
    .nodeThreeObject(n => {
      if (!clickedNode || n !== clickedNode) return undefined;
      const THREE = window.THREE || window.THREEJS || window.THREE$1 || undefined;
      if (!THREE) return undefined;
      // Create a thin wireframe sphere slightly larger than the node as a 3D border
      const group = new THREE.Group();
      const baseRadius = (NODE_SIZE_CONNECTION_WISE_MAP(n.incoming, n.outgoing) || 1) * 4; // align with nodeRelSize(4)
      const borderRadius = baseRadius * 1.12; // small offset so it sits just outside the node
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
    .linkColor(l => (highlightLinks.has(l) ? "#ffd166" : "#385271"))
    .linkOpacity(0.8)
    .linkDirectionalParticles(l => (highlightLinks.has(l) ? 4 : 0))
    .linkDirectionalParticleWidth(1.5)
    .linkWidth(l => (highlightLinks.has(l) ? .2 : 1))
    .linkLabel(l => l.relation || "")
    .linkDirectionalArrowLength(l => (highlightLinks.has(l) ? 4 : 5))
    .linkDirectionalArrowRelPos(1)
    .onNodeHover(node => {
      // no state change
      if ((!node && !highlightNodes.size) || (node && hoverNode === node)) return;

      highlightNodes.clear();
      highlightLinks.clear();
      if (node) {
        highlightNodes.add(node);
        node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
        node.links.forEach(link => highlightLinks.add(link));
      }

      hoverNode = node || null;

      updateHighlight();
    })
    .onLinkHover(link => {
      highlightNodes.clear();
      highlightLinks.clear();

      if (link) {
        highlightLinks.add(link);
        highlightNodes.add(link.source);
        highlightNodes.add(link.target);
      }

      updateHighlight();
    })
    .onNodeClick(node => {
      clickedNode = node;

      // center and zoom on node
      const distance = 220;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z );
      const lateral = 120; // shift look-at slightly right so node appears left
      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        { x: node.x - lateral, y: node.y, z: node.z },
        2000
      );
    });

  Graph.d3Force('charge').strength(-180);
  Graph.d3Force('link').distance(() => options.linkDistance);

  return Graph;
}

function main() {
  const graphContainer = document.getElementById("graph");
  const nodeForm = document.getElementById("node-form");
  const linkForm = document.getElementById("link-form");
  const nodeId = document.getElementById("node-id");
  const nodeLabel = document.getElementById("node-label");
  const nodeType = document.getElementById("node-type");
  const linkSource = document.getElementById("link-source");
  const linkTarget = document.getElementById("link-target");
  const linkName = document.getElementById("link-name");
  const btnSample = document.getElementById("btn-sample");
  const btnExport = document.getElementById("btn-export");
  const btnClear = document.getElementById("btn-clear");
  const fileInput = document.getElementById("file-input");
  const jsonArea = document.getElementById("json-area");
  const btnApplyJson = document.getElementById("btn-apply-json");
  const linkDistanceEl = document.getElementById("link-distance");
  const togglePhysicsEl = document.getElementById("toggle-physics");
  const btnFit = document.getElementById("btn-fit");
  const btnImportCsv = document.getElementById("btn-import-csv");
  const btnImportJson = document.getElementById("btn-import-json");
  const btnDownloadSampleJson = document.getElementById("btn-download-sample-json");
  const btnDownloadSampleCsv = document.getElementById("btn-download-sample-csv");

  let data = loadData();
  jsonArea.value = JSON.stringify(data, null, 2);

  const options = { linkDistance: Number(linkDistanceEl.value), physics: true };
  let Graph = renderGraph(graphContainer, data, options);

  function refreshGraph() {
    computeLinkDynamicProperties(data);
    saveData(data);
    jsonArea.value = JSON.stringify(data, null, 2);
    Graph.graphData(data);
  }

  // Tab logic
  const tabBtnForms = document.getElementById('tab-btn-forms');
  const tabBtnDb = document.getElementById('tab-btn-database');
  const tabForms = document.getElementById('tab-forms');
  const tabDb = document.getElementById('tab-database');

  function renderDbTable(data) {
    // Uses two tables: nodes and links
    let html = '<h2 style="font-size:13px">Entities</h2>';
    html += '<div class="table-wrap"><table style="width:100%;font-size:12px;">';
    html += '<thead><tr><th>ID</th><th>Label</th><th>Type</th></tr></thead><tbody>';
    for (const n of data.nodes) {
      html += `<tr><td>${n.id}</td><td>${n.label || ''}</td><td>${n.type || ''}</td></tr>`;
    }
    html += '</tbody></table></div>';
    html += '<h2 style="font-size:13px;margin-top:18px;">Links</h2>';
    html += '<div class="table-wrap"><table style="width:100%;font-size:12px;">';
    html += '<thead><tr><th>Source</th><th>Target</th><th>Relation</th></tr></thead><tbody>';
    for (const l of data.links) {
      html += `<tr><td>${l.source.label}</td><td>${l.target.label}</td><td>${l.relation || ''}</td></tr>`;
    }
    html += '</tbody></table></div>';
    tabDb.innerHTML = html;
  }

  function setTab(activeTab) {
    if (activeTab === 'forms') {
      tabForms.style.display = '';
      tabDb.style.display = 'none';
      tabBtnForms.classList.add('tab-btn-active');
      tabBtnDb.classList.remove('tab-btn-active');
    } else {
      tabForms.style.display = 'none';
      tabDb.style.display = '';
      tabBtnDb.classList.add('tab-btn-active');
      tabBtnForms.classList.remove('tab-btn-active');
      renderDbTable(data);
    }
  }

  tabBtnForms.addEventListener('click', () => setTab('forms'));
  tabBtnDb.addEventListener('click', () => setTab('db'));

  // Patch refreshGraph to update db table if visible
  const oldRefresh = refreshGraph;
  refreshGraph = function () {
    oldRefresh();
    if (tabDb.style.display !== 'none') renderDbTable(data);
  }

  nodeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const node = {
      id: nodeId.value.trim(),
      label: nodeLabel.value.trim(),
      type: nodeType.value.trim() || undefined
    };
    if (!node.id || !node.label) return;
    upsertNode(data, node);
    refreshGraph();
    nodeId.value = "";
    nodeLabel.value = "";
    nodeType.value = "";
  });

  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const link = {
      source: linkSource.value.trim(),
      target: linkTarget.value.trim(),
      relation: linkName.value.trim() || undefined
    };
    if (!link.source || !link.target) return;
    addLink(data, link);
    refreshGraph();
    linkSource.value = "";
    linkTarget.value = "";
    linkName.value = "";
  });

  btnSample.addEventListener("click", () => {
    data = getDefaultData();
    refreshGraph();
  });

  btnExport.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relations-graph.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  btnClear.addEventListener("click", () => {
    if (!confirm("Clear all data?")) return;
    data = { nodes: [], links: [] };
    refreshGraph();
  });

  btnImportJson.addEventListener("click", (e) => {
    e.preventDefault();
    fileInput.accept = 'application/json';
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.csv')) return; // csv handled separately
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (!parsed.nodes || !parsed.links) throw new Error("Invalid format");
      data = parsed;
      refreshGraph();
    } catch (err) {
      alert("Failed to import JSON: " + err.message);
    } finally {
      fileInput.value = '';
    }
  });

  btnApplyJson.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(jsonArea.value);
      if (!parsed.nodes || !parsed.links) throw new Error("Invalid format");
      data = parsed;
      refreshGraph();
    } catch (err) {
      alert("Invalid JSON: " + err.message);
    }
  });

  function parseCSVToGraph(csvText) {
    // Expect rows like: type,id,label,other\n and link,source,target,relation\n
    const rows = csvText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!rows.length) return { nodes: [], links: [] };
    let nodes = [], links = [];
    // Try to detect header
    const header = rows[0].toLowerCase();
    let i = 0;
    if (header.includes("type") && header.includes("id")) i = 1;
    for (; i < rows.length; i++) {
      const cols = rows[i].split(",");
      if (cols[0] === "link") {
        // link,source,target,relation
        if (cols.length >= 4) {
          links.push({ source: cols[1], target: cols[2], relation: cols[3] });
        }
      } else {
        // node: type,id,label,(optionally others)
        nodes.push({
          type: cols[0],
          id: cols[1],
          label: cols[2],
          ...(cols.length > 3 && cols[3] ? { other: cols[3] } : {})
        });
      }
    }
    return { nodes, links };
  }

  btnImportCsv.addEventListener("click", () => {
    // Create invisible file input for CSV
    let input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const graph = parseCSVToGraph(text);
        if (!graph.nodes.length || !graph.links.length) throw new Error("CSV missing nodes or links");
        data = graph;
        refreshGraph();
      } catch (err) {
        alert("Failed to import CSV: " + err.message);
      }
    });
    input.click();
  });

  btnDownloadSampleJson.addEventListener("click", async () => {
    try {
      const response = await fetch("sample.json");
      if (!response.ok) throw new Error("Missing sample.json");
      const text = await response.text();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not fetch sample.json: " + err.message);
    }
  });

  btnDownloadSampleCsv.addEventListener("click", async () => {
    try {
      const response = await fetch("sample.csv");
      if (!response.ok) throw new Error("Missing sample.csv");
      const text = await response.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not fetch sample.csv: " + err.message);
    }
  });

  linkDistanceEl.addEventListener("input", () => {
    options.linkDistance = Number(linkDistanceEl.value);
    Graph.d3Force('link').distance(() => options.linkDistance);
    Graph.numDimensions(3); // trigger re-heat
  });

  togglePhysicsEl.addEventListener("change", () => {
    const enabled = togglePhysicsEl.checked;
    if (enabled) {
      Graph.d3VelocityDecay(0.3);
    } else {
      Graph.d3VelocityDecay(1); // freeze
    }
  });

  btnFit.addEventListener("click", () => {
    Graph.zoomToFit(600, 40);
  });

  // initial fit
  setTimeout(() => Graph.zoomToFit(800, 60), 500);

  const resizer = document.getElementById('sidebar-resizer');
  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    resizer.classList.add('active');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    let min = 220, max = 600;
    let sidebarLeft = document.querySelector('.sidebar').getBoundingClientRect().left;
    let newW = e.clientX - sidebarLeft;
    if (newW < min) newW = min;
    if (newW > max) newW = max;
    document.documentElement.style.setProperty('--sidebar-width', newW + 'px');
  });

  document.addEventListener('mouseup', (e) => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      resizer.classList.remove('active');
    }
  });
}

window.addEventListener("DOMContentLoaded", main);


