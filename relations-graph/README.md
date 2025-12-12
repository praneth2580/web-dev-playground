# Relations Graph (3D Visualizer)

Visualize real-life entities (people, computers, orgs) and their relationships in an interactive 3D force-directed graph.

## Quick Start

- Open `index.html` in a modern browser (Chrome/Edge/Firefox). No build step required.
- Or serve the folder locally (recommended for file access):

```bash
# from this directory
python3 -m http.server 5173
# then open http://localhost:5173
```

## Features

- Add/update entities (id, label, type)
- Add relations (source id, target id, relation name)
- 3D graph with zoom/pan, node focus on click
- Import/Export JSON, sample dataset, localStorage persistence
- Controls: toggle physics, adjust link distance, zoom-to-fit

## Data Format

```json
{
  "nodes": [
    { "id": "alice", "label": "Alice", "type": "person" }
  ],
  "links": [
    { "source": "alice", "target": "server-01", "relation": "uses" }
  ]
}
```

- `id` must be unique.
- `type` is optional; affects color.
- `relation` is optional; shown as link label.

## Notes

- Data is saved under `localStorage` and restored on reload.
- You can paste raw JSON in the sidebar and apply it.
- Built on [`3d-force-graph`](https://github.com/vasturiano/3d-force-graph) and `three.js` via CDN.

## Next Ideas

- Grouping by type, filtering, search
- Node/edge deletion, edit dialogs
- Layout presets and 2D/3D toggle
- Backend sync for multi-user datasets
