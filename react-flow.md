# xyflow - React Flow & Svelte Flow

xyflow is a powerful open-source library for building node-based UIs, interactive diagrams, flow charts, and workflow editors. The monorepo contains two main packages: `@xyflow/react` (React Flow 12) for React applications and `@xyflow/svelte` (Svelte Flow) for Svelte 5 applications. Both libraries share a common core system (`@xyflow/system`) that handles the fundamental graph operations, viewport management, and edge path calculations.

The library provides a complete solution for creating highly customizable node-based interfaces with features including draggable and selectable nodes, customizable edge connections, viewport controls (pan, zoom, fit view), mini-map navigation, keyboard accessibility, and extensive event handling. React Flow and Svelte Flow are used in production by thousands of companies for building visual programming interfaces, data pipeline editors, state machine visualizers, mind mapping tools, and other interactive diagram applications.

## ReactFlow Component

The main `<ReactFlow />` component is the heart of your React Flow application. It renders nodes and edges, handles user interactions, and manages the viewport. You pass your nodes and edges arrays along with change handlers to make the flow interactive.

```jsx
import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Start Node' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Process Node' } },
  { id: '3', type: 'output', position: { x: 0, y: 200 }, data: { label: 'End Node' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default Flow;
```

## SvelteFlow Component

The `<SvelteFlow />` component is the Svelte 5 equivalent for building node-based UIs. It uses Svelte's reactive stores for nodes and edges management and provides similar functionality to React Flow with Svelte-specific patterns and event handling.

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';

  const nodes = writable([
    {
      id: '1',
      type: 'input',
      data: { label: 'Input Node' },
      position: { x: 0, y: 0 }
    },
    {
      id: '2',
      data: { label: 'Default Node' },
      position: { x: 0, y: 150 }
    },
    {
      id: '3',
      type: 'output',
      data: { label: 'Output Node' },
      position: { x: 0, y: 300 }
    }
  ]);

  const edges = writable([
    { id: 'e1-2', source: '1', target: '2', label: 'Edge 1' },
    { id: 'e2-3', source: '2', target: '3', animated: true }
  ]);
</script>

<div style="height: 100vh; width: 100vw;">
  <SvelteFlow
    {nodes}
    {edges}
    fitView
    on:nodeclick={(event) => console.log('Node clicked:', event.detail.node)}
    on:connect={(event) => {
      const { connection } = event.detail;
      edges.update((eds) => [...eds, { ...connection, id: `e${connection.source}-${connection.target}` }]);
    }}
  >
    <Controls />
    <Background variant={BackgroundVariant.Dots} />
    <MiniMap />
  </SvelteFlow>
</div>
```

## useNodesState and useEdgesState Hooks

These React hooks provide a convenient way to manage nodes and edges state with built-in change handlers. They work like `useState` but include an additional callback for handling node/edge changes from user interactions like dragging, selecting, and deleting.

```jsx
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// Using the convenience hooks
function FlowWithHooks() {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 200, y: 100 }, data: { label: 'Node 2' } },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1-2', source: '1', target: '2' },
  ]);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Programmatically add a node
  const addNode = useCallback(() => {
    const newNode = {
      id: `${Date.now()}`,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Node ${nodes.length + 1}` },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  return (
    <>
      <button onClick={addNode}>Add Node</button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </>
  );
}
```

## useReactFlow Hook

The `useReactFlow` hook returns a `ReactFlowInstance` that provides methods to query and manipulate nodes, edges, and the viewport programmatically. This is essential for building interactive features like fit view, zoom controls, and programmatic node updates.

```jsx
import { useCallback } from 'react';
import { ReactFlow, useReactFlow, ReactFlowProvider } from '@xyflow/react';

function FlowControls() {
  const reactFlow = useReactFlow();

  const onFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlow]);

  const onZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 300 });
  }, [reactFlow]);

  const onZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 300 });
  }, [reactFlow]);

  const onGetNodes = useCallback(() => {
    const nodes = reactFlow.getNodes();
    console.log('Current nodes:', nodes);
  }, [reactFlow]);

  const onUpdateNode = useCallback(() => {
    reactFlow.updateNode('1', {
      data: { label: 'Updated!' },
      style: { backgroundColor: '#ff0072' }
    });
  }, [reactFlow]);

  const onDeleteSelected = useCallback(async () => {
    const selectedNodes = reactFlow.getNodes().filter((n) => n.selected);
    const selectedEdges = reactFlow.getEdges().filter((e) => e.selected);

    const { deletedNodes, deletedEdges } = await reactFlow.deleteElements({
      nodes: selectedNodes,
      edges: selectedEdges,
    });

    console.log('Deleted:', deletedNodes, deletedEdges);
  }, [reactFlow]);

  const onExport = useCallback(() => {
    const flowObject = reactFlow.toObject();
    console.log('Flow as JSON:', JSON.stringify(flowObject, null, 2));
    // Can be saved to localStorage, sent to server, etc.
  }, [reactFlow]);

  return (
    <div className="controls">
      <button onClick={onFitView}>Fit View</button>
      <button onClick={onZoomIn}>Zoom In</button>
      <button onClick={onZoomOut}>Zoom Out</button>
      <button onClick={onGetNodes}>Log Nodes</button>
      <button onClick={onUpdateNode}>Update Node 1</button>
      <button onClick={onDeleteSelected}>Delete Selected</button>
      <button onClick={onExport}>Export</button>
    </div>
  );
}

// Must wrap with ReactFlowProvider to use useReactFlow
function App() {
  return (
    <ReactFlowProvider>
      <FlowControls />
      <ReactFlow nodes={[]} edges={[]} />
    </ReactFlowProvider>
  );
}
```

## useSvelteFlow Hook

The Svelte equivalent of `useReactFlow`, providing methods to manipulate the flow programmatically. It offers viewport control, node/edge querying, and state manipulation functions.

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { SvelteFlow, useSvelteFlow } from '@xyflow/svelte';

  const nodes = writable([
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 200, y: 100 }, data: { label: 'Node 2' } },
  ]);
  const edges = writable([{ id: 'e1-2', source: '1', target: '2' }]);

  const { fitView, zoomIn, zoomOut, getNodes, updateNode, toObject, screenToFlowPosition } = useSvelteFlow();

  function handleFitView() {
    fitView({ padding: 0.2, duration: 500 });
  }

  function handleUpdateNode() {
    updateNode('1', { data: { label: 'Updated Label!' } });
  }

  function handleExport() {
    const flowData = toObject();
    console.log('Exported flow:', flowData);
  }

  function handleAddNodeAtClick(event: MouseEvent) {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    nodes.update((n) => [
      ...n,
      {
        id: `${Date.now()}`,
        position,
        data: { label: 'New Node' },
      },
    ]);
  }
</script>

<div style="height: 100vh;">
  <div class="controls">
    <button on:click={handleFitView}>Fit View</button>
    <button on:click={() => zoomIn()}>Zoom In</button>
    <button on:click={() => zoomOut()}>Zoom Out</button>
    <button on:click={handleUpdateNode}>Update Node</button>
    <button on:click={handleExport}>Export</button>
  </div>

  <SvelteFlow
    {nodes}
    {edges}
    on:paneclick={(e) => handleAddNodeAtClick(e.detail.event)}
  />
</div>
```

## Custom Node Implementation

Custom nodes allow you to create specialized node types with custom rendering, data handling, and connection points. Use the `Handle` component to define where edges can connect.

```jsx
import { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

// Define a typed custom node
type CounterNodeData = {
  initialCount?: number;
  label: string;
};

type CounterNode = Node<CounterNodeData, 'counter'>;

function CounterNode({ data, isConnectable }: NodeProps<CounterNode>) {
  const [count, setCount] = useState(data.initialCount ?? 0);

  return (
    <div className="counter-node" style={{
      padding: 10,
      border: '1px solid #555',
      borderRadius: 5,
      background: 'white'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      <div>
        <strong>{data.label}</strong>
        <p>Count: {count}</p>
        <button
          className="nodrag"
          onClick={() => setCount((c) => c + 1)}
        >
          Increment
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(CounterNode);

// Usage in main flow
import CounterNode from './CounterNode';

const nodeTypes = { counter: CounterNode };

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'counter',
      position: { x: 100, y: 100 },
      data: { label: 'Counter', initialCount: 5 }
    },
  ]);

  return (
    <ReactFlow nodes={nodes} onNodesChange={onNodesChange} nodeTypes={nodeTypes} />
  );
}
```

## Custom Edge Implementation

Custom edges let you create specialized edge visualizations with custom paths, labels, and interactive elements using the EdgeLabelRenderer for positioned content.

```jsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  EdgeProps
} from '@xyflow/react';

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button className="edgebutton" onClick={onEdgeClick}>
            ×
          </button>
          {data?.label && <span style={{ marginLeft: 5 }}>{data.label}</span>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Usage
const edgeTypes = { custom: CustomEdge };

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { label: 'Click × to delete' }
  },
];
```

## Handle Component

The Handle component defines connection points on nodes. You can configure their position, type (source/target), and validation logic. Multiple handles can be added to a single node for complex connection patterns.

```jsx
import { memo } from 'react';
import { Handle, Position, useHandleConnections, useNodesData } from '@xyflow/react';

function MultiHandleNode({ id, data, isConnectable }) {
  // Get connections for a specific handle
  const targetConnections = useHandleConnections({ type: 'target' });

  // Get data from connected source nodes
  const connectedNodesData = useNodesData(
    targetConnections.map((c) => c.source)
  );

  return (
    <div style={{ padding: 10, border: '2px solid #777', borderRadius: 8 }}>
      {/* Multiple target handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input-1"
        style={{ left: '25%', background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="input-2"
        style={{ left: '75%', background: '#555' }}
        isConnectable={isConnectable}
      />

      <div>
        <strong>{data.label}</strong>
        <p>Connections: {targetConnections.length}</p>
        <p>Connected data: {JSON.stringify(connectedNodesData)}</p>
      </div>

      {/* Multiple source handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-1"
        style={{ left: '25%', background: '#ff0072' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-2"
        style={{ left: '75%', background: '#ff0072' }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(MultiHandleNode);
```

## Background Component

The Background component renders a pattern behind the flow that moves with the viewport. It supports dots, lines, and cross patterns with customizable colors and spacing.

```jsx
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';

function FlowWithBackground() {
  return (
    <ReactFlow nodes={[]} edges={[]}>
      {/* Dots pattern (default) */}
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="#aaa"
      />
    </ReactFlow>
  );
}

function FlowWithLines() {
  return (
    <ReactFlow nodes={[]} edges={[]}>
      {/* Lines pattern */}
      <Background
        variant={BackgroundVariant.Lines}
        gap={25}
        lineWidth={1}
        color="#e0e0e0"
      />
    </ReactFlow>
  );
}

function FlowWithCross() {
  return (
    <ReactFlow nodes={[]} edges={[]}>
      {/* Cross pattern */}
      <Background
        variant={BackgroundVariant.Cross}
        gap={30}
        size={3}
        color="#ddd"
        bgColor="#fafafa"
      />
    </ReactFlow>
  );
}
```

## Controls Component

The Controls component provides zoom and viewport manipulation buttons. You can customize which buttons appear, add callbacks, and include custom controls as children.

```jsx
import { ReactFlow, Controls, ControlButton } from '@xyflow/react';
import { FaLock, FaUnlock, FaCamera } from 'react-icons/fa';

function FlowWithControls() {
  const [isLocked, setIsLocked] = useState(false);

  const onScreenshot = () => {
    // Take screenshot logic
    console.log('Screenshot taken');
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodesDraggable={!isLocked}
      nodesConnectable={!isLocked}
      elementsSelectable={!isLocked}
    >
      <Controls
        showZoom={true}
        showFitView={true}
        showInteractive={false}
        position="bottom-left"
        orientation="vertical"
        onZoomIn={() => console.log('Zoomed in')}
        onZoomOut={() => console.log('Zoomed out')}
        onFitView={() => console.log('Fit view')}
      >
        {/* Custom control buttons */}
        <ControlButton onClick={() => setIsLocked(!isLocked)} title="Toggle Lock">
          {isLocked ? <FaLock /> : <FaUnlock />}
        </ControlButton>
        <ControlButton onClick={onScreenshot} title="Screenshot">
          <FaCamera />
        </ControlButton>
      </Controls>
    </ReactFlow>
  );
}
```

## MiniMap Component

The MiniMap component renders a small overview of the entire flow, useful for navigating large graphs. It supports custom node colors, masking, and interactive navigation.

```jsx
import { ReactFlow, MiniMap } from '@xyflow/react';

function FlowWithMiniMap() {
  // Custom color function based on node type or data
  const nodeColor = (node) => {
    switch (node.type) {
      case 'input':
        return '#6ede87';
      case 'output':
        return '#ff0072';
      case 'custom':
        return '#0041d0';
      default:
        return '#eee';
    }
  };

  return (
    <ReactFlow nodes={nodes} edges={edges}>
      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={3}
        zoomable
        pannable
        position="bottom-right"
        style={{
          backgroundColor: '#f0f0f0',
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
    </ReactFlow>
  );
}
```

## NodeToolbar Component

The NodeToolbar renders a floating toolbar attached to selected nodes. It's perfect for providing context-specific actions without cluttering the node itself.

```jsx
import { memo } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

function NodeWithToolbar({ data, selected }) {
  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={10}
        align="center"
      >
        <button onClick={() => console.log('Edit')}>Edit</button>
        <button onClick={() => console.log('Copy')}>Copy</button>
        <button onClick={() => console.log('Delete')}>Delete</button>
      </NodeToolbar>

      <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <Handle type="target" position={Position.Left} />
        <div>{data.label}</div>
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}

export default memo(NodeWithToolbar);
```

## NodeResizer Component

The NodeResizer component adds resize handles to nodes, allowing users to interactively change node dimensions. It supports minimum/maximum constraints and aspect ratio locking.

```jsx
import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

function ResizableNode({ data, selected }) {
  return (
    <>
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={100}
        minHeight={50}
        maxWidth={500}
        maxHeight={300}
        keepAspectRatio={false}
        onResizeStart={() => console.log('Resize started')}
        onResize={(event, params) => console.log('Resizing:', params)}
        onResizeEnd={(event, params) => console.log('Resize ended:', params)}
      />

      <div style={{
        width: '100%',
        height: '100%',
        padding: 10,
        background: 'white',
        border: '1px solid #ddd'
      }}>
        <Handle type="target" position={Position.Left} />
        <div>{data.label}</div>
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}

export default memo(ResizableNode);

// Usage with initial dimensions
const nodes = [
  {
    id: '1',
    type: 'resizable',
    position: { x: 100, y: 100 },
    data: { label: 'Resize me!' },
    style: { width: 200, height: 100 },
  },
];
```

## Edge Path Utilities

xyflow provides utility functions for calculating edge paths. These are useful when creating custom edges or need to compute path information outside of edge components.

```jsx
import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  getSimpleBezierPath,
  Position,
} from '@xyflow/react';

// Calculate a bezier curve path
const [bezierPath, bezierLabelX, bezierLabelY] = getBezierPath({
  sourceX: 0,
  sourceY: 0,
  sourcePosition: Position.Right,
  targetX: 200,
  targetY: 100,
  targetPosition: Position.Left,
  curvature: 0.25, // optional, controls curve intensity
});
console.log('Bezier path:', bezierPath);
// Output: "M0,0 C50,0 150,100 200,100"

// Calculate a smooth step path (right angles with rounded corners)
const [smoothPath, smoothLabelX, smoothLabelY, offsetX, offsetY] = getSmoothStepPath({
  sourceX: 0,
  sourceY: 0,
  sourcePosition: Position.Right,
  targetX: 200,
  targetY: 100,
  targetPosition: Position.Left,
  borderRadius: 10,
  offset: 20, // offset from source/target
});

// Calculate a straight line path
const [straightPath, straightLabelX, straightLabelY] = getStraightPath({
  sourceX: 0,
  sourceY: 0,
  targetX: 200,
  targetY: 100,
});

// Use in custom edge component
function CustomEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return <path d={path} stroke="#222" strokeWidth={2} fill="none" />;
}
```

## Graph Utility Functions

xyflow exports several utility functions for working with nodes and edges, including finding connected elements, adding edges, and calculating bounds.

```jsx
import {
  addEdge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  getNodesBounds,
  reconnectEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// Add an edge to existing edges array
const newEdges = addEdge(
  { source: '1', target: '2', id: 'e1-2' },
  existingEdges
);

// Find all edges connected to specific nodes
const connectedEdges = getConnectedEdges(
  [{ id: '1' }, { id: '2' }],
  edges
);

// Get all nodes that have edges pointing to this node
const incomers = getIncomers(
  { id: '2' },
  nodes,
  edges
);
console.log('Nodes pointing to node 2:', incomers);

// Get all nodes that this node points to
const outgoers = getOutgoers(
  { id: '1' },
  nodes,
  edges
);
console.log('Nodes that node 1 points to:', outgoers);

// Calculate bounding box of specific nodes
const bounds = getNodesBounds([
  { id: '1', position: { x: 0, y: 0 }, measured: { width: 100, height: 50 } },
  { id: '2', position: { x: 200, y: 100 }, measured: { width: 100, height: 50 } },
]);
console.log('Bounds:', bounds); // { x, y, width, height }

// Apply changes to nodes (used internally by useNodesState)
const updatedNodes = applyNodeChanges(
  [
    { type: 'position', id: '1', position: { x: 100, y: 200 } },
    { type: 'select', id: '2', selected: true },
    { type: 'remove', id: '3' },
  ],
  nodes
);
```

## Event Handlers

ReactFlow supports comprehensive event handling for nodes, edges, connections, and viewport changes. Events provide access to the underlying mouse events and relevant flow data.

```jsx
import { ReactFlow, useCallback } from '@xyflow/react';

function FlowWithEvents() {
  // Node events
  const onNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node.id, node.data);
  }, []);

  const onNodeDragStart = useCallback((event, node) => {
    console.log('Started dragging:', node.id);
  }, []);

  const onNodeDrag = useCallback((event, node) => {
    console.log('Dragging:', node.position);
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    console.log('Stopped dragging:', node.id, 'at', node.position);
  }, []);

  const onNodeDoubleClick = useCallback((event, node) => {
    console.log('Double clicked:', node.id);
  }, []);

  // Edge events
  const onEdgeClick = useCallback((event, edge) => {
    console.log('Edge clicked:', edge.id);
  }, []);

  // Connection events
  const onConnect = useCallback((connection) => {
    console.log('New connection:', connection);
  }, []);

  const onConnectStart = useCallback((event, params) => {
    console.log('Connection started from:', params.nodeId, params.handleId);
  }, []);

  const onConnectEnd = useCallback((event, connectionState) => {
    console.log('Connection ended:', connectionState);
  }, []);

  // Viewport events
  const onMoveStart = useCallback((event, viewport) => {
    console.log('Viewport move started:', viewport);
  }, []);

  const onMove = useCallback((event, viewport) => {
    console.log('Viewport:', viewport.x, viewport.y, viewport.zoom);
  }, []);

  const onMoveEnd = useCallback((event, viewport) => {
    console.log('Viewport move ended:', viewport);
  }, []);

  // Pane events
  const onPaneClick = useCallback((event) => {
    console.log('Pane clicked at:', event.clientX, event.clientY);
  }, []);

  // Selection events
  const onSelectionChange = useCallback(({ nodes, edges }) => {
    console.log('Selected nodes:', nodes.map(n => n.id));
    console.log('Selected edges:', edges.map(e => e.id));
  }, []);

  // Delete events
  const onNodesDelete = useCallback((deletedNodes) => {
    console.log('Nodes deleted:', deletedNodes.map(n => n.id));
  }, []);

  const onEdgesDelete = useCallback((deletedEdges) => {
    console.log('Edges deleted:', deletedEdges.map(e => e.id));
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={onNodeClick}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onNodeDoubleClick={onNodeDoubleClick}
      onEdgeClick={onEdgeClick}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onMoveStart={onMoveStart}
      onMove={onMove}
      onMoveEnd={onMoveEnd}
      onPaneClick={onPaneClick}
      onSelectionChange={onSelectionChange}
      onNodesDelete={onNodesDelete}
      onEdgesDelete={onEdgesDelete}
    />
  );
}
```

## Connection Validation

Control which connections are valid using the `isValidConnection` prop. This allows you to enforce business logic like preventing self-connections, limiting connection counts, or requiring specific node types.

```jsx
import { ReactFlow, useCallback, getConnectedEdges } from '@xyflow/react';

function FlowWithValidation() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const isValidConnection = useCallback(
    (connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Get source and target nodes
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Only allow connections from output to input nodes
      if (sourceNode?.type === 'output') {
        return false;
      }
      if (targetNode?.type === 'input') {
        return false;
      }

      // Limit connections per handle (max 2)
      const targetEdges = getConnectedEdges([targetNode], edges);
      const targetHandleEdges = targetEdges.filter(
        (e) => e.target === connection.target && e.targetHandle === connection.targetHandle
      );
      if (targetHandleEdges.length >= 2) {
        return false;
      }

      // Prevent duplicate connections
      const existingEdge = edges.find(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      if (existingEdge) {
        return false;
      }

      return true;
    },
    [nodes, edges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
      isValidConnection={isValidConnection}
      connectionLineStyle={{ stroke: '#ddd' }}
    />
  );
}
```

## Viewport Control

Control the viewport programmatically using viewport helper functions. This is useful for implementing custom navigation, fit view, and zoom behavior.

```jsx
import { ReactFlow, useReactFlow, Panel } from '@xyflow/react';

function ViewportControls() {
  const {
    fitView,
    setViewport,
    getViewport,
    setCenter,
    zoomIn,
    zoomOut,
    fitBounds
  } = useReactFlow();

  // Fit all nodes in view with animation
  const handleFitView = () => {
    fitView({
      padding: 0.2,
      duration: 800,
      minZoom: 0.5,
      maxZoom: 2,
    });
  };

  // Center on specific coordinates
  const handleCenterOnPoint = () => {
    setCenter(500, 300, { zoom: 1.5, duration: 500 });
  };

  // Set exact viewport
  const handleSetViewport = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  };

  // Get current viewport
  const handleLogViewport = () => {
    const viewport = getViewport();
    console.log('Current viewport:', viewport);
  };

  // Fit to specific bounds
  const handleFitBounds = () => {
    fitBounds(
      { x: 100, y: 100, width: 400, height: 300 },
      { padding: 0.1, duration: 500 }
    );
  };

  // Zoom controls
  const handleZoomIn = () => zoomIn({ duration: 200 });
  const handleZoomOut = () => zoomOut({ duration: 200 });

  return (
    <Panel position="top-left">
      <button onClick={handleFitView}>Fit View</button>
      <button onClick={handleCenterOnPoint}>Center at (500,300)</button>
      <button onClick={handleSetViewport}>Reset Viewport</button>
      <button onClick={handleLogViewport}>Log Viewport</button>
      <button onClick={handleFitBounds}>Fit Bounds</button>
      <button onClick={handleZoomIn}>Zoom In</button>
      <button onClick={handleZoomOut}>Zoom Out</button>
    </Panel>
  );
}
```

## Sub Flows (Nested Nodes)

Create hierarchical node structures using parent-child relationships. Child nodes are positioned relative to their parent and move together with it.

```jsx
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

const initialNodes = [
  // Parent node (group)
  {
    id: 'group-1',
    type: 'group',
    position: { x: 0, y: 0 },
    style: {
      width: 400,
      height: 300,
      backgroundColor: 'rgba(240, 240, 240, 0.5)',
      border: '1px dashed #999'
    },
    data: { label: 'Group 1' },
  },
  // Child nodes with parentId
  {
    id: 'child-1',
    position: { x: 20, y: 40 }, // Relative to parent
    parentId: 'group-1',
    extent: 'parent', // Constrain to parent bounds
    data: { label: 'Child Node 1' },
  },
  {
    id: 'child-2',
    position: { x: 200, y: 40 },
    parentId: 'group-1',
    extent: 'parent',
    data: { label: 'Child Node 2' },
  },
  {
    id: 'child-3',
    position: { x: 100, y: 150 },
    parentId: 'group-1',
    extent: 'parent',
    data: { label: 'Child Node 3' },
  },
  // Node outside the group
  {
    id: 'external-1',
    position: { x: 500, y: 100 },
    data: { label: 'External Node' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: 'child-1', target: 'child-2' },
  { id: 'e2-3', source: 'child-2', target: 'child-3' },
  { id: 'e3-ext', source: 'child-3', target: 'external-1' },
];

function SubFlowExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    />
  );
}
```

## useHandleConnections and useNodesData Hooks

These hooks enable data flow between nodes by providing access to connection information and connected node data. Useful for building reactive node networks.

```jsx
import { memo } from 'react';
import { Handle, Position, useHandleConnections, useNodesData } from '@xyflow/react';

function SumNode({ id, data }) {
  // Get all connections to this node's target handle
  const connections = useHandleConnections({ type: 'target' });

  // Get data from all connected source nodes
  const connectedNodesData = useNodesData(connections.map((c) => c.source));

  // Calculate sum of values from connected nodes
  const sum = connectedNodesData.reduce((acc, nodeData) => {
    return acc + (nodeData?.data?.value || 0);
  }, 0);

  return (
    <div style={{ padding: 15, border: '2px solid #0041d0', borderRadius: 5 }}>
      <Handle type="target" position={Position.Top} />

      <div>
        <strong>Sum Node</strong>
        <p>Connected: {connections.length} nodes</p>
        <p>Sum: {sum}</p>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function NumberNode({ data }) {
  return (
    <div style={{ padding: 15, border: '2px solid #ff0072', borderRadius: 5 }}>
      <div>
        <strong>Number: {data.value}</strong>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Usage
const nodeTypes = { sum: memo(SumNode), number: memo(NumberNode) };

const nodes = [
  { id: '1', type: 'number', position: { x: 0, y: 0 }, data: { value: 10 } },
  { id: '2', type: 'number', position: { x: 200, y: 0 }, data: { value: 20 } },
  { id: '3', type: 'sum', position: { x: 100, y: 150 }, data: {} },
];

const edges = [
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-3', source: '2', target: '3' },
];
```

## Summary

xyflow (React Flow and Svelte Flow) provides a comprehensive solution for building interactive node-based applications. The core use cases include visual programming interfaces where users create logic flows by connecting nodes, data pipeline editors for ETL and workflow automation, state machine visualizers for application state management, mind mapping and brainstorming tools, org charts and hierarchy visualizations, and any application requiring drag-and-drop graph editing. The library's strength lies in its flexibility - you can start with built-in components for rapid prototyping and progressively customize every aspect as your requirements grow.

Integration patterns typically involve wrapping your application with a Provider component (ReactFlowProvider or SvelteFlowProvider) to enable hooks access throughout your component tree. State management can range from simple useState/writable stores for small applications to integration with Zustand, Redux, or other state management libraries for complex applications. The library exports all necessary types for TypeScript applications, and the hook-based API makes it easy to build reusable custom nodes and edges. For production applications, consider implementing proper viewport persistence, undo/redo functionality using the change handlers, and optimizing performance with node virtualization (onlyRenderVisibleElements) for large graphs.
