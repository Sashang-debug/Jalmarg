import React, { useState } from 'react'
import {
  X,
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  Cpu,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Server,
  Database,
  Brain,
  Volume2,
  Navigation,
  Truck
} from 'lucide-react'

export default function ObservabilityModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('metrics') // 'metrics' | 'xray' | 'json' | 'pitch'
  const [selectedNode, setSelectedNode] = useState('sfn')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const xRayNodes = [
    { id: 'client', name: 'PWA / WhatsApp Audio', type: 'Client Ingestion', latency: '12 ms', status: 'OK', desc: 'Citizen flood upload & 5-sec voice note', icon: Smartphone, color: '#3B82F6' },
    { id: 'apigw', name: 'Amazon API Gateway', type: 'AWS::ApiGateway', latency: '8 ms', status: 'OK', desc: 'REST & WebSocket live telemetry mesh', icon: Server, color: '#10B981' },
    { id: 'sfn', name: 'AWS Step Functions', type: 'AWS::StepFunctions', latency: '182 ms', status: 'OK', desc: 'Central ASL state machine orchestration', icon: Cpu, color: '#EC4899' },
    { id: 'bedrock', name: 'Amazon Bedrock (NER)', type: 'AWS::Bedrock', latency: '45 ms', status: 'OK', desc: 'Claude 3 Haiku resolving Indian landmarks', icon: Brain, color: '#8B5CF6' },
    { id: 'sagemaker', name: 'SageMaker CV Depth', type: 'AWS::SageMaker', latency: '38 ms', status: 'OK', desc: 'Tire rim submersion ratio depth estimation', icon: Activity, color: '#F59E0B' },
    { id: 'cedar', name: 'Cedar Policy Engine', type: 'Security::Cedar', latency: '8 ms', status: 'OK', desc: 'Zero-trust citizen vs civic authority auth', icon: ShieldAlert, color: '#06B6D4' },
    { id: 'opensearch', name: 'Amazon OpenSearch', type: 'AWS::OpenSearch', latency: '19 ms', status: 'OK', desc: 'Sub-millisecond geo_polygon spatial indexing', icon: Database, color: '#F97316' },
    { id: 'location', name: 'Amazon Location Service', type: 'AWS::Location', latency: '28 ms', status: 'OK', desc: 'Vehicle clearance routing matrix & detour', icon: Navigation, color: '#10B981' },
    { id: 'sqs', name: 'Amazon SQS Pump Queue', type: 'AWS::SQS', latency: '14 ms', status: 'OK', desc: 'High-priority FIFO municipal truck dispatch', icon: Truck, color: '#EF4444' },
    { id: 'polly', name: 'Amazon Polly Audio', type: 'AWS::Polly', latency: '22 ms', status: 'OK', desc: 'Neural vernacular voice radar (Hindi/English)', icon: Volume2, color: '#00E676' }
  ]

  const currentNode = xRayNodes.find(n => n.id === selectedNode) || xRayNodes[2]

  const sampleDashboardJson = `{
  "dashboardName": "JalMarg-Operational-Cockpit",
  "region": "ap-south-1",
  "namespace": "JalMarg/MonsoonIntelligence",
  "metrics": [
    "WaterDepthCm (Gauge by City & Severity)",
    "ActiveFloodedSegments (Count)",
    "VehicleReroutes (Count by 2-Wheeler/Car/SUV)",
    "PumpDispatchLatencySec (Seconds to BBMP/MCD SLA)"
  ],
  "alarms": [
    "JalMarg-CriticalDepthExceeded (>= 50cm)",
    "JalMarg-PumpDispatchBacklog (> 2 tickets)"
  ]
}`

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleDashboardJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '1000px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        background: '#0D111C',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(26, 115, 232, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #111827 0%, #0D111C 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF9900 0%, #D97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255, 153, 0, 0.35)'
            }}>
              <Activity size={24} color="#000000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  AWS Observability & Architecture Cockpit
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(255, 153, 0, 0.15)',
                  color: '#FF9900',
                  border: '1px solid rgba(255, 153, 0, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  CloudWatch + X-Ray Live
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                Amazon CloudWatch Custom Telemetry • AWS X-Ray Distributed Service Map • Phase 5 Production Ready
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9CA3AF',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {[
            { id: 'metrics', label: '📊 CloudWatch Metrics & Alarms' },
            { id: 'xray', label: '🗺️ AWS X-Ray Service Map' },
            { id: 'json', label: '📋 CloudWatch Dashboard JSON' },
            { id: 'pitch', label: '🎙️ 3-Minute Hackathon Pitch Script' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#1A73E8' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#FFFFFF' : '#9CA3AF',
                border: activeTab === tab.id ? '1px solid #4285F4' : '1px solid rgba(255,255,255,0.08)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: CLOUDWATCH METRICS */}
          {activeTab === 'metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Telemetry KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <div style={{ background: '#131A29', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Flood Zones
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
                    3 Metros
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    BLR (1) • DEL (2) • BOM (1)
                  </div>
                </div>

                <div style={{ background: '#131A29', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Peak Water Depth
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#F59E0B', marginTop: '6px' }}>
                    68 cm
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Minto Bridge Underpass (Delhi)
                  </div>
                </div>

                <div style={{ background: '#131A29', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pump Dispatch SLA
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
                    24.3 sec
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Target: &lt; 45 sec (BBMP / MCD)
                  </div>
                </div>

                <div style={{ background: '#131A29', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Diverted Trips
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#00E676', marginTop: '6px' }}>
                    100% Safe
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Zero engine seizures recorded
                  </div>
                </div>
              </div>

              {/* CloudWatch Alarms Monitor */}
              <div style={{ background: '#131A29', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#FF9900" />
                  <span>Amazon CloudWatch Operational Alarms Status</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertTriangle size={18} color="#EF4444" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          JalMarg-CriticalDepthExceeded
                        </div>
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                          Max depth 68 cm exceeds threshold of 50 cm. Road closure active for sedans and two-wheelers.
                        </div>
                      </div>
                    </div>
                    <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                      ALARM
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={18} color="#10B981" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          JalMarg-PumpDispatchBacklog
                        </div>
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                          Municipal queue nominal. Suction pump units active across Minto Road & Silk Board.
                        </div>
                      </div>
                    </div>
                    <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                      OK
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Radio size={18} color="#F59E0B" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          JalMarg-SevereCongestionReroutes
                        </div>
                        <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                          Elevated flyover detour active. Amazon Location Service routing traffic via safe corridors.
                        </div>
                      </div>
                    </div>
                    <span style={{ background: '#F59E0B', color: '#000000', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                      MONITORING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AWS X-RAY SERVICE MAP */}
          {activeTab === 'xray' && (
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Nodes List / Interactive DAG */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>
                  MICROSERVICE CALL GRAPH (AVERAGE LATENCY: 208.5 ms)
                </div>
                {xRayNodes.map((node) => {
                  const Icon = node.icon
                  const isSelected = selectedNode === node.id
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(26, 115, 232, 0.15)' : '#131A29',
                        border: isSelected ? '1.5px solid #1A73E8' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${node.color}22`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={18} color={node.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                            {node.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {node.type}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {node.latency}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#9CA3AF' }}>
                          {node.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Node Inspector Card */}
              <div style={{
                width: '340px',
                background: '#131A29',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FF9900', textTransform: 'uppercase' }}>
                  X-Ray Subsegment Inspector
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${currentNode.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {React.createElement(currentNode.icon, { size: 22, color: currentNode.color })}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                      {currentNode.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {currentNode.type}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.5 }}>
                  {currentNode.desc}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#9CA3AF' }}>Average Latency</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{currentNode.latency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#9CA3AF' }}>HTTP Status</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>200 OK</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#9CA3AF' }}>AWS Region</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>ap-south-1 (Mumbai)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#9CA3AF' }}>Trace Sample Rate</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>100% (High Resolution)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUDWATCH JSON */}
          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                  Official Amazon CloudWatch Dashboard JSON definition ready for SAM or AWS CLI deployment:
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1A73E8',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Dashboard JSON'}</span>
                </button>
              </div>

              <pre style={{
                background: '#060911',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#34D399',
                fontSize: '12px',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                {sampleDashboardJson}
              </pre>
            </div>
          )}

          {/* TAB 4: 3-MINUTE PITCH SCRIPT */}
          {activeTab === 'pitch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px 18px',
                background: 'rgba(26,115,232,0.1)',
                border: '1px solid rgba(26,115,232,0.3)',
                borderRadius: '10px',
                color: '#93C5FD',
                fontSize: '13px',
                lineHeight: 1.5
              }}>
                🎯 <b>Judges Winning Pitch Blueprint</b> — Demonstrates real architectural depth, live AWS serverless integration, and high empathy for urban Indian commuters.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#131A29', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #EF4444' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>
                    0:00 – 0:40 (The Problem & Empathy)
                  </div>
                  <div style={{ fontSize: '13px', color: '#D1D5DB', marginTop: '6px', lineHeight: 1.5 }}>
                    "Judges, how many of you have driven into a flooded underpass in Bangalore or Delhi because Google Maps only showed 'Heavy Traffic'? You enter, your engine sucks in water, stalls, and you're left with a ₹1 Lakh repair bill. Google Maps knows speed; it has zero clue about water depth."
                  </div>
                </div>

                <div style={{ background: '#131A29', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#F59E0B' }}>
                    0:40 – 1:20 (Live Demo: Ingestion & Vision)
                  </div>
                  <div style={{ fontSize: '13px', color: '#D1D5DB', marginTop: '6px', lineHeight: 1.5 }}>
                    "Here is JalMarg. Watch our Strands OSINT agent detect an urgent tweet from Silk Board. Or watch what happens when a commuter uploads a photo of an underpass: our SageMaker depth model detects the submerged car wheels and calculates water depth at 46 cm within 1.2 seconds."
                  </div>
                </div>

                <div style={{ background: '#131A29', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #10B981' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
                    1:20 – 2:00 (Vehicle-Specific Routing & Hands-Free Audio)
                  </div>
                  <div style={{ fontSize: '13px', color: '#D1D5DB', marginTop: '6px', lineHeight: 1.5 }}>
                    "Watch the route line. For a Thar or Bus, the road is passable. But switch to 2-Wheeler: it immediately diverts over the flyover. And for delivery gig workers who can't look at screens in torrential rain, listen to this Amazon Polly voice warning in Hindi."
                  </div>
                </div>

                <div style={{ background: '#131A29', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #3B82F6' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#3B82F6' }}>
                    2:00 – 2:40 (The AWS Architectural Muscle)
                  </div>
                  <div style={{ fontSize: '13px', color: '#D1D5DB', marginTop: '6px', lineHeight: 1.5 }}>
                    "This isn't a surface-level demo. We use AWS Step Functions to orchestrate our Strands Agents, Amazon OpenSearch for sub-millisecond polygon avoidance, Amazon Location Service for routing, and Cedar to ensure fraudulent reports cannot maliciously close city streets."
                  </div>
                </div>

                <div style={{ background: '#131A29', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #8B5CF6' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#8B5CF6' }}>
                    2:40 – 3:00 (The Vision for Bharat)
                  </div>
                  <div style={{ fontSize: '13px', color: '#D1D5DB', marginTop: '6px', lineHeight: 1.5 }}>
                    "JalMarg protects delivery workers, saves personal vehicles, and equips municipal corporations with automated pump dispatch data. This is real, scalable climate resilience for urban Bharat."
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
