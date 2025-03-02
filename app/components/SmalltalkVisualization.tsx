import React, { useEffect, useRef } from "react";

interface SmalltalkVisualizationProps {
  data: {
    title: string;
    values: number[];
    labels: string[];
  };
  height?: number;
  width?: number;
}

const SmalltalkVisualization: React.FC<SmalltalkVisualizationProps> = ({
  data,
  height = 300,
  width = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.values.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Calculate chart dimensions
    const chartWidth = width * 0.9;
    const chartHeight = height * 0.8;
    const marginLeft = width * 0.1;
    const marginTop = height * 0.1;

    // Draw title
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText(data.title, width / 2, marginTop / 2);

    // Find max value for scaling
    const maxValue = Math.max(...data.values);
    const scale = chartHeight / (maxValue || 1);

    // Draw bars
    const barWidth = (chartWidth / data.values.length) * 0.8;
    const barSpacing = (chartWidth / data.values.length) * 0.2;

    // Color palette
    const colors = [
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

    // Draw bars
    data.values.forEach((value, index) => {
      const barHeight = value * scale;
      const x = marginLeft + (barWidth + barSpacing) * index;
      const y = height - marginTop - barHeight;

      // Use color from palette with wrapping
      const colorIndex = index % colors.length;
      ctx.fillStyle = colors[colorIndex];

      // Draw bar
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

      // Draw label below bar
      ctx.fillText(
        data.labels[index],
        x + barWidth / 2,
        height - marginTop + 15
      );
    });

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, height - marginTop);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(marginLeft, height - marginTop);
    ctx.lineTo(marginLeft + chartWidth, height - marginTop);
    ctx.stroke();
  }, [data, height, width]);

  return (
    <div className="smalltalk-visualization">
      <canvas
        ref={canvasRef}
        className="mx-auto border border-gray-200 rounded-lg shadow-sm"
      />
    </div>
  );
};

export default SmalltalkVisualization;
