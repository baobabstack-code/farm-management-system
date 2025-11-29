"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  actual?: number;
  forecast?: number;
}

export default function LineChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2563eb"
            strokeWidth={2}
            name="Actual Production"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#9333ea"
            strokeDasharray="5 5"
            name="Forecast"
            dot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
