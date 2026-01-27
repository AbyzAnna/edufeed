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

// Generate smooth curved path between two points with better control
function generateCurvedPath(
  start: Position,
  end: Position,
  curvature: number = 0.3,
  depth: number = 1
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // For center-to-branch connections, use smooth S-curve
  if (depth === 1) {
    // Calculate control points for a smooth bezier
    const cp1x = start.x + dx * 0.4;
    const cp1y = start.y + dy * 0.15;
    const cp2x = start.x + dx * 0.6;
    const cp2y = end.y - dy * 0.15;
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }

  // For branch-to-subtopic, use quadratic curve
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Perpendicular offset for gentle curve
  const px = -dy / length;
  const py = dx / length;
  const curveOffset = length * curvature * 0.5;

  const controlX = midX + px * curveOffset;
  const controlY = midY + py * curveOffset;

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

// Generate organic bezier path with natural flow
function generateOrganicPath(start: Position, end: Position, depth: number = 1): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // Organic curves follow the natural flow direction
  const tension = depth === 1 ? 0.35 : 0.25;

  const cp1x = start.x + dx * tension;
  const cp1y = start.y + dy * 0.1;
  const cp2x = end.x - dx * tension;
  const cp2y = end.y - dy * 0.1;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

// Generate tree-style elbow path with rounded corners
function generateTreePath(start: Position, end: Position, depth: number = 1): string {
  const dx = end.x - start.x;
  const midX = start.x + dx * 0.5;
  const cornerRadius = Math.min(15, Math.abs(end.y - start.y) / 4, Math.abs(dx) / 4);

  if (Math.abs(end.y - start.y) < cornerRadius * 2 || cornerRadius < 2) {
    // Nearly horizontal - just use straight line with slight curve
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const direction = end.y > start.y ? 1 : -1;

  // Create rounded elbow
  return `M ${start.x} ${start.y}
          H ${midX - cornerRadius}
          Q ${midX} ${start.y} ${midX} ${start.y + direction * cornerRadius}
          V ${end.y - direction * cornerRadius}
          Q ${midX} ${end.y} ${midX + cornerRadius} ${end.y}
          H ${end.x}`;
}

// ==================== Layout Calculators ====================

// Calculate node width based on text length
function calculateNodeWidth(text: string, depth: number): number {
  const charWidth = depth === 0 ? 10 : depth === 1 ? 8 : 7;
  const padding = depth === 0 ? 60 : depth === 1 ? 50 : 40;
  const minWidth = depth === 0 ? 160 : depth === 1 ? 120 : 100;
  const maxWidth = depth === 0 ? 220 : depth === 1 ? 180 : 160;
  return Math.min(maxWidth, Math.max(minWidth, text.length * charWidth + padding));
}

// Check if two rectangles overlap with padding
function nodesOverlap(
  node1: { x: number; y: number; width: number; height: number },
  node2: { x: number; y: number; width: number; height: number },
  padding: number = 20
): boolean {
  const halfW1 = node1.width / 2 + padding;
  const halfH1 = node1.height / 2 + padding;
  const halfW2 = node2.width / 2 + padding;
  const halfH2 = node2.height / 2 + padding;

  return Math.abs(node1.x - node2.x) < halfW1 + halfW2 &&
         Math.abs(node1.y - node2.y) < halfH1 + halfH2;
}

// Resolve overlaps by pushing nodes outward
function resolveOverlaps(nodes: NodeLayout[], iterations: number = 5): void {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Skip center node and parent-child pairs
        if (nodeA.depth === 0 || nodeB.depth === 0) continue;
        if (nodeA.parentId === nodeB.id || nodeB.parentId === nodeA.id) continue;

        if (nodesOverlap(nodeA, nodeB, 15)) {
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Push apart with more force
          const pushForce = 25;
          const pushX = (dx / dist) * pushForce;
          const pushY = (dy / dist) * pushForce;

          // Push nodes in opposite directions
          if (nodeA.depth === nodeB.depth) {
            nodeA.x -= pushX;
            nodeA.y -= pushY;
            nodeB.x += pushX;
            nodeB.y += pushY;
          } else {
            // Push the deeper node more
            const deeper = nodeA.depth > nodeB.depth ? nodeA : nodeB;
            deeper.x += (deeper === nodeA ? -1 : 1) * pushX * 2;
            deeper.y += (deeper === nodeA ? -1 : 1) * pushY * 2;
          }
        }
      }
    }
  }
}

function calculateRadialLayout(
  data: MindMapData,
  centerX: number,
  centerY: number,
  expandedNodes: Set<string>
): NodeLayout[] {
  const layouts: NodeLayout[] = [];
  const branchCount = data.branches.length;

  // Central node - larger and more prominent
  const centerWidth = calculateNodeWidth(data.centralTopic, 0);
  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: centerX,
    y: centerY,
    width: centerWidth,
    height: 70,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Calculate total expanded subtopics to determine radius
  let totalExpandedSubtopics = 0;
  data.branches.forEach((branch, index) => {
    if (expandedNodes.has(`branch-${index}`) && branch.subtopics) {
      totalExpandedSubtopics += branch.subtopics.length;
    }
  });

  // Dynamic base radius based on content - much larger for better spacing
  const baseRadius = Math.max(280, 180 + branchCount * 25 + totalExpandedSubtopics * 8);
  const angleStep = 360 / branchCount;

  // Start angle offset to position first branch at top
  const startAngleOffset = -90;

  // First pass: create branch nodes
  const branchNodes: NodeLayout[] = [];
  data.branches.forEach((branch, index) => {
    const angle = startAngleOffset + index * angleStep;
    const pos = polarToCartesian(centerX, centerY, baseRadius, angle);
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);
    const nodeWidth = calculateNodeWidth(branch.topic, 1);

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: 52,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      angle,
      children: [],
      isExpanded,
      isVisible: true,
    };
    branchNodes.push(branchNode);
  });

  // Second pass: add subtopics with smart positioning
  branchNodes.forEach((branchNode, index) => {
    const branch = data.branches[index];
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];

    if (branchNode.isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      const subtopicCount = branch.subtopics.length;
      // Subtopic radius proportional to count - much larger spacing
      const subtopicRadius = Math.max(140, 100 + subtopicCount * 20);

      // Calculate angle spread based on available space
      // More subtopics = wider spread, but capped to avoid overlap with neighbors
      const maxAngleSpread = Math.min(120, angleStep - 20);
      const subtopicAngleSpread = Math.min(maxAngleSpread, 25 * subtopicCount);

      const baseAngle = branchNode.angle || 0;
      const startAngle = baseAngle - subtopicAngleSpread / 2;
      const subtopicAngleStep = subtopicCount > 1
        ? subtopicAngleSpread / (subtopicCount - 1)
        : 0;

      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicAngle = subtopicCount === 1
          ? baseAngle
          : startAngle + subIndex * subtopicAngleStep;
        const subPos = polarToCartesian(branchNode.x, branchNode.y, subtopicRadius, subtopicAngle);
        const nodeWidth = calculateNodeWidth(subtopic, 2);

        const subtopicNode: NodeLayout = {
          id: `${branchNode.id}-sub-${subIndex}`,
          topic: subtopic,
          x: subPos.x,
          y: subPos.y,
          width: nodeWidth,
          height: 38,
          depth: 2,
          parentId: branchNode.id,
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

  // Resolve any remaining overlaps
  resolveOverlaps(layouts, 8);

  return layouts;
}

function calculateTreeLayout(
  data: MindMapData,
  startX: number,
  startY: number,
  expandedNodes: Set<string>
): NodeLayout[] {
  const layouts: NodeLayout[] = [];
  const horizontalSpacing = 320;
  const branchVerticalGap = 30;
  const subtopicVerticalGap = 12;

  // First pass: calculate heights for each branch
  const branchHeights: number[] = [];
  data.branches.forEach((branch, index) => {
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);
    const subtopicCount = isExpanded && branch.subtopics ? branch.subtopics.length : 0;
    // Height = branch node + subtopics
    const subtopicTotalHeight = subtopicCount > 0
      ? subtopicCount * 42 + (subtopicCount - 1) * subtopicVerticalGap
      : 0;
    branchHeights.push(Math.max(56, subtopicTotalHeight));
  });

  // Calculate total height
  const totalHeight = branchHeights.reduce((sum, h) => sum + h, 0) +
                     (branchHeights.length - 1) * branchVerticalGap;

  // Central node - positioned to the left, vertically centered
  const centerWidth = calculateNodeWidth(data.centralTopic, 0);
  const centerX = startX + 120;
  const centerY = startY + totalHeight / 2 + 40;

  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: centerX,
    y: centerY,
    width: centerWidth,
    height: 70,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Second pass: position branches and subtopics
  let currentY = startY + 40;

  data.branches.forEach((branch, index) => {
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);
    const branchWidth = calculateNodeWidth(branch.topic, 1);
    const branchHeight = branchHeights[index];

    // Branch positioned at the center of its allocated space
    const branchX = centerX + horizontalSpacing;
    const branchY = currentY + branchHeight / 2;

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: branchX,
      y: branchY,
      width: branchWidth,
      height: 52,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      children: [],
      isExpanded,
      isVisible: true,
    };

    // Add subtopics - aligned vertically with proper spacing
    if (isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      const subtopicCount = branch.subtopics.length;
      const subtopicTotalHeight = subtopicCount * 42 + (subtopicCount - 1) * subtopicVerticalGap;
      let subtopicY = branchY - subtopicTotalHeight / 2 + 21; // Start from top of allocated space

      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicWidth = calculateNodeWidth(subtopic, 2);
        const subtopicNode: NodeLayout = {
          id: `${branchId}-sub-${subIndex}`,
          topic: subtopic,
          x: branchX + horizontalSpacing - 40,
          y: subtopicY,
          width: subtopicWidth,
          height: 40,
          depth: 2,
          parentId: branchId,
          color: colorSet.primary,
          children: [],
          isExpanded: false,
          isVisible: true,
        };
        branchNode.children.push(subtopicNode);
        layouts.push(subtopicNode);
        subtopicY += 42 + subtopicVerticalGap;
      });
    }

    layouts.push(branchNode);
    currentY += branchHeight + branchVerticalGap;
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

  // Central node
  const centerWidth = calculateNodeWidth(data.centralTopic, 0);
  const centerNode: NodeLayout = {
    id: "center",
    topic: data.centralTopic,
    description: data.description,
    x: centerX,
    y: centerY,
    width: centerWidth,
    height: 70,
    depth: 0,
    parentId: null,
    color: CENTER_COLOR.primary,
    children: [],
    isExpanded: true,
    isVisible: true,
  };
  layouts.push(centerNode);

  // Calculate total expanded subtopics for radius adjustment
  let totalExpandedSubtopics = 0;
  data.branches.forEach((branch, index) => {
    if (expandedNodes.has(`branch-${index}`) && branch.subtopics) {
      totalExpandedSubtopics += branch.subtopics.length;
    }
  });

  // Organic placement using golden angle spiral with better spacing
  const goldenAngle = 137.508; // Golden angle for natural Fibonacci-like distribution
  const baseRadius = Math.max(260, 200 + branchCount * 20 + totalExpandedSubtopics * 6);

  // Create branch nodes first
  const branchNodes: NodeLayout[] = [];
  data.branches.forEach((branch, index) => {
    // Golden angle spiral with offset for better initial positioning
    const angle = -90 + index * goldenAngle;
    // Fibonacci-like radius variation - grows outward slightly for each branch
    const radiusMultiplier = 1 + (index * 0.08);
    const radius = baseRadius * radiusMultiplier;
    const pos = polarToCartesian(centerX, centerY, radius, angle);

    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];
    const branchId = `branch-${index}`;
    const isExpanded = expandedNodes.has(branchId);
    const nodeWidth = calculateNodeWidth(branch.topic, 1);

    const branchNode: NodeLayout = {
      id: branchId,
      topic: branch.topic,
      subtopics: branch.subtopics,
      description: branch.description,
      x: pos.x,
      y: pos.y,
      width: nodeWidth,
      height: 52,
      depth: 1,
      parentId: "center",
      color: colorSet.primary,
      angle,
      children: [],
      isExpanded,
      isVisible: true,
    };
    branchNodes.push(branchNode);
  });

  // Add subtopics with organic fan-out pattern
  branchNodes.forEach((branchNode, index) => {
    const branch = data.branches[index];
    const colorSet = BRANCH_COLORS[index % BRANCH_COLORS.length];

    if (branchNode.isExpanded && branch.subtopics && branch.subtopics.length > 0) {
      const subtopicCount = branch.subtopics.length;
      const baseAngle = branchNode.angle || 0;

      // Calculate direction away from center for subtopic fan
      const directionFromCenter = baseAngle;

      // Fan out subtopics in the direction away from center
      const fanSpread = Math.min(90, 20 + subtopicCount * 15);
      const startAngle = directionFromCenter - fanSpread / 2;
      const angleStep = subtopicCount > 1 ? fanSpread / (subtopicCount - 1) : 0;

      branch.subtopics.forEach((subtopic, subIndex) => {
        const subtopicAngle = subtopicCount === 1
          ? directionFromCenter
          : startAngle + subIndex * angleStep;
        // Varying radius for organic feel
        const subtopicRadius = 130 + (subIndex % 2) * 20;
        const subPos = polarToCartesian(branchNode.x, branchNode.y, subtopicRadius, subtopicAngle);
        const nodeWidth = calculateNodeWidth(subtopic, 2);

        const subtopicNode: NodeLayout = {
          id: `${branchNode.id}-sub-${subIndex}`,
          topic: subtopic,
          x: subPos.x,
          y: subPos.y,
          width: nodeWidth,
          height: 38,
          depth: 2,
          parentId: branchNode.id,
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

  // Resolve overlaps with more iterations for organic layout
  resolveOverlaps(layouts, 10);

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
      return generateTreePath(start, end, depth);
    } else if (viewMode === "organic") {
      return generateOrganicPath(start, end, depth);
    } else {
      // Radial view
      return generateCurvedPath(start, end, depth === 1 ? 0.2 : 0.3, depth);
    }
  }, [start, end, viewMode, depth]);

  // Better stroke widths for visual hierarchy
  const strokeWidth = depth === 1 ? 2.5 : 1.8;
  const opacity = depth === 1 ? 0.85 : 0.6;
  const glowOpacity = depth === 1 ? 0.2 : 0.1;

  return (
    <g>
      {/* Glow effect - softer and more subtle */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={glowOpacity}
        style={{ filter: "blur(6px)" }}
      />
      {/* Main line with gradient effect */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        strokeDasharray={animated && pathLength > 0 ? pathLength : undefined}
        strokeDashoffset={animated ? 0 : undefined}
        style={{
          transition: animated ? "stroke-dashoffset 1s ease-out" : undefined,
        }}
      />
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

  // Enhanced styling based on depth with better visual hierarchy
  const getNodeStyle = (): React.CSSProperties => {
    if (node.depth === 0) {
      // Central node - prominent and glowing
      return {
        background: `linear-gradient(135deg, ${colorSet.primary} 0%, #ea580c 50%, #dc2626 100%)`,
        boxShadow: isHovered
          ? `0 0 40px ${colorSet.glow}, 0 0 80px ${colorSet.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
          : `0 8px 32px ${colorSet.glow}, 0 0 20px ${colorSet.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        transform: isHovered ? "scale(1.06)" : "scale(1)",
        border: "1px solid rgba(255,255,255,0.2)",
      };
    } else if (node.depth === 1) {
      // Branch nodes - solid with clear hierarchy
      return {
        background: isHovered
          ? `linear-gradient(135deg, ${colorSet.primary}50, ${colorSet.primary}30)`
          : `linear-gradient(135deg, ${colorSet.primary}30, ${colorSet.primary}15)`,
        border: `2px solid ${colorSet.primary}70`,
        boxShadow: isHovered
          ? `0 0 24px ${colorSet.glow}, 0 4px 20px rgba(0,0,0,0.3)`
          : `0 4px 16px rgba(0,0,0,0.25), 0 0 8px ${colorSet.glow}`,
        transform: isHovered ? "scale(1.04)" : "scale(1)",
        backdropFilter: "blur(8px)",
      };
    } else {
      // Subtopic nodes - lighter, more subtle
      return {
        background: `linear-gradient(135deg, ${colorSet.bg}, ${colorSet.primary}10)`,
        border: `1.5px solid ${colorSet.primary}50`,
        boxShadow: isHovered
          ? `0 0 16px ${colorSet.glow}, 0 2px 12px rgba(0,0,0,0.2)`
          : `0 2px 10px rgba(0,0,0,0.15)`,
        transform: isHovered ? "scale(1.03)" : "scale(1)",
        backdropFilter: "blur(4px)",
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
        className="w-full h-full flex items-center justify-center cursor-pointer"
        style={{
          ...style,
          borderRadius: node.depth === 0 ? "24px" : node.depth === 1 ? "18px" : "14px",
          padding: node.depth === 0 ? "16px 28px" : node.depth === 1 ? "12px 20px" : "8px 14px",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
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
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/15 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              style={{
                backgroundColor: node.isExpanded ? `${colorSet.primary}25` : "transparent",
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: colorSet.primary }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: colorSet.primary }} />
              )}
            </button>
          )}

          {/* Node text with better typography */}
          <span
            className={`leading-tight ${
              node.depth === 0
                ? "text-white font-bold text-base tracking-tight"
                : node.depth === 1
                  ? "font-semibold text-sm"
                  : "text-xs font-medium"
            }`}
            style={{
              color: node.depth === 0 ? "#fff" : colorSet.primary,
              textShadow: node.depth === 0
                ? "0 2px 8px rgba(0,0,0,0.4)"
                : node.depth === 1
                  ? `0 1px 4px rgba(0,0,0,0.2)`
                  : undefined,
              display: "-webkit-box",
              WebkitLineClamp: node.depth === 0 ? 2 : 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}
            title={node.topic}
          >
            {node.topic}
          </span>

          {/* Subtopic count badge - more prominent */}
          {hasChildren && node.depth === 1 && !node.isExpanded && (
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${colorSet.primary}40`,
                color: colorSet.primary,
                border: `1px solid ${colorSet.primary}60`,
                minWidth: "22px",
                textAlign: "center",
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
  const [zoom, setZoom] = useState(0.85); // Slightly zoomed out for better overview
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeLayout | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

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

  // Calculate layout with larger canvas for radial/organic views
  const canvasSize = useMemo(() => {
    if (!mindMapData) return { width: dimensions.width, height: dimensions.height };

    const branchCount = mindMapData.branches.length;
    const hasExpandedSubtopics = expandedNodes.size > 0;

    // Calculate needed size based on content
    if (viewMode === "radial" || viewMode === "organic") {
      const baseSize = Math.max(1200, 800 + branchCount * 80);
      const expandedBonus = hasExpandedSubtopics ? 400 : 0;
      return {
        width: Math.max(dimensions.width, baseSize + expandedBonus),
        height: Math.max(dimensions.height, baseSize + expandedBonus),
      };
    }

    // Tree view needs more horizontal space
    return {
      width: Math.max(dimensions.width, 1400),
      height: Math.max(dimensions.height, branchCount * 120 + 200),
    };
  }, [mindMapData, viewMode, expandedNodes.size, dimensions]);

  const nodeLayouts = useMemo(() => {
    if (!mindMapData) return [];

    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    switch (viewMode) {
      case "radial":
        return calculateRadialLayout(mindMapData, centerX, centerY, expandedNodes);
      case "tree":
        return calculateTreeLayout(mindMapData, 80, 80, expandedNodes);
      case "organic":
        return calculateOrganicLayout(mindMapData, centerX, centerY, expandedNodes);
      default:
        return calculateRadialLayout(mindMapData, centerX, centerY, expandedNodes);
    }
  }, [mindMapData, viewMode, canvasSize, expandedNodes]);

  // Auto-fit content on first render
  useEffect(() => {
    if (!hasInitialized && nodeLayouts.length > 0 && dimensions.width > 0) {
      // Calculate bounding box of all nodes
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodeLayouts.forEach(node => {
        minX = Math.min(minX, node.x - node.width / 2);
        maxX = Math.max(maxX, node.x + node.width / 2);
        minY = Math.min(minY, node.y - node.height / 2);
        maxY = Math.max(maxY, node.y + node.height / 2);
      });

      const contentWidth = maxX - minX + 100;
      const contentHeight = maxY - minY + 100;

      // Calculate optimal zoom to fit content
      const zoomX = dimensions.width / contentWidth;
      const zoomY = dimensions.height / contentHeight;
      const optimalZoom = Math.min(zoomX, zoomY, 1) * 0.9; // 90% to leave some margin

      setZoom(Math.max(0.4, Math.min(1, optimalZoom)));

      // Center the content
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;
      const viewCenterX = dimensions.width / 2;
      const viewCenterY = dimensions.height / 2;

      setPan({
        x: (viewCenterX - contentCenterX * optimalZoom),
        y: (viewCenterY - contentCenterY * optimalZoom),
      });

      setHasInitialized(true);
    }
  }, [hasInitialized, nodeLayouts, dimensions]);

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

  // Reset view - re-center and fit content
  const resetView = useCallback(() => {
    if (nodeLayouts.length === 0 || dimensions.width === 0) {
      setZoom(0.85);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodeLayouts.forEach(node => {
      minX = Math.min(minX, node.x - node.width / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    });

    const contentWidth = maxX - minX + 100;
    const contentHeight = maxY - minY + 100;

    const zoomX = dimensions.width / contentWidth;
    const zoomY = dimensions.height / contentHeight;
    const optimalZoom = Math.min(zoomX, zoomY, 1) * 0.9;

    setZoom(Math.max(0.4, Math.min(1, optimalZoom)));

    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    const viewCenterX = dimensions.width / 2;
    const viewCenterY = dimensions.height / 2;

    setPan({
      x: viewCenterX - contentCenterX * optimalZoom,
      y: viewCenterY - contentCenterY * optimalZoom,
    });
  }, [nodeLayouts, dimensions]);

  // Export as PNG
  const exportAsPng = useCallback(async () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize.width * 2;
      canvas.height = canvasSize.height * 2;
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
          width={canvasSize.width}
          height={canvasSize.height}
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
