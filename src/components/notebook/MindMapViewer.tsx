"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Grid3X3,
  GitBranch,
  Circle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";

// ==================== Types ====================

interface MindMapNode {
  id: string;
  topic: string;
  subtopics?: string[];
  children?: MindMapNode[];
  description?: string;
  icon?: string;
  color?: string;
}

interface MindMapData {
  centralTopic: string;
  description?: string;
  branches: Array<{
    topic: string;
    subtopics?: string[];
    children?: MindMapNode[];
    description?: string;
    icon?: string;
  }>;
}

interface Position {
  x: number;
  y: number;
}

interface NodeLayout {
  id: string;
  topic: string;
  subtopics?: string[];
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parentId: string | null;
  color: string;
  angle?: number;
  children: NodeLayout[];
  isExpanded: boolean;
  isVisible: boolean;
}

type ViewMode = "radial" | "tree" | "organic";

// ==================== Color Palettes ====================

const BRANCH_COLORS = [
  { primary: "#8b5cf6", gradient: "from-violet-500 to-purple-600", bg: "rgba(139, 92, 246, 0.15)", glow: "rgba(139, 92, 246, 0.4)" },
  { primary: "#ec4899", gradient: "from-pink-500 to-rose-600", bg: "rgba(236, 72, 153, 0.15)", glow: "rgba(236, 72, 153, 0.4)" },
  { primary: "#f59e0b", gradient: "from-amber-500 to-orange-600", bg: "rgba(245, 158, 11, 0.15)", glow: "rgba(245, 158, 11, 0.4)" },
  { primary: "#10b981", gradient: "from-emerald-500 to-teal-600", bg: "rgba(16, 185, 129, 0.15)", glow: "rgba(16, 185, 129, 0.4)" },
  { primary: "#3b82f6", gradient: "from-blue-500 to-indigo-600", bg: "rgba(59, 130, 246, 0.15)", glow: "rgba(59, 130, 246, 0.4)" },
  { primary: "#ef4444", gradient: "from-red-500 to-rose-600", bg: "rgba(239, 68, 68, 0.15)", glow: "rgba(239, 68, 68, 0.4)" },
  { primary: "#06b6d4", gradient: "from-cyan-500 to-blue-600", bg: "rgba(6, 182, 212, 0.15)", glow: "rgba(6, 182, 212, 0.4)" },
  { primary: "#84cc16", gradient: "from-lime-500 to-green-600", bg: "rgba(132, 204, 22, 0.15)", glow: "rgba(132, 204, 22, 0.4)" },
];

const CENTER_COLOR = {
  primary: "#f59e0b",
  gradient: "from-amber-400 via-orange-500 to-red-500",
  bg: "rgba(245, 158, 11, 0.2)",
  glow: "rgba(245, 158, 11, 0.5)",
};

// ==================== Utility Functions ====================

function generateNodeId(): string {
  return `node-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateTextWidth(text: string, fontSize: number = 14): number {
  // Approximate character width calculation
  return Math.min(text.length * (fontSize * 0.6), 200);
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Position {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Generate curved path between two points
function generateCurvedPath(
  start: Position,
  end: Position,
  curvature: number = 0.3
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Calculate perpendicular offset for curve control point
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular vector
  const px = -dy / length;
  const py = dx / length;

  // Control point with curvature
  const controlX = midX + px * length * curvature;
  const controlY = midY + py * length * curvature;

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

// Generate organic bezier path
function generateOrganicPath(start: Position, end: Position): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const cp1x = start.x + dx * 0.4;
  const cp1y = start.y + dy * 0.1;
  const cp2x = start.x + dx * 0.6;
  const cp2y = end.y - dy * 0.1;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

// ==================== Layout Calculators ====================

function calculateRadialLayout(
  data: MindMapData,
  centerX: number,
  centerY: number,
  expandedNodes: Set<string>
): NodeLayout[] {
  const layouts: NodeLayout[] = [];
  const branchCount = data.branches.length;

  // Central node
  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: centerX,
    y: centerY,
    width: 180,
    height: 60,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Branch nodes in radial layout
  const baseRadius = 220;
  const angleStep = 360 / branchCount;

  data.branches.forEach((branch, index) => {
    const angle = index * angleStep;
    const pos = polarToCartesian(centerX, centerY, baseRadius, angle);
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: pos.x,
      y: pos.y,
      width: 160,
      height: 50,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      angle,
      children: [],
      isExpanded,
      isVisible: true,
    };

    // Add subtopic nodes if branch is expanded
    if (isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      const subtopicRadius = 120;
      const subtopicAngleSpread = Math.min(60, 20 * branch.subtopics.length);
      const startAngle = angle - subtopicAngleSpread / 2;
      const subtopicAngleStep = branch.subtopics.length > 1
        ? subtopicAngleSpread / (branch.subtopics.length - 1)
        : 0;

      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicAngle = branch.subtopics!.length === 1
          ? angle
          : startAngle + subIndex * subtopicAngleStep;
        const subPos = polarToCartesian(pos.x, pos.y, subtopicRadius, subtopicAngle);

        const subtopicNode: NodeLayout = {
          id: `${branchId}-sub-${subIndex}`,
          topic: subtopic,
          x: subPos.x,
          y: subPos.y,
          width: 140,
          height: 36,
          depth: 2,
          parentId: branchId,
          color: colorSet.primary,
          angle: subtopicAngle,
          children: [],
          isExpanded: false,
          isVisible: true,
        };
        branchNode.children.push(subtopicNode);
        layouts.push(subtopicNode);
      });
    }

    layouts.push(branchNode);
  });

  return layouts;
}

function calculateTreeLayout(
  data: MindMapData,
  startX: number,
  startY: number,
  expandedNodes: Set<string>
): NodeLayout[] {
  const layouts: NodeLayout[] = [];
  const horizontalSpacing = 280;
  const verticalSpacing = 100;

  // Central node (left side)
  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: startX + 100,
    y: startY + (data.branches.length * verticalSpacing) / 2,
    width: 180,
    height: 60,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Calculate total height needed
  let currentY = startY;

  data.branches.forEach((branch, index) => {
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);
    const subtopicCount = isExpanded && branch.subtopics ? branch.subtopics.length : 0;

    // Calculate branch position
    const branchHeight = Math.max(1, subtopicCount) * 50;
    const branchCenterY = currentY + branchHeight / 2;

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: startX + 100 + horizontalSpacing,
      y: branchCenterY,
      width: 160,
      height: 50,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      children: [],
      isExpanded,
      isVisible: true,
    };

    // Add subtopics
    if (isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicNode: NodeLayout = {
          id: `${branchId}-sub-${subIndex}`,
          topic: subtopic,
          x: startX + 100 + horizontalSpacing * 2,
          y: currentY + subIndex * 50 + 25,
          width: 140,
          height: 36,
          depth: 2,
          parentId: branchId,
          color: colorSet.primary,
          children: [],
          isExpanded: false,
          isVisible: true,
        };
        branchNode.children.push(subtopicNode);
        layouts.push(subtopicNode);
      });
    }

    layouts.push(branchNode);
    currentY += branchHeight + 40;
  });

  return layouts;
}

function calculateOrganicLayout(
  data: MindMapData,
  centerX: number,
  centerY: number,
  expandedNodes: Set<string>
): NodeLayout[] {
  const layouts: NodeLayout[] = [];
  const branchCount = data.branches.length;

  // Central node with slight offset for visual interest
  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: centerX,
    y: centerY,
    width: 200,
    height: 70,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Organic placement with varying radii and angles
  const goldenAngle = 137.5; // Golden angle for natural distribution

  data.branches.forEach((branch, index) => {
    // Use golden angle for natural spiral distribution
    const angle = index * goldenAngle;
    // Varying radius based on index for organic feel
    const radiusVariation = 1 + (Math.sin(index * 0.7) * 0.2);
    const baseRadius = 200 * radiusVariation + (index % 2) * 40;
    const pos = polarToCartesian(centerX, centerY, baseRadius, angle);

    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: pos.x,
      y: pos.y,
      width: 150 + (index % 3) * 10,
      height: 45 + (index % 2) * 10,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      angle,
      children: [],
      isExpanded,
      isVisible: true,
    };

    // Organic subtopic placement
    if (isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicAngle = angle + (subIndex - branch.subtopics!.length / 2) * 25;
        const subtopicRadius = 100 + subIndex * 15;
        const subPos = polarToCartesian(pos.x, pos.y, subtopicRadius, subtopicAngle);

        const subtopicNode: NodeLayout = {
          id: `${branchId}-sub-${subIndex}`,
          topic: subtopic,
          x: subPos.x,
          y: subPos.y,
          width: 130,
          height: 34,
          depth: 2,
          parentId: branchId,
          color: colorSet.primary,
          angle: subtopicAngle,
          children: [],
          isExpanded: false,
          isVisible: true,
        };
        branchNode.children.push(subtopicNode);
        layouts.push(subtopicNode);
      });
    }

    layouts.push(branchNode);
  });

  return layouts;
}

// ==================== SVG Components ====================

interface ConnectionLineProps {
  start: Position;
  end: Position;
  color: string;
  depth: number;
  viewMode: ViewMode;
  animated?: boolean;
}

function ConnectionLine({ start, end, color, depth, viewMode, animated = true }: ConnectionLineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [start, end]);

  const path = useMemo(() => {
    if (viewMode === "tree") {
      // Elbow connection for tree view
      const midX = (start.x + end.x) / 2;
      return `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`;
    } else if (viewMode === "organic") {
      return generateOrganicPath(start, end);
    } else {
      return generateCurvedPath(start, end, depth === 1 ? 0.15 : 0.25);
    }
  }, [start, end, viewMode, depth]);

  const strokeWidth = depth === 1 ? 3 : 2;
  const opacity = depth === 1 ? 0.8 : 0.5;

  return (
    <g>
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
        opacity={0.15}
        filter="blur(4px)"
      />
      {/* Main line */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
        strokeDasharray={animated ? pathLength : undefined}
        strokeDashoffset={animated ? 0 : undefined}
        style={{
          transition: animated ? "stroke-dashoffset 0.8s ease-out" : undefined,
        }}
      />
      {/* Animated dot */}
      {animated && depth === 1 && (
        <circle r="3" fill={color}>
          <animateMotion dur="3s" repeatCount="indefinite">
            <mpath href={`#${path}`} />
          </animateMotion>
        </circle>
      )}
    </g>
  );
}

interface MindMapNodeProps {
  node: NodeLayout;
  onToggleExpand: (nodeId: string) => void;
  onNodeClick: (node: NodeLayout) => void;
  isHovered: boolean;
  onHover: (nodeId: string | null) => void;
  viewMode: ViewMode;
}

function MindMapNodeComponent({
  node,
  onToggleExpand,
  onNodeClick,
  isHovered,
  onHover,
  viewMode,
}: MindMapNodeProps) {
  const hasChildren = node.subtopics && node.subtopics.length > 0;
  const colorSet = node.depth === 0
    ? CENTER_COLOR
    : BRANCH_COLORS.find(c => c.primary === node.color) || BRANCH_COLORS[0];

  // Different styling based on depth
  const getNodeStyle = () => {
    if (node.depth === 0) {
      return {
        background: `linear-gradient(135deg, ${colorSet.primary}, #ea580c)`,
        boxShadow: isHovered
          ? `0 0 30px ${colorSet.glow}, 0 0 60px ${colorSet.glow}`
          : `0 8px 32px ${colorSet.glow}`,
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      };
    } else if (node.depth === 1) {
      return {
        background: isHovered
          ? `linear-gradient(135deg, ${colorSet.primary}40, ${colorSet.primary}20)`
          : colorSet.bg,
        border: `2px solid ${colorSet.primary}60`,
        boxShadow: isHovered
          ? `0 0 20px ${colorSet.glow}`
          : `0 4px 16px rgba(0,0,0,0.2)`,
        transform: isHovered ? "scale(1.03)" : "scale(1)",
      };
    } else {
      return {
        background: `${colorSet.bg}`,
        border: `1px solid ${colorSet.primary}40`,
        boxShadow: isHovered
          ? `0 0 12px ${colorSet.glow}`
          : "0 2px 8px rgba(0,0,0,0.15)",
        transform: isHovered ? "scale(1.02)" : "scale(1)",
      };
    }
  };

  const style = getNodeStyle();

  return (
    <foreignObject
      x={node.x - node.width / 2}
      y={node.y - node.height / 2}
      width={node.width}
      height={node.height}
      style={{ overflow: "visible" }}
    >
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-out"
        style={{
          ...style,
          borderRadius: node.depth === 0 ? "20px" : node.depth === 1 ? "16px" : "12px",
          padding: node.depth === 0 ? "16px 24px" : node.depth === 1 ? "12px 20px" : "8px 16px",
        }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => {
          if (hasChildren && node.depth === 1) {
            onToggleExpand(node.id);
          } else {
            onNodeClick(node);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Expand/collapse indicator for branch nodes */}
          {hasChildren && node.depth === 1 && (
            <button
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: colorSet.primary }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: colorSet.primary }} />
              )}
            </button>
          )}

          {/* Node text */}
          <span
            className={`truncate ${
              node.depth === 0
                ? "text-white font-bold text-lg"
                : node.depth === 1
                  ? "font-semibold text-base"
                  : "text-sm"
            }`}
            style={{
              color: node.depth === 0 ? "#fff" : colorSet.primary,
              textShadow: node.depth === 0 ? "0 2px 4px rgba(0,0,0,0.2)" : undefined,
            }}
            title={node.topic}
          >
            {node.topic}
          </span>

          {/* Subtopic count badge */}
          {hasChildren && node.depth === 1 && !node.isExpanded && (
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${colorSet.primary}30`,
                color: colorSet.primary,
              }}
            >
              {node.subtopics!.length}
            </span>
          )}
        </div>
      </div>
    </foreignObject>
  );
}

// ==================== Main Component ====================

interface AdvancedMindMapViewerProps {
  content: Record<string, unknown>;
}

export default function AdvancedMindMapViewer({ content }: AdvancedMindMapViewerProps) {
  // Parse mind map data
  const mindMapData = useMemo<MindMapData | null>(() => {
    const rawContent = content as Record<string, unknown>;
    const nestedContent = rawContent?.content as MindMapData | undefined;

    const centralTopic = (rawContent?.centralTopic as string) || nestedContent?.centralTopic;
    const branches = (rawContent?.branches as MindMapData["branches"]) || nestedContent?.branches || [];

    if (!centralTopic || branches.length === 0) {
      return null;
    }

    return {
      centralTopic,
      description: (rawContent?.description as string) || nestedContent?.description,
      branches,
    };
  }, [content]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("radial");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeLayout | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      };

      updateDimensions();
      const observer = new ResizeObserver(updateDimensions);
      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }
  }, []);

  // Calculate layout
  const nodeLayouts = useMemo(() => {
    if (!mindMapData) return [];

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    switch (viewMode) {
      case "radial":
        return calculateRadialLayout(mindMapData, centerX, centerY, expandedNodes);
      case "tree":
        return calculateTreeLayout(mindMapData, 50, 50, expandedNodes);
      case "organic":
        return calculateOrganicLayout(mindMapData, centerX, centerY, expandedNodes);
      default:
        return calculateRadialLayout(mindMapData, centerX, centerY, expandedNodes);
    }
  }, [mindMapData, viewMode, dimensions, expandedNodes]);

  // Generate connections
  const connections = useMemo(() => {
    const conns: Array<{
      start: Position;
      end: Position;
      color: string;
      depth: number;
    }> = [];

    nodeLayouts.forEach((node) => {
      if (node.parentId) {
        const parent = nodeLayouts.find((n) => n.id === node.parentId);
        if (parent) {
          conns.push({
            start: { x: parent.x, y: parent.y },
            end: { x: node.x, y: node.y },
            color: node.color,
            depth: node.depth,
          });
        }
      }
    });

    return conns;
  }, [nodeLayouts]);

  // Pan/zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  // Toggle node expansion
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Export as PNG
  const exportAsPng = useCallback(async () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width * 2;
      canvas.height = dimensions.height * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement("a");
        link.download = "mindmap.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [dimensions]);

  // Expand all branches
  const expandAll = useCallback(() => {
    if (!mindMapData) return;
    const allBranchIds = mindMapData.branches.map((_, i) => `branch-${i}`);
    setExpandedNodes(new Set(allBranchIds));
  }, [mindMapData]);

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  if (!mindMapData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/50">
        <Sparkles className="w-12 h-12 mb-4 animate-pulse" />
        <p>Mind map is being generated...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "radial"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/60 hover:text-white/80"
              }`}
              onClick={() => setViewMode("radial")}
              title="Radial View"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "tree"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/60 hover:text-white/80"
              }`}
              onClick={() => setViewMode("tree")}
              title="Tree View"
            >
              <GitBranch className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "organic"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white/60 hover:text-white/80"
              }`}
              onClick={() => setViewMode("organic")}
              title="Organic View"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-white/50 text-sm min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={resetView}
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse all */}
          <button
            className="px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            onClick={expandAll}
            title="Expand All"
          >
            <Layers className="w-4 h-4" />
            Expand All
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            onClick={collapseAll}
            title="Collapse All"
          >
            <Grid3X3 className="w-4 h-4" />
            Collapse
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Export */}
          <button
            className="px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            onClick={exportAsPng}
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Definitions */}
          <defs>
            {/* Glow filters */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for center node */}
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Connection lines */}
          <g className="connections">
            {connections.map((conn, index) => (
              <ConnectionLine
                key={index}
                start={conn.start}
                end={conn.end}
                color={conn.color}
                depth={conn.depth}
                viewMode={viewMode}
              />
            ))}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodeLayouts.map((node) => (
              <MindMapNodeComponent
                key={node.id}
                node={node}
                onToggleExpand={toggleExpand}
                onNodeClick={setSelectedNode}
                isHovered={hoveredNode === node.id}
                onHover={setHoveredNode}
                viewMode={viewMode}
              />
            ))}
          </g>
        </svg>

        {/* Node count indicator */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white/60 text-sm">
          <span className="text-white font-medium">{mindMapData.branches.length}</span> branches
          {" · "}
          <span className="text-white font-medium">
            {mindMapData.branches.reduce((sum, b) => sum + (b.subtopics?.length || 0), 0)}
          </span>{" "}
          subtopics
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white/60 text-xs">
          <div className="flex items-center gap-4">
            <span>🖱️ Drag to pan</span>
            <span>🔍 Scroll to zoom</span>
            <span>👆 Click nodes to expand</span>
          </div>
        </div>
      </div>

      {/* Selected node detail panel */}
      {selectedNode && selectedNode.depth > 0 && (
        <div className="absolute top-20 right-4 w-72 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <h3
              className="font-semibold text-lg"
              style={{ color: selectedNode.color }}
            >
              {selectedNode.topic}
            </h3>
            <button
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </button>
          </div>

          {selectedNode.description && (
            <p className="text-white/70 text-sm mb-3">{selectedNode.description}</p>
          )}

          {selectedNode.subtopics && selectedNode.subtopics.length > 0 && (
            <div>
              <h4 className="text-white/50 text-xs uppercase tracking-wider mb-2">
                Subtopics ({selectedNode.subtopics.length})
              </h4>
              <ul className="space-y-1">
                {selectedNode.subtopics.map((sub, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-white/70 text-sm"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    {sub}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
