import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sensorService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import {
  Wifi,
  WifiOff,
  Cpu,
  Database,
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Code,
  FlaskConical,
  Trash2,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const StatusPill = ({ status, text }) => {
  const map = {
    GREEN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    YELLOW: 'bg-amber-100 text-amber-800 border-amber-300',
    RED: 'bg-red-100 text-red-800 border-red-300',
    GRAY: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] || map.GRAY}`}>
      {text}
    </span>
  );
};

const LiveSensorMonitor = () => {
  const socket = useSocket();

  // Connection & Backend Health States
  const [apiHealth, setApiHealth] = useState({ online: false, dbConnected: false, offlineThresholdMs: 30000 });
  const [socketConnected, setSocketConnected] = useState(() => Boolean(socket?.connected));

  // Telemetry & Payload States
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [totalPayloads, setTotalPayloads] = useState(0);
  const [failedPayloads, setFailedPayloads] = useState(0);
  const [lastPayloadTime, setLastPayloadTime] = useState(null);
  const [lastDbUpdateTime, setLastDbUpdateTime] = useState(null);

  // Reaction State Tracking
  const [currentState, setCurrentState] = useState('OFFLINE'); // AVAILABLE | OCCUPIED | RESERVED | OFFLINE | INVALID_READING
  const [previousState, setPreviousState] = useState('OFFLINE');
  const [lastTransitionTime, setLastTransitionTime] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Synthetic Test State
  const [syntheticTestActive, setSyntheticTestActive] = useState(false);
  const [syntheticLog, setSyntheticLog] = useState([]);
  const [syntheticState, setSyntheticState] = useState(null);

  const transitionTimeoutRef = useRef(null);

  // 1. Fetch System & Database Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await sensorService.getHealth();
      setApiHealth({
        online: true,
        dbConnected: res.data.dbConnected,
        offlineThresholdMs: res.data.offlineThresholdMs || 30000
      });
    } catch {
      setApiHealth(prev => ({ ...prev, online: false, dbConnected: false }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // 2. Real-Time Socket Event Handling
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleTelemetry = (payload) => {
      const now = new Date();
      setLastPayloadTime(now);
      setTotalPayloads(prev => prev + 1);

      if (payload.stages?.dbUpdated) {
        setLastDbUpdateTime(new Date(payload.dbUpdatedAt || now));
      }

      setLatestTelemetry(payload);

      // Trigger UI reaction state
      const targetSlotStatus = payload.slot?.status || (payload.rawPayload?.occupied ? 'OCCUPIED' : 'AVAILABLE');

      setCurrentState(prev => {
        if (prev !== targetSlotStatus) {
          setPreviousState(prev);
          setLastTransitionTime(now);
          setIsTransitioning(true);
          if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
          transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 2000);
        }
        return targetSlotStatus;
      });

      // Append to live chronological log
      const newEntry = {
        id: Date.now() + Math.random(),
        timestamp: now,
        source: payload.source || (payload.isPhysicalSensor ? 'PHYSICAL SENSOR' : 'SIMULATOR'),
        sensorId: payload.sensor?.sensorId || payload.rawPayload?.sensorId || 'N/A',
        slotId: payload.slot?.slotId || payload.rawPayload?.slotId || 'N/A',
        distance: payload.rawPayload?.distance,
        occupied: payload.rawPayload?.occupied,
        status: targetSlotStatus,
        dbUpdated: Boolean(payload.stages?.dbUpdated),
        isSynthetic: false
      };

      setEventLog(prev => [newEntry, ...prev.slice(0, 49)]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('sensorTelemetry', handleTelemetry);

    // Fallback if sensorUpdated is fired independently
    socket.on('sensorUpdated', () => {
      setLastPayloadTime(new Date());
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('sensorTelemetry', handleTelemetry);
      socket.off('sensorUpdated');
    };
  }, [socket]);

  // 3. Stale Data & Offline Detector
  const staleThresholdSec = Math.round((apiHealth.offlineThresholdMs || 30000) / 1000);
  const secondsSincePayload = lastPayloadTime ? Math.floor((new Date() - new Date(lastPayloadTime)) / 1000) : null;
  const isStale = secondsSincePayload !== null && secondsSincePayload > staleThresholdSec;

  // Determine Hardware Connectivity Pill State
  let sensorConnectStatus = 'GRAY';
  let sensorConnectText = 'Waiting for first payload';

  if (lastPayloadTime) {
    if (isStale) {
      sensorConnectStatus = 'YELLOW';
      sensorConnectText = `STALE (${secondsSincePayload}s ago)`;
    } else {
      sensorConnectStatus = 'GREEN';
      sensorConnectText = `ONLINE (${secondsSincePayload}s ago)`;
    }
  }

  // 4. Synthetic Test Runner
  const runSyntheticScenario = (type) => {
    setSyntheticTestActive(true);
    const now = new Date();

    let simStatus = 'AVAILABLE';
    let simDistance = 25;
    let simOccupied = false;
    let label = '';

    if (type === 'OCCUPIED_FLOW') {
      label = 'Scenario: Vehicle Arrival (OCCUPIED)';
      simStatus = 'OCCUPIED';
      simDistance = 4;
      simOccupied = true;
    } else if (type === 'RESERVED_FLOW') {
      label = 'Scenario: Reserved Slot Verification';
      simStatus = 'RESERVED';
      simDistance = 30;
      simOccupied = false;
    } else if (type === 'INVALID_READING') {
      label = 'Scenario: Invalid Sensor Distance (-1 cm / Timeout)';
      simStatus = 'INVALID_READING';
      simDistance = -1;
      simOccupied = false;
      setFailedPayloads(prev => prev + 1);
    } else if (type === 'STALE_OFFLINE') {
      label = 'Scenario: Sensor Disconnection / Timeout';
      simStatus = 'OFFLINE';
      simDistance = 0;
      simOccupied = false;
    }

    setSyntheticState(simStatus);

    const syntheticEntry = {
      id: 'SYNTH-' + Date.now(),
      timestamp: now,
      source: 'SYNTHETIC TEST DATA',
      sensorId: 'TEST-SN-001',
      slotId: 'TEST-SLOT-01',
      distance: simDistance,
      occupied: simOccupied,
      status: simStatus,
      dbUpdated: false,
      isSynthetic: true,
      label
    };

    setSyntheticLog(prev => [syntheticEntry, ...prev]);
  };

  const activeSlotState = syntheticTestActive ? (syntheticState || 'OFFLINE') : (isStale ? 'OFFLINE' : currentState);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Live Sensor Monitor</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1.5">
              <Zap size={14} className="animate-pulse" /> Real-time Telemetry
            </span>
          </div>
          <p className="text-gray-500 mt-1">Verify end-to-end payload routing, database updates, and UI reaction from physical ESP8266 nodes</p>
        </div>

        <button
          onClick={checkHealth}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-2xl hover:bg-gray-50 transition-colors shadow-xs text-sm font-semibold cursor-pointer"
        >
          <RotateCcw size={16} /> Re-check Health
        </button>
      </div>

      {/* 1. REAL-TIME CONNECTION STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ESP8266 Sensor Connectivity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Cpu size={24} />
            </div>
            <StatusPill status={sensorConnectStatus} text={sensorConnectText} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ESP8266 Node Status</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {latestTelemetry?.sensor?.sensorId || 'No Physical Sensor'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              IP: {latestTelemetry?.sensor?.ipAddress || latestTelemetry?.rawPayload?.ipAddress || '---.---.---.---'}
            </p>
          </div>
        </div>

        {/* Backend API Connectivity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Server size={24} />
            </div>
            <StatusPill
              status={apiHealth.online ? 'GREEN' : 'RED'}
              text={apiHealth.online ? 'API ONLINE' : 'API OFFLINE'}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Node.js / Express API</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {apiHealth.online ? 'HTTP Endpoint Reachable' : 'Backend Disconnected'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Port 5002 | Route: /api/sensors/update</p>
          </div>
        </div>

        {/* MongoDB Database Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database size={24} />
            </div>
            <StatusPill
              status={apiHealth.dbConnected ? 'GREEN' : 'RED'}
              text={apiHealth.dbConnected ? 'DB CONNECTED' : 'DB ERROR'}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">MongoDB Persistence</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {apiHealth.dbConnected ? 'Database Operational' : 'Database Offline'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Last DB Update: {lastDbUpdateTime ? format(lastDbUpdateTime, 'HH:mm:ss') : 'None'}
            </p>
          </div>
        </div>

        {/* Socket.IO Real-Time Stream */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Radio size={24} />
            </div>
            <StatusPill
              status={socketConnected ? 'GREEN' : 'RED'}
              text={socketConnected ? 'SOCKET LIVE' : 'SOCKET DISCONNECTED'}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Socket.IO Stream</p>
            <h3 className="text-lg font-bold text-gray-900 mt-1">
              {socketConnected ? 'Websocket Channel Open' : 'Stream Closed'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Events: sensorTelemetry, slotUpdated</p>
          </div>
        </div>
      </div>

      {/* 2. END-TO-END PAYLOAD VERIFICATION PIPELINE TRACE */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Activity size={18} className="text-parknest-blue" />
          End-to-End Pipeline Verification Stages
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${latestTelemetry?.stages?.payloadReceived ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            <CheckCircle2 size={20} className={latestTelemetry?.stages?.payloadReceived ? 'text-emerald-600' : 'text-gray-400'} />
            <div>
              <p className="text-xs font-bold uppercase">1. Payload Received</p>
              <p className="text-xs opacity-80">{latestTelemetry ? 'HTTP POST Verified' : 'Awaiting POST'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${latestTelemetry?.stages?.payloadValidated ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            <CheckCircle2 size={20} className={latestTelemetry?.stages?.payloadValidated ? 'text-emerald-600' : 'text-gray-400'} />
            <div>
              <p className="text-xs font-bold uppercase">2. Validated Schema</p>
              <p className="text-xs opacity-80">{latestTelemetry ? 'Range & Types Valid' : 'Awaiting Validation'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${latestTelemetry?.stages?.dbUpdated ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            <CheckCircle2 size={20} className={latestTelemetry?.stages?.dbUpdated ? 'text-emerald-600' : 'text-gray-400'} />
            <div>
              <p className="text-xs font-bold uppercase">3. MongoDB Saved</p>
              <p className="text-xs opacity-80">{lastDbUpdateTime ? 'Doc Persisted' : 'Awaiting Save'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${socketConnected && latestTelemetry ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            <CheckCircle2 size={20} className={socketConnected && latestTelemetry ? 'text-emerald-600' : 'text-gray-400'} />
            <div>
              <p className="text-xs font-bold uppercase">4. Socket Broadcast</p>
              <p className="text-xs opacity-80">{latestTelemetry ? 'Client Received' : 'Awaiting Event'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROMINENT LIVE UI REACTION VISUAL & LATEST PAYLOAD PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Slot Reaction Card */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center border-b pb-4 border-gray-100">
            <div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Target Slot Reaction</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {syntheticTestActive ? 'TEST-SLOT-01' : (latestTelemetry?.slot?.slotId || 'PN-A-001')}
              </h2>
            </div>

            {syntheticTestActive ? (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold border border-purple-300">
                SYNTHETIC TEST
              </span>
            ) : latestTelemetry?.isPhysicalSensor ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300 flex items-center gap-1">
                <Wifi size={12} /> PHYSICAL SENSOR
              </span>
            ) : latestTelemetry?.isSimulator ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
                SIMULATOR DATA
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-300">
                NO SOURCE
              </span>
            )}
          </div>

          {/* Prominent Slot Status Box */}
          <div className={`p-8 rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center space-y-4 text-center ${
            isTransitioning ? 'ring-4 ring-blue-400 ring-offset-2 animate-bounce' : ''
          } ${
            activeSlotState === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
            activeSlotState === 'OCCUPIED' ? 'bg-red-50 border-red-400 text-red-900' :
            activeSlotState === 'RESERVED' ? 'bg-amber-50 border-amber-400 text-amber-900' :
            activeSlotState === 'INVALID_READING' ? 'bg-purple-50 border-purple-400 text-purple-900' :
            'bg-gray-100 border-gray-300 text-gray-700'
          }`}>
            <span className="text-xs font-bold uppercase tracking-widest opacity-75">Live Slot State</span>
            <h1 className="text-4xl font-extrabold tracking-tight">
              {activeSlotState === 'INVALID_READING' ? 'SENSOR ERROR' : activeSlotState}
            </h1>

            <div className="flex items-center gap-2 text-sm font-semibold mt-2">
              <span>Distance Reading:</span>
              <span className="font-mono bg-white px-3 py-1 rounded-lg border border-gray-200">
                {syntheticTestActive
                  ? (syntheticState === 'INVALID_READING' ? '-1 cm (ERROR)' : '25 cm')
                  : (latestTelemetry?.rawPayload?.distance !== undefined ? `${latestTelemetry.rawPayload.distance} cm` : '---')}
              </span>
            </div>
          </div>

          {/* Transition History Tracker */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">State Transition:</span>
              <span className="font-bold text-gray-800 font-mono">
                {previousState} &rarr; {activeSlotState}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Last Transition Time:</span>
              <span className="text-gray-700 font-mono">
                {lastTransitionTime ? format(lastTransitionTime, 'HH:mm:ss.SSS') : 'No state transitions yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Latest Payload JSON Panel */}
        <div className="lg:col-span-7 bg-gray-900 text-gray-100 p-6 rounded-3xl border border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-emerald-400" />
              <h3 className="font-bold text-sm text-gray-200">Latest Received Payload (JSON)</h3>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {lastPayloadTime ? format(lastPayloadTime, 'yyyy-MM-dd HH:mm:ss') : 'Waiting for payload...'}
            </span>
          </div>

          <pre className="font-mono text-xs text-emerald-400 bg-black/50 p-4 rounded-2xl overflow-x-auto min-h-[200px] border border-gray-800 leading-relaxed">
            {latestTelemetry ? JSON.stringify(latestTelemetry, null, 2) : '// Waiting for physical or simulated ESP8266 HTTP POST payload...\n{\n  "status": "WAITING_FOR_DATA"\n}'}
          </pre>

          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
            <span>Total Payloads Received: <strong className="text-white">{totalPayloads}</strong></span>
            <span>Failed / Invalid: <strong className="text-red-400">{failedPayloads}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. MANUAL TESTING CONTROLS (SYNTHETIC UI TESTS) */}
      <div className="bg-purple-900/5 p-8 rounded-3xl border border-purple-200/60 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-900">
              <FlaskConical size={22} />
              <h3 className="text-xl font-bold">Manual UI Reaction Testing Controls</h3>
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Trigger isolated synthetic test events to verify visual UI reactions. These tests operate strictly in the browser and will NEVER alter database records or real sensor state.
            </p>
          </div>

          {syntheticTestActive && (
            <button
              onClick={() => { setSyntheticTestActive(false); setSyntheticState(null); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-xs"
            >
              Resume Real Telemetry Mode
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => runSyntheticScenario('OCCUPIED_FLOW')}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
          >
            <Play size={14} /> Test: Vehicle Arrival (OCCUPIED)
          </button>

          <button
            onClick={() => runSyntheticScenario('RESERVED_FLOW')}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
          >
            <Play size={14} /> Test: Reserved Slot State
          </button>

          <button
            onClick={() => runSyntheticScenario('INVALID_READING')}
            className="flex items-center gap-2 bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-purple-800 transition-colors shadow-xs cursor-pointer"
          >
            <AlertCircle size={14} /> Test: Invalid Distance (-1 cm)
          </button>

          <button
            onClick={() => runSyntheticScenario('STALE_OFFLINE')}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            <WifiOff size={14} /> Test: Stale Sensor Offline
          </button>

          <button
            onClick={() => setSyntheticLog([])}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Trash2 size={14} /> Clear Test Log
          </button>
        </div>
      </div>

      {/* 5. CHRONOLOGICAL LIVE EVENT LOG */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Chronological Telemetry Event Log</h3>
            <p className="text-xs text-gray-500 mt-1">Real-time incoming updates logged in order of arrival</p>
          </div>
          <button
            onClick={() => setEventLog([])}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 font-semibold"
          >
            <Trash2 size={14} /> Clear Event Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source Tag</th>
                <th className="px-4 py-3">Sensor ID</th>
                <th className="px-4 py-3">Slot ID</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Occupied</th>
                <th className="px-4 py-3">Status Result</th>
                <th className="px-4 py-3">DB Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-mono">
              {syntheticLog.map((log) => (
                <tr key={log.id} className="bg-purple-50/50 hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-purple-900">{format(log.timestamp, 'HH:mm:ss.SSS')}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold text-[10px]">SYNTHETIC TEST</span></td>
                  <td className="px-4 py-3 text-purple-800">{log.sensorId}</td>
                  <td className="px-4 py-3 text-purple-800">{log.slotId}</td>
                  <td className="px-4 py-3 text-purple-800">{log.distance} cm</td>
                  <td className="px-4 py-3 text-purple-800">{log.occupied ? 'YES' : 'NO'}</td>
                  <td className="px-4 py-3"><StatusPill status="YELLOW" text={log.status} /></td>
                  <td className="px-4 py-3 text-gray-400">N/A (UI ONLY)</td>
                </tr>
              ))}

              {eventLog.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{format(log.timestamp, 'HH:mm:ss.SSS')}</td>
                  <td className="px-4 py-3">
                    {log.source === 'PHYSICAL SENSOR' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">PHYSICAL SENSOR</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">SIMULATOR</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{log.sensorId}</td>
                  <td className="px-4 py-3 text-gray-800">{log.slotId}</td>
                  <td className="px-4 py-3 text-gray-800">{log.distance !== undefined ? `${log.distance} cm` : 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-800">{log.occupied ? 'YES' : 'NO'}</td>
                  <td className="px-4 py-3"><StatusPill status={log.status === 'AVAILABLE' ? 'GREEN' : log.status === 'OCCUPIED' ? 'RED' : 'YELLOW'} text={log.status} /></td>
                  <td className="px-4 py-3 text-emerald-600 font-bold">{log.dbUpdated ? '✓ PERSISTED' : 'PENDING'}</td>
                </tr>
              ))}

              {eventLog.length === 0 && syntheticLog.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400 italic">
                    Waiting for first live sensor telemetry payload...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveSensorMonitor;
