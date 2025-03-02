import React, { useEffect, useRef } from "react";

interface DataPoint {
  value: number;
  label: string;
  color?: string;
}

interface AdvancedSmalltalkVisualizationProps {
  data: DataPoint[];
  title: string;
  chartType: "bar" | "pie" | "line" | "radar";
  height?: number;
  width?: number;
  backgroundColor?: string;
  textColor?: string;
  animate?: boolean;
}

const AdvancedSmalltalkVisualization: React.FC<
  AdvancedSmalltalkVisualizationProps
> = ({
  data,
  title,
  chartType,
  height = 400,
  width = 600,
  backgroundColor = "#ffffff",
  textColor = "#333333",
  animate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default color palette
  const defaultColors = [
    "#4f46e5", // indigo
    "#3b82f6", // blue
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#84cc16", // lime
    "#eab308", // yellow
    "#f97316", // orange
    "#ef4444", // red
    "#ec4899", // pink
    "#8b5cf6", // purple
  ];

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.font = "bold 18px Arial";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(title, width / 2, 30);

    // Assign colors to data points if not provided
    const coloredData = data.map((point, index) => ({
      ...point,
      color: point.color || defaultColors[index % defaultColors.length],
    }));

    // Draw chart based on type
    switch (chartType) {
      case "bar":
        drawBarChart(ctx, coloredData, animate);
        break;
      case "pie":
        drawPieChart(ctx, coloredData, animate);
        break;
      case "line":
        drawLineChart(ctx, coloredData, animate);
        break;
      case "radar":
        drawRadarChart(ctx, coloredData, animate);
        break;
      default:
        drawBarChart(ctx, coloredData, animate);
    }
  }, [
    data,
    title,
    chartType,
    height,
    width,
    backgroundColor,
    textColor,
    animate,
  ]);

  // Bar Chart
  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    animate: boolean
  ) => {
    const chartMargin = { top: 60, right: 30, bottom: 60, left: 50 };
    const chartWidth = width - chartMargin.left - chartMargin.right;
    const chartHeight = height - chartMargin.top - chartMargin.bottom;

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d.value));
    const scale = chartHeight / (maxValue || 1);

    // Bar dimensions
    const barWidth = (chartWidth / data.length) * 0.8;
    const barSpacing = (chartWidth / data.length) * 0.2;

    // Draw axes
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartMargin.left, chartMargin.top);
    ctx.lineTo(chartMargin.left, height - chartMargin.bottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartMargin.left, height - chartMargin.bottom);
    ctx.lineTo(width - chartMargin.right, height - chartMargin.bottom);
    ctx.stroke();

    // Draw bars with animation if enabled
    data.forEach((point, index) => {
      const x = chartMargin.left + (barWidth + barSpacing / 2) * index;
      const fullHeight = point.value * scale;

      // Determine bar height (for animation)
      let barHeight = fullHeight;
      if (animate) {
        // Animation logic - start with 0 height and grow to full height
        const animationProgress = Math.min(1, (Date.now() % 2000) / 1000);
        barHeight = fullHeight * animationProgress;

        // Request animation frame for continuous animation
        requestAnimationFrame(() => {
          if (canvasRef.current) {
            const currentCtx = canvasRef.current.getContext("2d");
            if (currentCtx) {
              drawBarChart(currentCtx, data, animate);
            }
          }
        });
      }

      const y = height - chartMargin.bottom - barHeight;

      // Draw bar
      ctx.fillStyle =
        point.color || defaultColors[index % defaultColors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = textColor;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(point.value.toString(), x + barWidth / 2, y - 5);

      // Draw label below bar
      ctx.fillText(
        point.label,
        x + barWidth / 2,
        height - chartMargin.bottom + 20
      );
    });
  };

  // Pie Chart
  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    animate: boolean
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    // Calculate total for percentages
    const total = data.reduce((sum, point) => sum + point.value, 0);

    // Animation progress
    const animationProgress = animate
      ? Math.min(1, (Date.now() % 2000) / 1000)
      : 1;

    // Draw pie segments
    let startAngle = 0;
    data.forEach((point, index) => {
      // Calculate angle for this segment
      const segmentAngle =
        (point.value / total) * 2 * Math.PI * animationProgress;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + segmentAngle);
      ctx.closePath();

      // Fill segment
      ctx.fillStyle =
        point.color || defaultColors[index % defaultColors.length];
      ctx.fill();

      // Calculate position for label
      const labelAngle = startAngle + segmentAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      // Draw percentage label if segment is large enough
      if (segmentAngle > 0.2) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const percentage = Math.round((point.value / total) * 100);
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      startAngle += segmentAngle;
    });

    // Draw legend
    const legendX = width - 150;
    const legendY = 80;

    data.forEach((point, index) => {
      const itemY = legendY + index * 25;

      // Draw color box
      ctx.fillStyle =
        point.color || defaultColors[index % defaultColors.length];
      ctx.fillRect(legendX, itemY, 15, 15);

      // Draw label
      ctx.fillStyle = textColor;
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(point.label, legendX + 25, itemY + 7);
    });

    // Request animation frame if animating
    if (animate) {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const currentCtx = canvasRef.current.getContext("2d");
          if (currentCtx) {
            drawPieChart(currentCtx, data, animate);
          }
        }
      });
    }
  };

  // Line Chart
  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    animate: boolean
  ) => {
    const chartMargin = { top: 60, right: 30, bottom: 60, left: 50 };
    const chartWidth = width - chartMargin.left - chartMargin.right;
    const chartHeight = height - chartMargin.top - chartMargin.bottom;

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d.value));
    const scale = chartHeight / (maxValue || 1);

    // Point spacing
    const pointSpacing = chartWidth / (data.length - 1 || 1);

    // Draw axes
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartMargin.left, chartMargin.top);
    ctx.lineTo(chartMargin.left, height - chartMargin.bottom);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartMargin.left, height - chartMargin.bottom);
    ctx.lineTo(width - chartMargin.right, height - chartMargin.bottom);
    ctx.stroke();

    // Animation progress
    const animationProgress = animate
      ? Math.min(1, (Date.now() % 2000) / 1000)
      : 1;

    // Calculate points
    const points = data.map((point, index) => {
      const x = chartMargin.left + pointSpacing * index;
      const y =
        height - chartMargin.bottom - point.value * scale * animationProgress;
      return { x, y, label: point.label, value: point.value };
    });

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw area under line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, height - chartMargin.bottom);
    ctx.lineTo(points[0].x, height - chartMargin.bottom);
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fill();

    // Draw points and labels
    points.forEach((point, index) => {
      // Draw point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value above point
      ctx.fillStyle = textColor;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(point.value.toString(), point.x, point.y - 15);

      // Draw label below x-axis
      ctx.fillText(point.label, point.x, height - chartMargin.bottom + 20);
    });

    // Request animation frame if animating
    if (animate) {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const currentCtx = canvasRef.current.getContext("2d");
          if (currentCtx) {
            drawLineChart(currentCtx, data, animate);
          }
        }
      });
    }
  };

  // Radar Chart
  const drawRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    animate: boolean
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d.value));

    // Animation progress
    const animationProgress = animate
      ? Math.min(1, (Date.now() % 2000) / 1000)
      : 1;

    // Draw radar grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;

      ctx.beginPath();
      for (let i = 0; i <= data.length; i++) {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const x = centerX + levelRadius * Math.cos(angle);
        const y = centerY + levelRadius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.stroke();
    }

    // Draw radar axes
    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const axisX = centerX + radius * Math.cos(angle);
      const axisY = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(axisX, axisY);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.stroke();

      // Draw label
      const labelRadius = radius + 20;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillStyle = textColor;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data[i].label, labelX, labelY);
    }

    // Draw data points and connect them
    ctx.beginPath();
    for (let i = 0; i <= data.length; i++) {
      const dataIndex = i % data.length;
      const value = data[dataIndex].value;
      const scaledRadius = (radius * value * animationProgress) / maxValue;
      const angle = (Math.PI * 2 * dataIndex) / data.length - Math.PI / 2;
      const x = centerX + scaledRadius * Math.cos(angle);
      const y = centerY + scaledRadius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < data.length; i++) {
      const value = data[i].value;
      const scaledRadius = (radius * value * animationProgress) / maxValue;
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const x = centerX + scaledRadius * Math.cos(angle);
      const y = centerY + scaledRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Request animation frame if animating
    if (animate) {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const currentCtx = canvasRef.current.getContext("2d");
          if (currentCtx) {
            drawRadarChart(currentCtx, data, animate);
          }
        }
      });
    }
  };

  return (
    <div className="advanced-smalltalk-visualization">
      <canvas
        ref={canvasRef}
        className="mx-auto border border-gray-200 rounded-lg shadow-sm"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default AdvancedSmalltalkVisualization;
