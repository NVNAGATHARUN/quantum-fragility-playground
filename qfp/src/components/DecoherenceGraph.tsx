import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { Card } from './UI';

interface DecoherenceGraphProps {
    data: {
        time: number;
        r: number;
        coherence: number;
        purity: number;
        x: number;
        y: number;
        z: number;
        p0: number;
        p1: number;
    }[];
    visibleLines: {
        health: boolean; // Map this to 'r' (length)
        x: boolean;
        y: boolean;
        z: boolean;
    };
}

const DecoherenceGraph: React.FC<DecoherenceGraphProps> = ({ data, visibleLines }) => {
    return (
        <div className="flex flex-col gap-16 w-full h-full">
            {/* State Evolution Graph */}
            <Card className="flex-1 min-h-[220px] p-16">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            hide
                        />
                        <YAxis
                            domain={[-1.1, 1.1]}
                            stroke="#475569"
                            fontSize={10}
                            ticks={[-1, -0.5, 0, 0.5, 1]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0d0d24', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', fontSize: '11px' }}
                            itemStyle={{ padding: '2px 0' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />

                        {visibleLines.health && (
                            <Line
                                type="monotone"
                                dataKey="r"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={false}
                                isAnimationActive={false}
                                name="Vector Length |r|"
                            />
                        )}
                        {visibleLines.x && (
                            <Line
                                type="monotone"
                                dataKey="x"
                                stroke="#ef4444"
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={false}
                                name="X Component"
                            />
                        )}
                        {visibleLines.y && (
                            <Line
                                type="monotone"
                                dataKey="y"
                                stroke="#10b981"
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={false}
                                name="Y Component"
                            />
                        )}
                        {visibleLines.z && (
                            <Line
                                type="monotone"
                                dataKey="z"
                                stroke="#3b82f6"
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={false}
                                name="Z Component"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Probability Flow Graph */}
            <Card className="h-[120px] p-8">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 1]} stroke="#475569" fontSize={8} ticks={[0, 0.5, 1]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0d0d24', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', fontSize: '11px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="p0"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                            isAnimationActive={false}
                            name="P(|0⟩)"
                        />
                        <Area
                            type="monotone"
                            dataKey="p1"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.2}
                            isAnimationActive={false}
                            name="P(|1⟩)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default DecoherenceGraph;
